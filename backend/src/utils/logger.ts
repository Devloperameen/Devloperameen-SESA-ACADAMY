import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, errors, json, colorize, printf } = format;

// Pretty console format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
    ),
    defaultMeta: { service: 'sesa-backend' },
    transports: [
        // Write errors to a file
        new transports.File({
            filename: path.join(__dirname, '../../error.log'),
            level: 'error',
            format: json(),
        }),
        // Write all logs to combined.log in production
        new transports.File({
            filename: path.join(__dirname, '../../combined.log'),
            format: json(),
        }),
    ],
    exitOnError: false,
});

// In development, also log to the console with color
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'HH:mm:ss' }),
            devFormat
        ),
    }));
} else {
    // In production, log to console in JSON (for log aggregators like Datadog)
    logger.add(new transports.Console({
        format: json(),
    }));
}

export default logger;

// Stream for Morgan HTTP logger
export const morganStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};
