import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Gamification from '../models/Gamification.js';
import { UserRole } from '../models/User.js';

/**
 * @route   GET /api/gamification/my-stats
 * @desc    Get current user's gamification stats
 * @access  Private
 */
export const getMyGamificationStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
            await gamification.save();
        }

        res.json(gamification);
    } catch (error) {
        console.error('Get gamification stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get leaderboard (top users by points)
 * @access  Private
 */
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const { limit = 10, timeframe = 'all' } = req.query;

        let query: any = {};
        
        // Filter by timeframe if needed
        if (timeframe === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query.updatedAt = { $gte: weekAgo };
        } else if (timeframe === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query.updatedAt = { $gte: monthAgo };
        }

        const leaderboard = await Gamification.find(query)
            .sort({ totalPoints: -1 })
            .limit(parseInt(limit as string))
            .populate('userId', 'name profileImage')
            .select('userId totalPoints level badges streak achievements');

        // Add rank to each entry
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            ...entry.toObject()
        }));

        res.json(rankedLeaderboard);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/gamification/badges
 * @desc    Get all available badges
 * @access  Private
 */
export const getAvailableBadges = async (req: AuthRequest, res: Response) => {
    try {
        const badges = [
            {
                id: 'first-lesson',
                name: 'First Steps',
                description: 'Complete your first lesson',
                icon: '🎯',
                category: 'milestone',
                requirement: 'Complete 1 lesson'
            },
            {
                id: 'quiz-master',
                name: 'Quiz Master',
                description: 'Pass 10 quizzes',
                icon: '🏆',
                category: 'achievement',
                requirement: 'Pass 10 quizzes'
            },
            {
                id: 'perfect-score',
                name: 'Perfect Score',
                description: 'Get 100% on a quiz',
                icon: '⭐',
                category: 'achievement',
                requirement: 'Score 100% on any quiz'
            },
            {
                id: 'week-streak',
                name: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                icon: '🔥',
                category: 'streak',
                requirement: '7-day learning streak'
            },
            {
                id: 'month-streak',
                name: 'Month Master',
                description: 'Maintain a 30-day streak',
                icon: '💪',
                category: 'streak',
                requirement: '30-day learning streak'
            },
            {
                id: 'assignment-ace',
                name: 'Assignment Ace',
                description: 'Submit 20 assignments',
                icon: '📝',
                category: 'achievement',
                requirement: 'Submit 20 assignments'
            },
            {
                id: 'course-complete',
                name: 'Course Conqueror',
                description: 'Complete your first course',
                icon: '🎓',
                category: 'milestone',
                requirement: 'Complete 1 course'
            },
            {
                id: 'top-10',
                name: 'Top 10',
                description: 'Reach top 10 on leaderboard',
                icon: '🥇',
                category: 'special',
                requirement: 'Rank in top 10'
            },
            {
                id: 'early-bird',
                name: 'Early Bird',
                description: 'Complete lessons before 8 AM',
                icon: '🌅',
                category: 'special',
                requirement: 'Complete 5 lessons before 8 AM'
            },
            {
                id: 'night-owl',
                name: 'Night Owl',
                description: 'Complete lessons after 10 PM',
                icon: '🦉',
                category: 'special',
                requirement: 'Complete 5 lessons after 10 PM'
            }
        ];

        res.json(badges);
    } catch (error) {
        console.error('Get available badges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   POST /api/gamification/award-badge
 * @desc    Award a badge to a user (Admin only or automatic)
 * @access  Private (Admin)
 */
export const awardBadge = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, badgeId, badgeName, badgeDescription, badgeIcon, badgeCategory } = req.body;

        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
        }

        // Check if badge already earned
        const hasBadge = gamification.badges.some(b => b.id === badgeId);
        if (hasBadge) {
            return res.status(400).json({ message: 'Badge already earned' });
        }

        // Award badge
        gamification.badges.push({
            id: badgeId,
            name: badgeName,
            description: badgeDescription,
            icon: badgeIcon,
            category: badgeCategory,
            earnedAt: new Date()
        });

        // Award bonus points for badge
        const badgePoints = 100;
        gamification.totalPoints += badgePoints;
        
        gamification.pointsHistory.push({
            points: badgePoints,
            reason: `Badge earned: ${badgeName}`,
            source: 'achievement',
            earnedAt: new Date()
        });

        await gamification.save();

        res.json({
            message: 'Badge awarded successfully',
            badge: gamification.badges[gamification.badges.length - 1]
        });
    } catch (error) {
        console.error('Award badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   POST /api/gamification/update-streak
 * @desc    Update user's streak (called on daily activity)
 * @access  Private
 */
export const updateStreak = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
        }

        const now = new Date();
        const lastActivity = gamification.streak.lastActivityDate;
        const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

        // If last activity was today, don't update
        if (hoursSinceLastActivity < 24) {
            return res.json({
                message: 'Streak already updated today',
                streak: gamification.streak
            });
        }

        // If last activity was yesterday, increment streak
        if (hoursSinceLastActivity < 48) {
            gamification.streak.current += 1;
            
            // Update longest streak if needed
            if (gamification.streak.current > gamification.streak.longest) {
                gamification.streak.longest = gamification.streak.current;
            }

            // Award streak points
            const streakPoints = gamification.streak.current * 10;
            gamification.totalPoints += streakPoints;
            
            gamification.pointsHistory.push({
                points: streakPoints,
                reason: `${gamification.streak.current}-day streak!`,
                source: 'streak',
                earnedAt: now
            });

            // Check for streak badges
            await checkStreakBadges(gamification);
        } else {
            // Streak broken, reset to 1
            gamification.streak.current = 1;
        }

        gamification.streak.lastActivityDate = now;
        await gamification.save();

        res.json({
            message: 'Streak updated successfully',
            streak: gamification.streak
        });
    } catch (error) {
        console.error('Update streak error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Helper function to check and award streak badges
 */
async function checkStreakBadges(gamification: any) {
    const streakBadges = [
        { days: 7, id: 'week-streak', name: 'Week Warrior', icon: '🔥' },
        { days: 30, id: 'month-streak', name: 'Month Master', icon: '💪' },
        { days: 100, id: 'century-streak', name: 'Century Streak', icon: '💯' }
    ];

    for (const badge of streakBadges) {
        if (gamification.streak.current >= badge.days) {
            const hasBadge = gamification.badges.some((b: any) => b.id === badge.id);
            
            if (!hasBadge) {
                gamification.badges.push({
                    id: badge.id,
                    name: badge.name,
                    description: `Maintain a ${badge.days}-day streak`,
                    icon: badge.icon,
                    category: 'streak',
                    earnedAt: new Date()
                });

                // Bonus points for streak badge
                gamification.totalPoints += 200;
            }
        }
    }
}

/**
 * @route   GET /api/gamification/points-history
 * @desc    Get user's points history
 * @access  Private
 */
export const getPointsHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { limit = 50 } = req.query;

        const gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            return res.json([]);
        }

        // Get recent points history
        const history = gamification.pointsHistory
            .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
            .slice(0, parseInt(limit as string));

        res.json(history);
    } catch (error) {
        console.error('Get points history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/gamification/user/:userId
 * @desc    Get gamification stats for a specific user (Admin/Teacher)
 * @access  Private (Admin/Teacher)
 */
export const getUserGamificationStats = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const gamification = await Gamification.findOne({ userId })
            .populate('userId', 'name email profileImage');

        if (!gamification) {
            return res.status(404).json({ message: 'Gamification data not found' });
        }

        res.json(gamification);
    } catch (error) {
        console.error('Get user gamification stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   POST /api/gamification/award-points
 * @desc    Manually award points to a user (Admin only)
 * @access  Private (Admin)
 */
export const awardPoints = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, points, reason } = req.body;

        if (!userId || !points || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
        }

        gamification.totalPoints += points;
        
        gamification.pointsHistory.push({
            points,
            reason,
            source: 'bonus',
            earnedAt: new Date()
        });

        await gamification.save();

        res.json({
            message: 'Points awarded successfully',
            totalPoints: gamification.totalPoints
        });
    } catch (error) {
        console.error('Award points error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/gamification/analytics
 * @desc    Get gamification analytics (Admin only)
 * @access  Private (Admin)
 */
export const getGamificationAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await Gamification.countDocuments();
        
        const topUsers = await Gamification.find()
            .sort({ totalPoints: -1 })
            .limit(10)
            .populate('userId', 'name');

        const averagePoints = await Gamification.aggregate([
            { $group: { _id: null, avgPoints: { $avg: '$totalPoints' } } }
        ]);

        const totalBadgesAwarded = await Gamification.aggregate([
            { $project: { badgeCount: { $size: '$badges' } } },
            { $group: { _id: null, total: { $sum: '$badgeCount' } } }
        ]);

        const activeStreaks = await Gamification.countDocuments({
            'streak.current': { $gte: 7 }
        });

        res.json({
            totalUsers,
            averagePoints: averagePoints[0]?.avgPoints || 0,
            totalBadgesAwarded: totalBadgesAwarded[0]?.total || 0,
            activeStreaks,
            topUsers
        });
    } catch (error) {
        console.error('Get gamification analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
