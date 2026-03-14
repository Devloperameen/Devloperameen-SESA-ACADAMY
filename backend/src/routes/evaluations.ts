import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    submitEvaluation,
    getInstructorEvaluations
} from '../controllers/evaluationController.js';

const router = express.Router();

// Student can submit evaluation
router.post('/', authenticate, checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]), submitEvaluation);

// Instructor/Admin can view evaluations
router.get('/instructor/:instructorId', authenticate, getInstructorEvaluations);

export default router;
