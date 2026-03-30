import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import logger from '../utils/logger.js';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface LearningSession {
    userId: string;
    courseId: string;
    messages: ChatMessage[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    currentTopic: string;
    strugglingAreas: string[];
    strengths: string[];
}

// In-memory session storage (use Redis in production)
const activeSessions = new Map<string, LearningSession>();

export const startTutorSession = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, learningStyle = 'visual', difficultyLevel = 'beginner' } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get course and user data
        const [course, user, progress] = await Promise.all([
            Course.findById(courseId),
            User.findById(userId),
            Progress.findOne({ userId, courseId })
        ]);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Create learning session
        const sessionId = `${userId}_${courseId}_${Date.now()}`;
        const session: LearningSession = {
            userId,
            courseId,
            messages: [],
            learningStyle,
            difficultyLevel,
            currentTopic: course.title,
            strugglingAreas: progress?.strugglingAreas || [],
            strengths: progress?.strengths || []
        };

        // Generate personalized welcome message
        const welcomePrompt = `
        You are an AI tutor for the course "${course.title}". 
        Student profile:
        - Name: ${user?.name}
        - Learning style: ${learningStyle}
        - Difficulty level: ${difficultyLevel}
        - Previous struggles: ${session.strugglingAreas.join(', ') || 'None identified'}
        - Strengths: ${session.strengths.join(', ') || 'None identified yet'}
        
        Create a warm, encouraging welcome message that:
        1. Introduces yourself as their AI tutor
        2. Acknowledges their learning style
        3. Sets expectations for the session
        4. Asks what they'd like to focus on today
        
        Keep it friendly, concise, and motivating.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(welcomePrompt);
        const welcomeMessage = result.response.text();

        session.messages.push({
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date()
        });

        activeSessions.set(sessionId, session);

        res.json({
            sessionId,
            welcomeMessage,
            learningStyle,
            difficultyLevel,
            courseTitle: course.title
        });

    } catch (error) {
        logger.error('Error starting tutor session:', error);
        res.status(500).json({ error: 'Failed to start tutor session' });
    }
};

export const chatWithTutor = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, message, includeVisuals = false } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const session = activeSessions.get(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Add user message to session
        session.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Get course context
        const course = await Course.findById(session.courseId);
        
        // Build context-aware prompt
        const contextPrompt = `
        You are an AI tutor helping with "${course?.title}". 
        
        Student Profile:
        - Learning style: ${session.learningStyle}
        - Level: ${session.difficultyLevel}
        - Current topic: ${session.currentTopic}
        - Struggling areas: ${session.strugglingAreas.join(', ') || 'None'}
        - Strengths: ${session.strengths.join(', ') || 'None'}
        
        Course Context: ${course?.description}
        
        Recent conversation:
        ${session.messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Student's question: "${message}"
        
        Provide a helpful response that:
        1. Addresses their specific question
        2. Adapts to their learning style (${session.learningStyle})
        3. Matches their difficulty level (${session.difficultyLevel})
        4. Provides examples and analogies
        5. Suggests next steps or practice exercises
        6. Encourages and motivates
        
        ${includeVisuals ? 'Include suggestions for visual aids, diagrams, or interactive elements.' : ''}
        
        Keep responses clear, engaging, and educational.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(contextPrompt);
        const tutorResponse = result.response.text();

        // Add tutor response to session
        session.messages.push({
            role: 'assistant',
            content: tutorResponse,
            timestamp: new Date()
        });

        // Update session with new insights
        await updateLearningInsights(session, message, tutorResponse);

        res.json({
            response: tutorResponse,
            sessionId,
            messageCount: session.messages.length,
            currentTopic: session.currentTopic
        });

    } catch (error) {
        logger.error('Error in tutor chat:', error);
        res.status(500).json({ error: 'Failed to process tutor chat' });
    }
};

export const generateQuizFromChat = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, questionCount = 5, difficulty } = req.body;
        const userId = req.user?.id;

        const session = activeSessions.get(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const recentTopics = session.messages
            .filter(m => m.role === 'user')
            .slice(-10)
            .map(m => m.content)
            .join(' ');

        const quizPrompt = `
        Based on this tutoring session about "${session.currentTopic}", create ${questionCount} quiz questions.
        
        Recent discussion topics: ${recentTopics}
        Student level: ${difficulty || session.difficultyLevel}
        Learning style: ${session.learningStyle}
        
        Generate questions in this JSON format:
        {
            "questions": [
                {
                    "question": "Question text",
                    "type": "multiple_choice",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": 0,
                    "explanation": "Why this is correct",
                    "difficulty": "beginner|intermediate|advanced"
                }
            ]
        }
        
        Include variety: multiple choice, true/false, and short answer questions.
        Make questions relevant to what the student just learned.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(quizPrompt);
        const quizData = JSON.parse(result.response.text());

        res.json({
            quiz: quizData,
            sessionId,
            generatedFrom: 'tutor_session',
            topic: session.currentTopic
        });

    } catch (error) {
        logger.error('Error generating quiz from chat:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
};

export const getPersonalizedStudyPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, timeAvailable, goals } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const [course, progress, user] = await Promise.all([
            Course.findById(courseId),
            Progress.findOne({ userId, courseId }),
            User.findById(userId)
        ]);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const studyPlanPrompt = `
        Create a personalized study plan for:
        
        Course: ${course.title}
        Description: ${course.description}
        Student: ${user?.name}
        Time available: ${timeAvailable} hours per week
        Goals: ${goals}
        
        Current progress:
        - Completed lessons: ${progress?.completedLessons?.length || 0}
        - Quiz scores: ${progress?.quizScores?.map(q => q.score).join(', ') || 'None'}
        - Struggling areas: ${progress?.strugglingAreas?.join(', ') || 'None identified'}
        - Strengths: ${progress?.strengths?.join(', ') || 'None identified'}
        
        Generate a detailed study plan with:
        1. Weekly schedule breakdown
        2. Priority topics based on progress
        3. Recommended study techniques
        4. Milestone checkpoints
        5. Practice exercises
        6. Review sessions
        
        Format as JSON:
        {
            "weeklyPlan": [
                {
                    "week": 1,
                    "focus": "Topic name",
                    "hours": 5,
                    "activities": ["activity1", "activity2"],
                    "goals": ["goal1", "goal2"]
                }
            ],
            "studyTips": ["tip1", "tip2"],
            "milestones": [
                {
                    "week": 2,
                    "checkpoint": "Complete basic concepts",
                    "assessment": "Quiz on fundamentals"
                }
            ]
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(studyPlanPrompt);
        const studyPlan = JSON.parse(result.response.text());

        res.json({
            studyPlan,
            courseTitle: course.title,
            totalWeeks: studyPlan.weeklyPlan?.length || 0,
            estimatedCompletion: new Date(Date.now() + (studyPlan.weeklyPlan?.length || 0) * 7 * 24 * 60 * 60 * 1000)
        });

    } catch (error) {
        logger.error('Error generating study plan:', error);
        res.status(500).json({ error: 'Failed to generate study plan' });
    }
};

export const endTutorSession = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?.id;

        const session = activeSessions.get(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Generate session summary
        const summaryPrompt = `
        Summarize this tutoring session:
        
        Course: ${session.currentTopic}
        Duration: ${session.messages.length} messages
        Student level: ${session.difficultyLevel}
        
        Key topics discussed:
        ${session.messages.filter(m => m.role === 'user').map(m => m.content).join('\n')}
        
        Provide a brief summary including:
        1. Main topics covered
        2. Student's understanding level
        3. Areas that need more practice
        4. Recommended next steps
        5. Positive achievements in this session
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(summaryPrompt);
        const summary = result.response.text();

        // Update user progress with insights
        await Progress.findOneAndUpdate(
            { userId, courseId: session.courseId },
            {
                $push: {
                    tutoringSessions: {
                        sessionId,
                        date: new Date(),
                        messageCount: session.messages.length,
                        summary,
                        topicsDiscussed: session.currentTopic
                    }
                },
                $addToSet: {
                    strugglingAreas: { $each: session.strugglingAreas },
                    strengths: { $each: session.strengths }
                }
            },
            { upsert: true }
        );

        // Clean up session
        activeSessions.delete(sessionId);

        res.json({
            summary,
            messageCount: session.messages.length,
            duration: session.messages.length > 0 ? 
                new Date().getTime() - session.messages[0].timestamp.getTime() : 0,
            topicsCovered: session.currentTopic
        });

    } catch (error) {
        logger.error('Error ending tutor session:', error);
        res.status(500).json({ error: 'Failed to end tutor session' });
    }
};

// Helper function to update learning insights
async function updateLearningInsights(session: LearningSession, userMessage: string, tutorResponse: string) {
    try {
        // Analyze user message for learning patterns
        const analysisPrompt = `
        Analyze this student interaction for learning insights:
        
        Student question: "${userMessage}"
        Tutor response: "${tutorResponse}"
        Current struggling areas: ${session.strugglingAreas.join(', ')}
        Current strengths: ${session.strengths.join(', ')}
        
        Identify:
        1. New struggling areas (if any)
        2. Demonstrated strengths (if any)
        3. Current topic being discussed
        
        Respond in JSON format:
        {
            "newStrugglingAreas": ["area1", "area2"],
            "newStrengths": ["strength1", "strength2"],
            "currentTopic": "topic name"
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(analysisPrompt);
        const insights = JSON.parse(result.response.text());

        // Update session with new insights
        if (insights.newStrugglingAreas) {
            session.strugglingAreas.push(...insights.newStrugglingAreas);
        }
        if (insights.newStrengths) {
            session.strengths.push(...insights.newStrengths);
        }
        if (insights.currentTopic) {
            session.currentTopic = insights.currentTopic;
        }

        // Remove duplicates
        session.strugglingAreas = [...new Set(session.strugglingAreas)];
        session.strengths = [...new Set(session.strengths)];

    } catch (error) {
        logger.error('Error updating learning insights:', error);
    }
}

export const getActiveSessions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        
        const userSessions = Array.from(activeSessions.entries())
            .filter(([_, session]) => session.userId === userId)
            .map(([sessionId, session]) => ({
                sessionId,
                courseId: session.courseId,
                currentTopic: session.currentTopic,
                messageCount: session.messages.length,
                startTime: session.messages[0]?.timestamp,
                lastActivity: session.messages[session.messages.length - 1]?.timestamp
            }));

        res.json({ sessions: userSessions });

    } catch (error) {
        logger.error('Error getting active sessions:', error);
        res.status(500).json({ error: 'Failed to get active sessions' });
    }
};