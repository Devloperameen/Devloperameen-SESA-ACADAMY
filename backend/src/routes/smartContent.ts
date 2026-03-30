import express from 'express';
import {
    generateCourseOutline,
    generateLessonContent,
    generateQuizQuestions,
    generateAssignment,
    enhanceExistingContent,
    generateLearningPath
} from '../controllers/smartContentController.js';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Course outline generation (instructors and admins)
router.post('/course-outline', 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    generateCourseOutline
);

// Lesson content generation (instructors and admins)
router.post('/lesson-content', 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    generateLessonContent
);

// Quiz questions generation (instructors and admins)
router.post('/quiz-questions', 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    generateQuizQuestions
);

// Assignment generation (instructors and admins)
router.post('/assignment', 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    generateAssignment
);

// Content enhancement (instructors and admins)
router.post('/enhance-content', 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    enhanceExistingContent
);

// Learning path generation (all authenticated users)
router.post('/learning-path', generateLearningPath);

export default router;