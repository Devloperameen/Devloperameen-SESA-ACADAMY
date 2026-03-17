import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    createAssignment,
    getCourseAssignments,
    getAssignment,
    submitAssignment,
    getAssignmentSubmissions,
    previewSubmission,
    gradeSubmission,
    updateAssignment,
    deleteAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

// Create assignment (Teacher/Admin)
router.post(
    '/',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    createAssignment
);

// Get all assignments for a course
router.get('/course/:courseId', authenticate, getCourseAssignments);

// Get specific assignment
router.get('/:assignmentId', authenticate, getAssignment);

// Submit assignment (Student)
router.post(
    '/:assignmentId/submit',
    authenticate,
    checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]),
    submitAssignment
);

// Get all submissions for an assignment (Teacher/Admin)
router.get(
    '/:assignmentId/submissions',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    getAssignmentSubmissions
);

// Preview student submission - FIXES ADMIN SCREENSHOT BUG (Teacher/Admin)
router.get(
    '/:assignmentId/submissions/:studentId/preview',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    previewSubmission
);

// Grade submission (Teacher/Admin)
router.put(
    '/:assignmentId/grade/:studentId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    gradeSubmission
);

// Update assignment (Teacher/Admin)
router.put(
    '/:assignmentId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    updateAssignment
);

// Delete assignment (Teacher/Admin)
router.delete(
    '/:assignmentId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    deleteAssignment
);

export default router;
