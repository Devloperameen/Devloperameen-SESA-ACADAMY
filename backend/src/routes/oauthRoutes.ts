import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';
import logger from '../utils/logger.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Passport Strategies ───────────────────────────────────────────────────────

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/oauth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error('No email from Google'), undefined);

                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Check if user exists with this email (link accounts)
                    user = await User.findOne({ email });
                    if (user) {
                        user.googleId = profile.id;
                        user.isEmailVerified = true;
                        await user.save();
                    } else {
                        // Create new user
                        user = await User.create({
                            name: profile.displayName || email.split('@')[0],
                            email,
                            googleId: profile.id,
                            authProvider: 'google',
                            isEmailVerified: true,
                            role: UserRole.STUDENT,
                            profileImage: profile.photos?.[0]?.value,
                        });
                        logger.info(`New user created via Google OAuth: ${email}`);
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err as Error, undefined);
            }
        }
    ));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/oauth/github/callback`,
            scope: ['user:email'],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            try {
                const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

                let user = await User.findOne({ githubId: profile.id });

                if (!user) {
                    user = await User.findOne({ email });
                    if (user) {
                        user.githubId = profile.id;
                        user.isEmailVerified = true;
                        await user.save();
                    } else {
                        user = await User.create({
                            name: profile.displayName || profile.username || 'GitHub User',
                            email,
                            githubId: profile.id,
                            authProvider: 'github',
                            isEmailVerified: true,
                            role: UserRole.STUDENT,
                            profileImage: profile.photos?.[0]?.value,
                        });
                        logger.info(`New user created via GitHub OAuth: ${email}`);
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err, undefined);
            }
        }
    ));
}

// Passport serialize/deserialize (required even if not using sessions)
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// ── OAuth helpers ─────────────────────────────────────────────────────────────

const handleOAuthSuccess = async (res: Response, user: any) => {
    const accessToken = jwt.sign(
        { user: { id: user.id, role: user.role } },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { user: { id: user.id, role: user.role } },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    await User.findByIdAndUpdate(user.id, { $push: { refreshTokens: refreshToken } });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with token — frontend reads from URL param and stores it
    res.redirect(`${FRONTEND_URL}/oauth-callback?token=${accessToken}&provider=success`);
};

// ── Google OAuth Routes ───────────────────────────────────────────────────────

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google_failed`, session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handleOAuthSuccess(res, req.user as any);
        } catch (err) {
            next(err);
        }
    }
);

// ── GitHub OAuth Routes ───────────────────────────────────────────────────────

router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=github_failed`, session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handleOAuthSuccess(res, req.user as any);
        } catch (err) {
            next(err);
        }
    }
);

export { passport };
export default router;
