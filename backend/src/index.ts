import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import http from 'http';
import { initSocket } from './utils/socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

app.use(express.json({ limit: '10kb' })); // Body parser with size limit

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

app.get('/', (req, res) => {
    res.send('SESA Secure API with Real-time Notifications is running...');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<db_username>:<db_password>@cluster0.2amblcf.mongodb.net/sesa?retryWrites=true&w=majority&appName=Cluster0';

const clientOptions = { 
    serverApi: { version: '1', strict: true, deprecationErrors: true } 
};

mongoose.connect(MONGO_URI, clientOptions)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
