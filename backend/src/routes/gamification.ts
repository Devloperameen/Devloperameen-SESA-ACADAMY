import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    getMyGamificationStats,
    getLeaderboard,
    getAvailableBadges,
    awardBadge,
    updateStreak,
    getPointsHistory,
    getUserGamificationStats,
    awardPoints,
    getGamificationAnalytics
} from '../controllers/gamificationController.js';

const router = express.Router();

// Get my gamification stats
router.get('/my-stats', authenticate, getMyGamificationStats);

// Get leaderboard
router.get('/leaderboard', authenticate, getLeaderboard);

// Get available badges
router.get('/badges', authenticate, getAvailableBadges);

// Update streak (called on daily activity)
router.post('/update-streak', authenticate, updateStreak);

// Get points history
router.get('/points-history', authenticate, getPointsHistory);

// Award badge (Admin only)
router.post(
    '/award-badge',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    awardBadge
);

// Award points manually (Admin only)
router.post(
    '/award-points',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    awardPoints
);

// Get user gamification stats (Admin/Teacher)
router.get(
    '/user/:userId',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    getUserGamificationStats
);

// Get gamification analytics (Admin only)
router.get(
    '/analytics',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    getGamificationAnalytics
);

export default router;
