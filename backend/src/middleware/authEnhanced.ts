// Enhanced Authentication & Security Middleware
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

// Enhanced rate limiting with different limits for different endpoints
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
        email?: string;
        name?: string;
        tokenIssuedAt?: Date;
        tokenExpiresAt?: Date;
    };
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

interface JwtPayload {
    user: {
        id: string;
        role: string;
        email?: string;
        name?: string;
    };
    iat: number; // Issued at timestamp
    exp: number; // Expires at timestamp
}

// Enhanced input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Enhanced authentication with security features
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT_SECRET is configured
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured in production');
            return res.status(500).json({ 
                success: false,
                message: 'Server configuration error',
                code: 'CONFIG_ERROR'
            });
        }

        // Verify token with enhanced error handling
        const decoded = jwt.verify(token, secret) as JwtPayload;
        
        // Attach enhanced user info to request
        req.user = {
            ...decoded.user,
            tokenIssuedAt: new Date(decoded.iat * 1000),
            tokenExpiresAt: new Date(decoded.exp * 1000)
        };

        // Log authentication for security monitoring
        console.log(`User authenticated: ${decoded.user.id} (${decoded.user.role})`);

        next();
    } catch (err: any) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ 
            success: false,
            message: 'Invalid or expired token',
            code: 'TOKEN_INVALID'
        });
    }
};

// Password strength validation
export const validatePasswordStrength = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
};

// Session management helper
export const invalidateUserSessions = async (userId: string): Promise<void> => {
    // In a real implementation, this would invalidate all user sessions
    // For now, we'll log it for monitoring
    console.log(`Invalidating all sessions for user: ${userId}`);
};

// Role-based access control with enhanced features
export const checkEnhancedPermissions = (userRole: string, requiredPermissions: string[]): boolean => {
    const rolePermissions: Record<string, string[]> = {
        'super_admin': ['read', 'write', 'delete', 'manage_users', 'manage_system'],
        'admin': ['read', 'write', 'delete', 'manage_users'],
        'moderator': ['read', 'write', 'moderate'],
        'instructor': ['read', 'write', 'manage_courses'],
        'student': ['read', 'enroll', 'progress'],
    };

    const userPermissions = rolePermissions[userRole] || [];
    
    return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
    );
};

// Simple role check helper for compatibility with existing code
export const checkRole = (roles: string[]) => {
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userRole = req.user.role.toLowerCase();
        if (normalizedRoles.includes(userRole) || userRole === 'super_admin') {
            return next();
        }

        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    };
};

// Enhanced optional authentication
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continue as anonymous
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;
        
        if (!secret) {
            return next();
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = {
            ...decoded.user,
            tokenIssuedAt: new Date(decoded.iat * 1000),
            tokenExpiresAt: new Date(decoded.exp * 1000)
        };

        next();
    } catch (err) {
        // For optional auth, we don't return error, just continue as anonymous
        console.warn('Optional auth token verification failed:', err);
        next();
    }
};
