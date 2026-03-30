import express from 'express';
import {
    startTutorSession,
    chatWithTutor,
    generateQuizFromChat,
    getPersonalizedStudyPlan,
    endTutorSession,
    getActiveSessions
} from '../controllers/aiTutorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Start a new AI tutoring session
router.post('/session/start', startTutorSession);

// Chat with AI tutor
router.post('/session/chat', chatWithTutor);

// Generate quiz from chat session
router.post('/session/generate-quiz', generateQuizFromChat);

// Get personalized study plan
router.post('/study-plan', getPersonalizedStudyPlan);

// End tutoring session
router.post('/session/end', endTutorSession);

// Get active sessions for user
router.get('/sessions', getActiveSessions);

export default router;