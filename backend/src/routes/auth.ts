import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User, { UserRole } from '../models/User.js';

const router = express.Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        body('name', 'Name is required').trim().notEmpty().escape(),
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        body('role', 'Valid role is required').optional().isIn([UserRole.STUDENT, UserRole.INSTRUCTOR])
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const { name, email, password } = req.body;
            const role = req.body.role || UserRole.STUDENT;

            if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
                return res.status(403).json({ message: 'Admin accounts cannot be created through registration.' });
            }

            // Check if user exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Secure hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                name,
                email,
                password: hashedPassword,
                role
            });

            await user.save();

            // Create JWT
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_not_for_prod';

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '8h' }, // Shorter, more secure expiry
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            id: user?._id,
                            name: user?.name,
                            email: user?.email,
                            role: user?.role
                        }
                    });
                }
            );
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password is required').exists()
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Match password
            const isMatch = await bcrypt.compare(password, user.password!);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Create JWT
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_not_for_prod';

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '8h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    });
                }
            );
        } catch (err: any) {
            console.error(err.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

export default router;
