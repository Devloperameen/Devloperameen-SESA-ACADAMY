import express from 'express';
import {
    getLearningPatterns,
    getCourseInsights,
    getPredictiveAnalytics,
    getRealtimeMetrics
} from '../controllers/advancedAnalyticsController.js';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Learning patterns (admin/instructor access)
router.get('/learning-patterns', 
    checkRole([UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]), 
    getLearningPatterns
);

// Course insights (admin/instructor access)
router.get('/course-insights/:courseId', 
    checkRole([UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]), 
    getCourseInsights
);

// Predictive analytics (admin access)
router.get('/predictions', 
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    getPredictiveAnalytics
);

// Real-time metrics (admin access)
router.get('/realtime', 
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    getRealtimeMetrics
);

export default router;