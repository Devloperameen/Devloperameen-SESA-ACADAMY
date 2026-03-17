import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    createQuiz,
    getCourseQuizzes,
    getQuiz,
    submitQuiz,
    getQuizResults,
    updateQuiz,
    deleteQuiz
} from '../controllers/quizController.js';

const router = express.Router();

// Create quiz (Teacher/Admin)
router.post(
    '/',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    createQuiz
);

// Get all quizzes for a course
router.get('/course/:courseId', authenticate, getCourseQuizzes);

// Get specific quiz
router.get('/:quizId', authenticate, getQuiz);

// Submit quiz (Student)
router.post(
    '/:quizId/submit',
    authenticate,
    checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]),
    submitQuiz
);

// Get quiz results (Teacher/Admin)
router.get(
    '/:quizId/results',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    getQuizResults
);

// Update quiz (Teacher/Admin)
router.put(
    '/:quizId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    updateQuiz
);

// Delete quiz (Teacher/Admin)
router.delete(
    '/:quizId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    deleteQuiz
);

export default router;
