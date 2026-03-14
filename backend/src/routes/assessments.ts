import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    createQuiz,
    getCourseQuizzes,
    createAssignment,
    submitAssessment,
    updateMark,
    getStudentGradebook,
    getCourseGradebook
} from '../controllers/assessmentController.js';

const router = express.Router();

// Instructor/Admin routes
router.post('/course/:courseId/quiz', 
    authenticate, 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    createQuiz
);

router.post('/course/:courseId/assignment', 
    authenticate, 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    createAssignment
);

// Public/Student routes
router.get('/course/:courseId/quizzes', authenticate, getCourseQuizzes);
router.post('/submit', authenticate, submitAssessment);
router.get('/gradebook/:courseId', authenticate, getStudentGradebook);

// Mark Management
router.post('/mark', 
    authenticate, 
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]), 
    updateMark
);

router.get('/gradebook/all/:courseId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    getCourseGradebook
);

export default router;
