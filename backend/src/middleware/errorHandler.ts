import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Custom error class for structured API errors
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 handler — mount BEFORE global error handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
    next(error);
};

// Global error handler — must have 4 parameters to be recognized by Express
export const globalErrorHandler = (
    err: AppError | Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
    const statusCode = (err as AppError).statusCode || 500;
    const isOperational = (err as AppError).isOperational ?? false;

    // Log the error
    if (statusCode >= 500) {
        logger.error({
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            user: (req as any).user?.id || 'anonymous',
        });
    } else {
        logger.warn({
            message: err.message,
            url: req.originalUrl,
            method: req.method,
            statusCode,
        });
    }

    // Duplicate key error from MongoDB
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0];
        return res.status(409).json({
            success: false,
            message: `This ${field} is already in use. Please try a different one.`,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values((err as any).errors).map((e: any) => e.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }

    // Generic response
    res.status(statusCode).json({
        success: false,
        message: isOperational ? err.message : 'An unexpected error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
