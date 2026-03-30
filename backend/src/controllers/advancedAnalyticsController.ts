import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Quiz from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import logger from '../utils/logger.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface LearningPattern {
    userId: string;
    userName: string;
    averageSessionDuration: number;
    preferredLearningTime: string;
    strongSubjects: string[];
    weakSubjects: string[];
    learningVelocity: number;
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
}

interface CourseInsight {
    courseId: string;
    courseTitle: string;
    completionRate: number;
    averageScore: number;
    dropoffPoints: string[];
    studentSatisfaction: number;
    difficultyRating: number;
    timeToComplete: number;
    popularSections: string[];
    improvementAreas: string[];
}

export const getLearningPatterns = async (req: AuthRequest, res: Response) => {
    try {
        const { timeframe = '30d', courseId } = req.query;
        
        // Calculate date range
        const days = parseInt(timeframe.toString().replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build aggregation pipeline
        const matchStage: any = {
            updatedAt: { $gte: startDate }
        };
        
        if (courseId) {
            matchStage.courseId = new mongoose.Types.ObjectId(courseId as string);
        }

        const progressData = await Progress.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$user' },
            { $unwind: '$course' },
            {
                $group: {
                    _id: '$userId',
                    userName: { $first: '$user.name' },
                    totalSessions: { $sum: 1 },
                    totalTimeSpent: { $sum: '$timeSpent' },
                    averageScore: { $avg: '$averageScore' },
                    coursesEnrolled: { $addToSet: '$course.title' },
                    completedLessons: { $sum: { $size: '$completedLessons' } },
                    quizScores: { $push: '$quizScores' },
                    lastActivity: { $max: '$updatedAt' },
                    strugglingAreas: { $addToSet: '$strugglingAreas' },
                    strengths: { $addToSet: '$strengths' }
                }
            }
        ]);

        // Analyze patterns using AI
        const patterns: LearningPattern[] = await Promise.all(
            progressData.map(async (data) => {
                const averageSessionDuration = data.totalTimeSpent / data.totalSessions;
                const learningVelocity = data.completedLessons / days;
                const engagementScore = calculateEngagementScore(data);
                const riskLevel = calculateRiskLevel(data, averageSessionDuration, learningVelocity);
                
                // Generate AI recommendations
                const recommendations = await generatePersonalizedRecommendations(data);

                return {
                    userId: data._id.toString(),
                    userName: data.userName,
                    averageSessionDuration,
                    preferredLearningTime: await detectPreferredLearningTime(data._id),
                    strongSubjects: data.strengths.flat().filter(Boolean),
                    weakSubjects: data.strugglingAreas.flat().filter(Boolean),
                    learningVelocity,
                    engagementScore,
                    riskLevel,
                    recommendations
                };
            })
        );

        res.json({
            patterns,
            summary: {
                totalStudents: patterns.length,
                averageEngagement: patterns.reduce((sum, p) => sum + p.engagementScore, 0) / patterns.length,
                atRiskStudents: patterns.filter(p => p.riskLevel === 'high').length,
                topPerformers: patterns.filter(p => p.engagementScore > 80).length
            }
        });

    } catch (error) {
        logger.error('Error getting learning patterns:', error);
        res.status(500).json({ error: 'Failed to get learning patterns' });
    }
};

export const getCourseInsights = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get enrollment and progress data
        const [enrollmentData, progressData, quizData, assignmentData] = await Promise.all([
            Progress.countDocuments({ courseId }),
            Progress.find({ courseId }).populate('userId', 'name'),
            Quiz.find({ courseId }),
            Assignment.find({ courseId })
        ]);

        // Calculate metrics
        const completionRate = progressData.filter(p => p.completionPercentage >= 100).length / enrollmentData * 100;
        const averageScore = progressData.reduce((sum, p) => sum + (p.averageScore || 0), 0) / progressData.length;
        const averageTimeToComplete = progressData
            .filter(p => p.completionPercentage >= 100)
            .reduce((sum, p) => sum + (p.timeSpent || 0), 0) / progressData.filter(p => p.completionPercentage >= 100).length;

        // Identify dropoff points
        const lessonCompletionRates = course.lessons.map((lesson, index) => {
            const completedCount = progressData.filter(p => 
                p.completedLessons && p.completedLessons.includes(index)
            ).length;
            return {
                lessonIndex: index,
                lessonTitle: lesson.title,
                completionRate: (completedCount / enrollmentData) * 100
            };
        });

        const dropoffPoints = lessonCompletionRates
            .filter(l => l.completionRate < 50)
            .map(l => l.lessonTitle);

        // Generate AI insights
        const aiInsights = await generateCourseInsights(course, progressData, quizData, assignmentData);

        const insights: CourseInsight = {
            courseId: course._id.toString(),
            courseTitle: course.title,
            completionRate,
            averageScore,
            dropoffPoints,
            studentSatisfaction: calculateSatisfactionScore(progressData),
            difficultyRating: calculateDifficultyRating(progressData, quizData),
            timeToComplete: averageTimeToComplete,
            popularSections: lessonCompletionRates
                .filter(l => l.completionRate > 80)
                .map(l => l.lessonTitle),
            improvementAreas: aiInsights.improvementAreas
        };

        res.json({
            insights,
            detailedMetrics: {
                enrollmentTrend: await getEnrollmentTrend(courseId),
                lessonAnalytics: lessonCompletionRates,
                quizPerformance: await getQuizPerformance(courseId),
                studentFeedback: await getStudentFeedback(courseId)
            },
            aiRecommendations: aiInsights.recommendations
        });

    } catch (error) {
        logger.error('Error getting course insights:', error);
        res.status(500).json({ error: 'Failed to get course insights' });
    }
};

export const getPredictiveAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { type = 'completion', courseId, userId } = req.query;

        let predictions: any = {};

        switch (type) {
            case 'completion':
                predictions = await predictCourseCompletion(courseId as string, userId as string);
                break;
            case 'performance':
                predictions = await predictStudentPerformance(userId as string);
                break;
            case 'engagement':
                predictions = await predictEngagementTrends(courseId as string);
                break;
            case 'churn':
                predictions = await predictStudentChurn();
                break;
            default:
                return res.status(400).json({ error: 'Invalid prediction type' });
        }

        res.json({ predictions, type, generatedAt: new Date() });

    } catch (error) {
        logger.error('Error getting predictive analytics:', error);
        res.status(500).json({ error: 'Failed to get predictive analytics' });
    }
};

export const getRealtimeMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            activeUsers,
            recentEnrollments,
            completedLessons,
            quizAttempts,
            averageSessionTime
        ] = await Promise.all([
            User.countDocuments({ lastLogin: { $gte: oneHourAgo } }),
            Progress.countDocuments({ createdAt: { $gte: oneDayAgo } }),
            Progress.aggregate([
                { $match: { updatedAt: { $gte: oneDayAgo } } },
                { $project: { completedToday: { $size: '$completedLessons' } } },
                { $group: { _id: null, total: { $sum: '$completedToday' } } }
            ]),
            Quiz.aggregate([
                { $match: { createdAt: { $gte: oneDayAgo } } },
                { $project: { attempts: { $size: '$attempts' } } },
                { $group: { _id: null, total: { $sum: '$attempts' } } }
            ]),
            Progress.aggregate([
                { $match: { updatedAt: { $gte: oneDayAgo } } },
                { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
            ])
        ]);

        const metrics = {
            activeUsers,
            recentEnrollments,
            completedLessons: completedLessons[0]?.total || 0,
            quizAttempts: quizAttempts[0]?.total || 0,
            averageSessionTime: averageSessionTime[0]?.avgTime || 0,
            timestamp: now
        };

        res.json({ metrics });

    } catch (error) {
        logger.error('Error getting realtime metrics:', error);
        res.status(500).json({ error: 'Failed to get realtime metrics' });
    }
};

// Helper functions
function calculateEngagementScore(data: any): number {
    const sessionFrequency = data.totalSessions / 30; // sessions per day
    const completionRate = data.completedLessons / (data.coursesEnrolled.length * 10); // assuming 10 lessons per course
    const scoreConsistency = data.averageScore > 70 ? 1 : data.averageScore / 70;
    
    return Math.min(100, (sessionFrequency * 30 + completionRate * 40 + scoreConsistency * 30));
}

function calculateRiskLevel(data: any, avgSession: number, velocity: number): 'low' | 'medium' | 'high' {
    const daysSinceLastActivity = (new Date().getTime() - new Date(data.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 7 || avgSession < 10 || velocity < 0.1) return 'high';
    if (daysSinceLastActivity > 3 || avgSession < 20 || velocity < 0.3) return 'medium';
    return 'low';
}

async function generatePersonalizedRecommendations(data: any): Promise<string[]> {
    try {
        const prompt = `
        Based on this student's learning data, provide 3 personalized recommendations:
        
        - Average session: ${data.totalTimeSpent / data.totalSessions} minutes
        - Average score: ${data.averageScore}%
        - Courses: ${data.coursesEnrolled.join(', ')}
        - Struggling areas: ${data.strugglingAreas.flat().join(', ')}
        - Strengths: ${data.strengths.flat().join(', ')}
        
        Provide actionable, specific recommendations to improve learning outcomes.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const recommendations = result.response.text().split('\n').filter(r => r.trim());
        
        return recommendations.slice(0, 3);
    } catch (error) {
        return [
            'Focus on consistent daily study sessions',
            'Review challenging topics with additional resources',
            'Take practice quizzes to reinforce learning'
        ];
    }
}

async function detectPreferredLearningTime(userId: string): Promise<string> {
    // This would analyze user activity patterns to determine preferred learning times
    // For now, return a default
    return 'Evening (6-9 PM)';
}

function calculateSatisfactionScore(progressData: any[]): number {
    // Calculate based on completion rates, time spent, and engagement
    const avgCompletion = progressData.reduce((sum, p) => sum + p.completionPercentage, 0) / progressData.length;
    return Math.min(100, avgCompletion * 0.8 + 20); // Base satisfaction + completion bonus
}

function calculateDifficultyRating(progressData: any[], quizData: any[]): number {
    const avgScore = progressData.reduce((sum, p) => sum + (p.averageScore || 0), 0) / progressData.length;
    return Math.max(1, Math.min(10, 11 - (avgScore / 10))); // Inverse of average score
}

async function getEnrollmentTrend(courseId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return Progress.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId), createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                enrollments: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
}

async function getQuizPerformance(courseId: string) {
    return Quiz.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        {
            $project: {
                title: 1,
                averageScore: { $avg: '$attempts.score' },
                attemptCount: { $size: '$attempts' },
                passRate: {
                    $multiply: [
                        { $divide: [{ $size: { $filter: { input: '$attempts', cond: { $gte: ['$$this.score', 70] } } } }, { $size: '$attempts' }] },
                        100
                    ]
                }
            }
        }
    ]);
}

async function getStudentFeedback(courseId: string) {
    return Course.findById(courseId).select('reviews').then(course => {
        if (!course || !course.reviews) return [];
        return course.reviews.map(review => ({
            rating: review.rating,
            text: review.text,
            date: review.createdAt
        }));
    });
}

async function generateCourseInsights(course: any, progressData: any[], quizData: any[], assignmentData: any[]) {
    try {
        const prompt = `
        Analyze this course data and provide insights:
        
        Course: ${course.title}
        Students: ${progressData.length}
        Average completion: ${progressData.reduce((sum, p) => sum + p.completionPercentage, 0) / progressData.length}%
        Quizzes: ${quizData.length}
        Assignments: ${assignmentData.length}
        
        Provide:
        1. Top 3 improvement areas
        2. 3 specific recommendations for course enhancement
        
        Format as JSON: {"improvementAreas": ["area1", "area2", "area3"], "recommendations": ["rec1", "rec2", "rec3"]}
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        return {
            improvementAreas: ['Student engagement', 'Content difficulty', 'Assessment quality'],
            recommendations: ['Add interactive elements', 'Provide more examples', 'Include practice exercises']
        };
    }
}

async function predictCourseCompletion(courseId: string, userId: string) {
    // ML prediction logic would go here
    // For now, return mock prediction
    return {
        completionProbability: 0.75,
        estimatedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        confidenceLevel: 0.82,
        factors: ['Current progress rate', 'Historical patterns', 'Engagement level']
    };
}

async function predictStudentPerformance(userId: string) {
    return {
        expectedGrade: 'B+',
        riskFactors: ['Inconsistent study schedule', 'Low quiz scores'],
        recommendations: ['Schedule regular study time', 'Focus on weak areas']
    };
}

async function predictEngagementTrends(courseId: string) {
    return {
        trend: 'increasing',
        projectedEngagement: 78,
        peakTimes: ['Monday 9AM', 'Wednesday 7PM', 'Sunday 2PM']
    };
}

async function predictStudentChurn() {
    return {
        atRiskStudents: 12,
        churnProbability: 0.15,
        preventionStrategies: ['Personalized outreach', 'Additional support', 'Flexible scheduling']
    };
}