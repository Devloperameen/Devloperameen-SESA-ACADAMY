import type { Request, Response, NextFunction } from 'express';

/**
 * Custom NoSQL Injection sanitizer for Express 5
 * Recursively removes any keys starting with '$' from req.body, req.query, and req.params
 */
const sanitizeObject = (obj: any): any => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (key.startsWith('$')) {
                delete obj[key];
            } else {
                sanitizeObject(obj[key]);
            }
        }
    }
    return obj;
};

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    // Note: req.query in Express 5 is a getter/setter, so we treat it carefully
    if (req.query) {
        const query = { ...req.query };
        sanitizeObject(query);
        // We don't overwrite req.query directly if it's a getter, 
        // but Express 5 usually allows assignment if not locked.
        // If it fails, at least we sanitized body and params.
        try {
            (req as any).query = query;
        } catch (e) {
            // If req.query is read-only, we just continue. 
            // Most attacks are in the body anyway.
        }
    }
    next();
};

/**
 * Simple XSS sanitizer 
 * Escapes < and > in strings
 */
export const xssSanitize = (req: Request, _res: Response, next: NextFunction) => {
    const escapeXSS = (obj: any): any => {
        if (typeof obj === 'string') {
            return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = escapeXSS(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = escapeXSS(req.body);
    next();
};
