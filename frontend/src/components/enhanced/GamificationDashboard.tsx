// Gamification Dashboard with Advanced Features
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, 
    Star, 
    Target, 
    Zap, 
    Award, 
    TrendingUp, 
    Users, 
    BookOpen, 
    Flame,
    Medal,
    Crown,
    Gift,
    Calendar,
    Clock,
    CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    points: number;
    unlockedAt?: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    progress?: number;
    maxProgress?: number;
}

interface LeaderboardEntry {
    id: string;
    name: string;
    avatar: string;
    points: number;
    level: number;
    streak: number;
    rank: number;
    badges: string[];
}

interface StreakData {
    current: number;
    longest: number;
    lastActiveDate: Date;
}

interface LearningStats {
    totalPoints: number;
    currentLevel: number;
    pointsToNextLevel: number;
    completedCourses: number;
    totalHours: number;
    weeklyProgress: number;
    monthlyProgress: number;
}

const GamificationDashboard: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview');
    const [userStats, setUserStats] = useState<LearningStats | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    // Mock data - in production, this would come from API
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true);
            
            // Simulate API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setUserStats({
                totalPoints: 2850,
                currentLevel: 12,
                pointsToNextLevel: 150,
                completedCourses: 8,
                totalHours: 127,
                weeklyProgress: 85,
                monthlyProgress: 320
            });
            
            setAchievements([
                {
                    id: 'first_course',
                    title: t('Course Beginner', 'የምርርትርት'),
                    description: t('Completed your first course', 'የምርርትርት የምርርትርት'),
                    icon: <BookOpen className="w-8 h-8" />,
                    points: 100,
                    rarity: 'common',
                    unlockedAt: new Date('2024-01-15')
                },
                {
                    id: 'week_streak',
                    title: t('Week Warrior', 'ሳግክ ወርር'),
                    description: t('7-day learning streak', '7 ቀንንን የምርርትርት'),
                    icon: <Flame className="w-8 h-8" />,
                    points: 200,
                    rarity: 'rare',
                    unlockedAt: new Date('2024-02-01')
                },
                {
                    id: 'knowledge_master',
                    title: t('Knowledge Master', 'የምርርትርት'),
                    description: t('Completed 10 courses', '10 የምርርትርት'),
                    icon: <Trophy className="w-8 h-8" />,
                    points: 500,
                    rarity: 'epic',
                    unlockedAt: new Date('2024-03-10')
                },
                {
                    id: 'perfect_score',
                    title: t('Perfect Score', 'የምርርትርት'),
                    description: t('100% in 5 quizzes', '5 ክውዝርትርት 100%'),
                    icon: <Star className="w-8 h-8" />,
                    points: 300,
                    rarity: 'rare',
                    unlockedAt: new Date('2024-02-15')
                },
                {
                    id: 'early_bird',
                    title: t('Early Bird', 'የምርርትርት'),
                    description: t('30 days of morning learning', '30 ቀንንን የምርርትርት'),
                    icon: <Calendar className="w-8 h-8" />,
                    points: 150,
                    rarity: 'common',
                    unlockedAt: new Date('2024-01-20')
                },
                {
                    id: 'social_learner',
                    title: t('Social Learner', 'የምርርትርት'),
                    description: t('Helped 50 fellow students', '50 የምርርትርት የምርርትርት'),
                    icon: <Users className="w-8 h-8" />,
                    points: 400,
                    rarity: 'epic',
                    unlockedAt: new Date('2024-03-05')
                }
            ]);
            
            setStreak({
                current: 15,
                longest: 23,
                lastActiveDate: new Date()
            });
            
            setLeaderboard([
                {
                    id: '1',
                    name: 'Alex Chen',
                    avatar: '/avatars/alex.jpg',
                    points: 5420,
                    level: 18,
                    streak: 45,
                    rank: 1,
                    badges: ['knowledge_master', 'week_streak', 'social_learner']
                },
                {
                    id: '2',
                    name: 'Sarah Johnson',
                    avatar: '/avatars/sarah.jpg',
                    points: 4890,
                    level: 16,
                    streak: 32,
                    rank: 2,
                    badges: ['perfect_score', 'early_bird']
                },
                {
                    id: '3',
                    name: 'Mike Williams',
                    avatar: '/avatars/mike.jpg',
                    points: 3850,
                    level: 12,
                    streak: 15,
                    rank: 3,
                    badges: ['first_course', 'week_streak']
                },
                {
                    id: '4',
                    name: 'Emma Davis',
                    avatar: '/avatars/emma.jpg',
                    points: 3200,
                    level: 10,
                    streak: 12,
                    rank: 4,
                    badges: ['early_bird', 'social_learner']
                },
                {
                    id: '5',
                    name: 'You',
                    avatar: '/avatars/user.jpg',
                    points: 2850,
                    level: 12,
                    streak: 15,
                    rank: 5,
                    badges: ['first_course', 'perfect_score']
                }
            ]);
            
            setLoading(false);
        };
        
        loadUserData();
    }, []);

    const getRarityColor = (rarity: string) => {
        const colors = {
            common: 'from-gray-400 to-gray-600',
            rare: 'from-blue-400 to-blue-600',
            epic: 'from-purple-400 to-purple-600',
            legendary: 'from-yellow-400 to-orange-600'
        };
        return colors[rarity as keyof typeof colors] || 'from-gray-400 to-gray-600';
    };

    const getRarityBorder = (rarity: string) => {
        const borders = {
            common: 'border-gray-400',
            rare: 'border-blue-400',
            epic: 'border-purple-400',
            legendary: 'border-yellow-400'
        };
        return borders[rarity as keyof typeof borders] || 'border-gray-400';
    };

    const getLevelProgress = () => {
        if (!userStats) return 0;
        const totalPointsForLevel = userStats.currentLevel * 250; // 250 points per level
        const pointsInCurrentLevel = userStats.totalPoints - (totalPointsForLevel - 250);
        return (pointsInCurrentLevel / 250) * 100;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        {t('Gamification Dashboard', 'የምርርትርት የምርርትርት')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        {t('Track your progress, earn achievements, and climb the leaderboard', 'የምርርትርትርት የምርርትርትርት የምርርትርት')}
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-8"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1 inline-flex">
                        {(['overview', 'achievements', 'leaderboard'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {tab === 'overview' && <Trophy className="w-4 h-4 mr-2" />}
                                {tab === 'achievements' && <Award className="w-4 h-4 mr-2" />}
                                {tab === 'leaderboard' && <Crown className="w-4 h-4 mr-2" />}
                                {t(tab.charAt(0).toUpperCase() + tab.slice(1), tab.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && userStats && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Stats Cards */}
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="lg:col-span-2 space-y-6"
                            >
                                {/* Total Points */}
                                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Zap className="w-6 h-6 mr-2" />
                                            <span className="text-lg font-semibold">{t('Total Points', 'የምርርትርት')}</span>
                                        </div>
                                        <div className="text-3xl font-bold">
                                            {userStats.totalPoints.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-purple-100">
                                        {t('Your accumulated learning points', 'የምርርትርት የምርርትርት')}
                                    </div>
                                </div>

                                {/* Level Progress */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Target className="w-6 h-6 mr-2 text-indigo-600" />
                                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Level', 'የምርርት')}</span>
                                        </div>
                                        <div className="text-3xl font-bold text-indigo-600">
                                            {userStats.currentLevel}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <span>{t('Progress to Level', 'የምርርት የምርርት')} {userStats.currentLevel + 1}</span>
                                            <span>{userStats.pointsToNextLevel} {t('points', 'የምርርትርት')}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${getLevelProgress()}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Learning Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center mb-2">
                                            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{t('Courses', 'የምርርትርት')}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                            {userStats.completedCourses}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center mb-2">
                                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{t('Hours', 'ሰአትርት')}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                            {userStats.totalHours}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Streak Card */}
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white"
                            >
                                {streak && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center">
                                                <Flame className="w-6 h-6 mr-2" />
                                                <span className="text-lg font-semibold">{t('Current Streak', 'የምርርትርት')}</span>
                                            </div>
                                            <div className="text-3xl font-bold">
                                                {streak.current} {t('days', 'ቀንንን')}
                                            </div>
                                        </div>
                                        <div className="text-orange-100 text-sm">
                                            <div className="mb-2">
                                                {t('Longest streak', 'የምርርትርት')}: {streak.longest} {t('days', 'ቀንንን')}
                                            </div>
                                            <div>
                                                {t('Last active', 'የምርርትርት')}: {streak.lastActiveDate.toLocaleDateString()}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {achievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => setSelectedAchievement(achievement)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                                            {achievement.icon}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(achievement.rarity)} text-white`}>
                                                {achievement.rarity.toUpperCase()}
                                            </div>
                                            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                +{achievement.points}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                        {achievement.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                        {achievement.description}
                                    </p>
                                    
                                    {achievement.unlockedAt && (
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {t('Unlocked', 'የምርርትርት')}: {achievement.unlockedAt.toLocaleDateString()}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                        >
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                                    <Crown className="w-6 h-6 mr-3 text-yellow-500" />
                                    {t('Leaderboard', 'የምርርትርት')}
                                </h3>
                                
                                <div className="space-y-4">
                                    {leaderboard.map((entry, index) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`flex items-center p-4 rounded-xl ${
                                                entry.name === 'You' 
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                                entry.rank <= 3 
                                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                            }`}>
                                                {entry.rank <= 3 && <Medal className="w-5 h-5 mr-1" />}
                                                {entry.rank}
                                            </div>
                                            
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full overflow-hidden ml-4">
                                                <img 
                                                    src={entry.avatar} 
                                                    alt={entry.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            {/* User Info */}
                                            <div className="ml-4 flex-1">
                                                <div className="font-semibold text-lg">
                                                    {entry.name}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <span className="flex items-center">
                                                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                                        Level {entry.level}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Flame className="w-4 h-4 mr-1 text-orange-500" />
                                                        {entry.streak} {t('days', 'ቀንንን')}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Zap className="w-4 h-4 mr-1 text-purple-500" />
                                                        {entry.points.toLocaleString()} {t('pts', 'የምርርትርት')}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {entry.badges.map((badge, badgeIndex) => (
                                                    <div 
                                                        key={badgeIndex}
                                                        className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold"
                                                        title={badge}
                                                    >
                                                        {badgeIndex === 0 && <Trophy className="w-3 h-3" />}
                                                        {badgeIndex === 1 && <Flame className="w-3 h-3" />}
                                                        {badgeIndex === 2 && <Users className="w-3 h-3" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Achievement Detail Modal */}
                <AnimatePresence>
                    {selectedAchievement && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setSelectedAchievement(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-4 rounded-xl bg-gradient-to-r ${getRarityColor(selectedAchievement.rarity)} text-white`}>
                                        {selectedAchievement.icon}
                                    </div>
                                    <button
                                        onClick={() => setSelectedAchievement(null)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                    {selectedAchievement.title}
                                </h3>
                                
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRarityColor(selectedAchievement.rarity)} text-white`}>
                                        {selectedAchievement.rarity.toUpperCase()}
                                    </div>
                                    <div className="text-lg font-bold text-purple-600">
                                        +{selectedAchievement.points} {t('Points', 'የምርርትርት')}
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {selectedAchievement.description}
                                </p>
                                
                                {selectedAchievement.unlockedAt && (
                                    <div className="text-sm text-gray-500 dark:text-gray-500">
                                        {t('Achieved on', 'የምርርትርት')}: {selectedAchievement.unlockedAt.toLocaleDateString()}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GamificationDashboard;
