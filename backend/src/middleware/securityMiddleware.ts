// Comprehensive Security Middleware
import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

const sanitizedOrigins = (process.env.CORS_ORIGIN?.split(',') || []) as string[];
    
    // Enhanced CORS configuration for production
export const corsConfig = cors({
    origin: process.env.NODE_ENV === 'production' 
        ? sanitizedOrigins
        : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: process.env.NODE_ENV === 'production' ? 86400 : 0, // 24 hours for production
});

// Enhanced security headers
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://www.youtube.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", process.env.NODE_ENV === 'production' ? "https://your-backend.onrender.com" : "ws://localhost:5000"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    crossOriginResourcePolicy: false,
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false,
    noSniff: true,
    xFrameOptions: {
        action: 'deny'
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
});

// Request logging and monitoring
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Log suspicious activities
    const suspiciousPatterns = [
        /\bunion\b.*\bselect\b/i,
        /\bdrop\b.*\btable\b/i,
        /\binsert\b.*\binto\b/i,
        /\bdelete\b.*\bfrom\b/i,
        /<script\b/i,
        /javascript:/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
    );
    
    if (isSuspicious) {
        console.warn(`🚨 Suspicious request detected: ${timestamp} - IP: ${ip} - URL: ${req.url} - UA: ${userAgent}`);
    }
    
    // Rate limiting by endpoint type
    const endpointType = req.url.includes('/auth') ? 'auth' : 
                          req.url.includes('/upload') ? 'upload' : 'general';
    
    console.log(`${timestamp} - ${endpointType.toUpperCase()} - ${req.method} ${req.url} - ${ip}`);
    
    next();
};

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Remove potential XSS from request body
    if (req.body) {
        const sanitizeString = (str: string): string => {
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        };
        
        const sanitizeObject = (obj: any): any => {
            if (typeof obj === 'object' && obj !== null) {
                const sanitized: any = {};
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        sanitized[key] = sanitizeString(obj[key]);
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitized[key] = sanitizeObject(obj[key]);
                    } else {
                        sanitized[key] = obj[key];
                    }
                }
                return sanitized;
            }
            return obj;
        };
        
        req.body = sanitizeObject(req.body);
    }
    
    next();
};

// API versioning and deprecation handling
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = req.headers['api-version'];
    const supportedVersions = ['v1', 'v2'];
    
    if (apiVersion && !supportedVersions.includes(apiVersion)) {
        return res.status(400).json({
            success: false,
            message: `Unsupported API version: ${apiVersion}`,
            supportedVersions,
            latestVersion: 'v2'
        });
    }
    
    // Add version info to response headers
    res.setHeader('API-Version', 'v2');
    res.setHeader('API-Deprecated', apiVersion === 'v1' ? 'true' : 'false');
    
    next();
};    
