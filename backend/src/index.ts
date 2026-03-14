import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth.js';
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
import http from 'http';
import { initSocket } from './utils/socket.js';
import { fileURLToPath } from 'url';

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));

// CORS Configuration
const getCORSOrigins = () => {
    const originStr = process.env.CORS_ORIGIN;
    const isProd = process.env.NODE_ENV === 'production';
    
    console.log(`[Config] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`[Config] CORS_ORIGIN: ${originStr || 'not set'}`);

    if (!originStr) {
        if (isProd) {
            console.warn('⚠️ WARNING: CORS_ORIGIN is not set in production. Security will be strict.');
            return false;
        }
        return '*';
    }
    
    if (originStr === '*') return '*';
    
    // Split by comma if it's a string of origins
    if (originStr.includes(',')) {
        return originStr.split(',').map(o => o.trim());
    }
    return originStr;
};

const allowedOrigin = getCORSOrigins();
console.log(`[CORS] Active allowed origin(s): ${Array.isArray(allowedOrigin) ? allowedOrigin.join(', ') : allowedOrigin}`);

const corsOptions = {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Limit each IP to requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many auth requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ── Health Check ──────────────────────────────────────────────
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

// Routes
app.use('/api/auth', authRoutes);
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

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
    res.send('SESA Secure API with Real-time Notifications is running...');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Database connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('CRITICAL ERROR: MONGO_URI is not defined in environment variables');
    process.exit(1);
}

// Masked URI for logging
const maskedURI = MONGO_URI.replace(/\/\/.*@/, '//****:****@');
console.log(`[Database] Attempting to connect to: ${maskedURI}`);

const clientOptions = { 
    serverApi: { version: '1' as const, strict: true, deprecationErrors: true } 
};

mongoose.connect(MONGO_URI, clientOptions)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`[🚀] Server is live on port ${PORT}`);
            console.log(`[🌍] Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed!');
        console.error(`Error Details: ${err.message}`);
        console.error('Please ensure your IP is whitelisted in MongoDB Atlas (0.0.0.0/0 for testing).');
        process.exit(1);
    });
