import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User, { UserRole } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
} from '../services/emailService.js';

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

const generateTokens = (userId: string, role: string) => {
    const accessToken = jwt.sign(
        { user: { id: userId, role } },
        JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );
    const refreshToken = jwt.sign(
        { user: { id: userId, role } },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );
    return { accessToken, refreshToken };
};

const setRefreshCookie = (res: Response, token: string) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,       // Not accessible from JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, send verification email
 * @access  Public
 */
router.post('/register',
    [
        body('name', 'Name is required').trim().notEmpty().isLength({ max: 80 }).escape(),
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password must be at least 8 characters with a number').isLength({ min: 8 }).matches(/\d/),
        body('role').optional().isIn([UserRole.STUDENT, UserRole.INSTRUCTOR]),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password } = req.body;
            const role = req.body.role || UserRole.STUDENT;

            if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
                return next(new AppError('Admin accounts cannot be self-registered.', 403));
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return next(new AppError('An account with this email already exists.', 409));
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = new User({ name, email, password: hashedPassword, role, authProvider: 'local' });

            // Generate email verification token
            const verifyToken = (user as any).generateEmailVerificationToken();
            await user.save();

            // Send verification email (don't block registration if email fails)
            try {
                await sendVerificationEmail(email, name, verifyToken);
            } catch (emailErr) {
                logger.warn(`Could not send verification email to ${email}`);
            }

            const { accessToken, refreshToken } = generateTokens(user.id, user.role);

            // Store hashed refresh token
            await User.findByIdAndUpdate(user.id, { $push: { refreshTokens: refreshToken } });

            setRefreshCookie(res, refreshToken);

            res.status(201).json({
                success: true,
                message: 'Account created! Please check your email to verify your account.',
                token: accessToken,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, handle lockout, return tokens
 * @access  Public
 */
router.post('/login',
    [
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password is required').exists(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            // Fetch user with password and refresh tokens
            // For legacy support, we search for authProvider: 'local' OR where authProvider doesn't exist
            const user = await User.findOne({ 
                email, 
                $or: [{ authProvider: 'local' }, { authProvider: { $exists: false } }] 
            }).select('+password +refreshTokens');
            if (!user) {
                return next(new AppError('Invalid credentials.', 401));
            }

            // Check if account is locked
            if ((user as any).isLocked()) {
                const unlockTime = new Date(user.lockUntil!).toLocaleTimeString();
                return next(new AppError(`Account is locked due to too many failed attempts. Try again after ${unlockTime}.`, 423));
            }

            const isMatch = await bcrypt.compare(password, user.password!);
            if (!isMatch) {
                // Increment failed attempts
                const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                const update: any = { failedLoginAttempts: failedAttempts };

                if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                    update.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                    logger.warn(`Account locked for ${email} after ${failedAttempts} failed attempts`);
                }

                await User.findByIdAndUpdate(user.id, update);
                return next(new AppError('Invalid credentials.', 401));
            }

            // Successful login — reset failed attempts
            const { accessToken, refreshToken } = generateTokens(user.id, user.role);

            await User.findByIdAndUpdate(user.id, {
                failedLoginAttempts: 0,
                lockUntil: undefined,
                lastLogin: new Date(),
                lastLoginIP: req.ip,
                $push: { refreshTokens: refreshToken },
            });

            setRefreshCookie(res, refreshToken);

            res.json({
                success: true,
                token: accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    subscriptionPlan: user.subscriptionPlan,
                    profileImage: user.profileImage,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Issue new access token using refresh token from cookie
 * @access  Public (uses httpOnly cookie)
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return next(new AppError('No refresh token provided.', 401));

        // Verify the refresh token
        let payload: any;
        try {
            payload = jwt.verify(token, JWT_REFRESH_SECRET);
        } catch {
            return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
        }

        // Check token exists in DB (rotation check)
        const user = await User.findById(payload.user.id).select('+refreshTokens');
        if (!user || !user.refreshTokens.includes(token)) {
            // Possible token reuse — clear all refresh tokens (security measure)
            if (user) await User.findByIdAndUpdate(user.id, { refreshTokens: [] });
            return next(new AppError('Refresh token reuse detected. Please log in again.', 401));
        }

        // Rotate: remove old, issue new
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

        await User.findByIdAndUpdate(user.id, {
            $pull: { refreshTokens: token },
            $push: { refreshTokens: newRefreshToken },
        });

        setRefreshCookie(res, newRefreshToken);

        res.json({ success: true, token: accessToken });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke refresh token, clear cookie
 * @access  Public
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            // Remove this specific refresh token from DB
            const payload: any = jwt.decode(token);
            if (payload?.user?.id) {
                await User.findByIdAndUpdate(payload.user.id, { $pull: { refreshTokens: token } });
            }
        }
        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/auth/verify-email?token=...
 * @desc    Verify email address using token from email link
 * @access  Public
 */
router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return next(new AppError('Invalid verification link.', 400));
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: new Date() },
        }).select('+emailVerificationToken +emailVerificationExpiry');

        if (!user) {
            return next(new AppError('Verification link is invalid or has expired. Please request a new one.', 400));
        }

        user.isEmailVerified = true;
        (user as any).emailVerificationToken = undefined;
        (user as any).emailVerificationExpiry = undefined;
        await user.save();

        // Send welcome email
        try { await sendWelcomeEmail(user.email, user.name); } catch {}

        res.json({ success: true, message: 'Email verified successfully! You can now access all features.' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 */
router.post('/resend-verification',
    [body('email').isEmail().normalizeEmail()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                // Don't reveal if email exists
                return res.json({ success: true, message: 'If an account exists, a verification email has been sent.' });
            }
            if (user.isEmailVerified) {
                return res.json({ success: true, message: 'This email is already verified.' });
            }

            const verifyToken = (user as any).generateEmailVerificationToken();
            await user.save();
            await sendVerificationEmail(user.email, user.name, verifyToken);

            res.json({ success: true, message: 'Verification email sent! Please check your inbox.' });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
    [body('email').isEmail().normalizeEmail()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await User.findOne({ email: req.body.email, authProvider: 'local' });

            // Always respond the same (security: don't reveal if email exists)
            const genericResponse = { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };

            if (!user) return res.json(genericResponse);

            const resetToken = (user as any).generatePasswordResetToken();
            await user.save();

            try {
                await sendPasswordResetEmail(user.email, user.name, resetToken);
            } catch (emailErr) {
                // Revert token if email fails
                (user as any).passwordResetToken = undefined;
                (user as any).passwordResetExpiry = undefined;
                await user.save();
                return next(new AppError('Could not send the reset email. Please try again later.', 500));
            }

            res.json(genericResponse);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post('/reset-password',
    [
        body('token').notEmpty(),
        body('password', 'Password must be at least 8 characters with a number').isLength({ min: 8 }).matches(/\d/),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, password } = req.body;
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpiry: { $gt: new Date() },
            }).select('+passwordResetToken +passwordResetExpiry');

            if (!user) {
                return next(new AppError('Password reset link is invalid or has expired. Please request a new one.', 400));
            }

            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(password, salt);
            (user as any).passwordResetToken = undefined;
            (user as any).passwordResetExpiry = undefined;
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;
            user.refreshTokens = []; // Invalidate all sessions for security
            await user.save();

            logger.info(`Password reset successful for ${user.email}`);
            res.json({ success: true, message: 'Password reset successful! Please log in with your new password.' });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile (requires access token in Authorization header)
 * @access  Private  
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return next(new AppError('No token provided.', 401));

        const token = authHeader.split(' ')[1];
        const payload: any = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(payload.user.id).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
        if (!user) return next(new AppError('User not found.', 404));

        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

export default router;
