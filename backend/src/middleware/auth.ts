// Enhanced rate limiting with different limits for different endpoints
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// General API rate limit
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 auth attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts, please try again after 15 minutes',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Upload rate limit
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Only 50 uploads per hour
    message: {
        error: 'Too many upload attempts, please try again after 1 hour',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

interface JwtPayload {
    user: {
        id: string;
        role: string;
    };
}

const normalizeRole = (role: string): string => {
    if (role === 'instructor') return 'teacher';
    return role;
};

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured in production');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // The payload is { user: { id, role } }
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

// Optional auth: attaches req.user when token is valid, otherwise continues as anonymous.
export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return next();
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_not_for_prod';
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded.user;
    } catch (_err) {
        // Ignore invalid tokens in optional mode and treat request as anonymous.
    }

    next();
};

export const checkRole = (roles: string[]) => {
    const normalizedAllowed = roles.map(normalizeRole);

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role === 'super_admin') {
            return next();
        }

        const normalizedUserRole = normalizeRole(req.user.role);
        if (!normalizedAllowed.includes(normalizedUserRole)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

// Backward-compatible alias for existing route guards.
export const authorize = (roles: string[]) => checkRole(roles);
