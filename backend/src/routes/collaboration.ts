import express from 'express';
import {
    createStudyRoom,
    joinStudyRoom,
    leaveStudyRoom,
    getActiveRooms,
    updateWhiteboard,
    sendRoomMessage,
    startGroupActivity,
    getRoomAnalytics,
    closeStudyRoom
} from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Study room management
router.post('/rooms', createStudyRoom);
router.get('/rooms', getActiveRooms);
router.post('/rooms/:roomId/join', joinStudyRoom);
router.post('/rooms/:roomId/leave', leaveStudyRoom);
router.delete('/rooms/:roomId', closeStudyRoom);

// Room interactions
router.put('/rooms/:roomId/whiteboard', updateWhiteboard);
router.post('/rooms/:roomId/messages', sendRoomMessage);
router.post('/rooms/:roomId/activities', startGroupActivity);

// Room analytics
router.get('/rooms/:roomId/analytics', getRoomAnalytics);

export default router;