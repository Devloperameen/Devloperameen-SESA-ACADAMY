import 'dotenv/config'; // Load env vars before imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import { mongoSanitize, xssSanitize } from './middleware/security.js';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import oauthRoutes, { passport } from './routes/oauthRoutes.js';
import courseRoutes from './routes/courses.js';
import courseManagementRoutes from './routes/courseManagement.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import announcementRoutes from './routes/announcements.js';
import enrollmentRoutes from './routes/enrollments.js';
import progressRoutes from './routes/progress.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import certificateRoutes from './routes/certificates.js';
import adminManagementRoutes from './routes/adminManagement.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import assessmentRoutes from './routes/assessments.js';
import forumRoutes from './routes/forum.js';
import messageRoutes from './routes/messages.js';
import evaluationRoutes from './routes/evaluations.js';
import videoWorkflowRoutes from './routes/videoWorkflowRoutes.js';
import aiRoutes from './routes/ai.js';
import quizRoutes from './routes/quizzes.js';
import assignmentRoutes from './routes/assignments.js';
import gamificationRoutes from './routes/gamification.js';
import aiTutorRoutes from './routes/aiTutor.js';
import collaborationRoutes from './routes/collaboration.js';
import advancedAnalyticsRoutes from './routes/advancedAnalytics.js';
import smartContentRoutes from './routes/smartContent.js';

// ── Utilities & Middleware ────────────────────────────────────────────────────
import logger, { morganStream } from './utils/logger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import http from 'http';
import { initSocket } from './utils/socket.js';
import { fileURLToPath } from 'url';

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Validate critical env vars at startup ─────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
    logger.error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middlewares ──────────────────────────────────────────────────────

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));

// ── CORS Configuration ────────────────────────────────────────────────────────
const getCORSOrigins = () => {
    const originStr = process.env.CORS_ORIGIN;
    const isProd = process.env.NODE_ENV === 'production';

    if (!originStr) {
        if (isProd) {
            logger.warn('CORS_ORIGIN is not set in production. Access will be restricted.');
            return false;
        }
        return '*';
    }
    if (originStr === '*') return '*';
    if (originStr.includes(',')) return originStr.split(',').map(o => o.trim());
    return originStr;
};

const allowedOrigin = getCORSOrigins();
logger.info(`[CORS] Allowed origins: ${Array.isArray(allowedOrigin) ? allowedOrigin.join(', ') : allowedOrigin}`);

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200,
}));

// ── Core Middlewares ──────────────────────────────────────────────────────────
app.use(cookieParser());                  // Parse cookies (needed for refresh tokens)
app.use(compression());                    // Gzip compression
app.use(mongoSanitize);                    // Custom NoSQL injection protection
app.use(xssSanitize);                      // Custom XSS protection
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// XSS protection removed from here as it's now in separate middleware (xssSanitize)


// ── Passport (OAuth) ──────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── HTTP Request Logger ───────────────────────────────────────────────────────
app.use(morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: morganStream }
));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth requests. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many password reset attempts. Try again in 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: {
            rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);          // Google/GitHub OAuth
app.use('/api/courses', courseRoutes);
app.use('/api/course-management', courseManagementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin/management', adminManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/video-workflow', videoWorkflowRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/smart-content', smartContentRoutes);

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
    res.json({ name: 'SESA API', version: '2.0.0', status: 'running' });
});

// ── Error Handling (MUST be last) ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Server & Database ─────────────────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);

const MONGO_URI = process.env.MONGO_URI!;
const maskedURI = MONGO_URI.replace(/\/\/.*@/, '//****:****@');

const connectDB = async (retryCount = 0) => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000; // 5 seconds

    try {
        logger.info(`[Database] Connecting to: ${maskedURI} (Attempt ${retryCount + 1})`);
        await mongoose.connect(MONGO_URI);
        logger.info('✅ Connected to MongoDB');
        
        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
        });
    } catch (err: any) {
        logger.error(`❌ MongoDB Connection Failed: ${err.message}`);
        
        if (retryCount < MAX_RETRIES) {
            logger.info(`Retrying in ${RETRY_DELAY/1000}s...`);
            setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY);
        } else {
            logger.error('CRITICAL: Max retries reached. Server will stay in offline mode.');
            // Still start the server so health checks and AI diagnostics can work
            server.listen(PORT, () => {
                logger.warn(`🚀 Server running in OFFLINE mode on port ${PORT}`);
            });
        }
    }
};

connectDB();

// ── Handle unhandled rejections ───────────────────────────────────────────────
process.on('unhandledRejection', (reason: any) => {
    logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
