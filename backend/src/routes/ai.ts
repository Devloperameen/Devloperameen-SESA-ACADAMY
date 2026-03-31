import express from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuthenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
  createChatResponse,
  generateLessonFromTopic,
  summarizeText,
  generateQuizFromContent,
  extractKeyPoints,
  generateRecommendations,
  chatbotResponse,
  generateStudyPlan,
  analyzePerformance
} from '../services/aiService.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import Progress from '../models/Progress.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Basic health check for AI service
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', feature: 'ai', timestamp: new Date().toISOString() });
});

// Chat endpoint (can be used for the chatbot UI)
router.post('/chat', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Missing required field: message' });
    }

    // Base system prompt to guide responses toward the platform's capabilities.
    const messages: { role: 'user' | 'system' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content:
          'You are the SafeEdu AI Assistant. Help learners, instructors, and admins with course navigation, enrollment, payments, content creation, and troubleshooting. Keep answers concise and friendly.',
      },
    ];

    if (context && typeof context === 'string') {
      messages.push({ role: 'system' as const, content: context });
    }

    messages.push({ role: 'user', content: message });

    const aiText = await createChatResponse(messages, { temperature: 0.7, maxTokens: 600 });
    res.json({ reply: aiText });
  } catch (error) {
    console.error('AI chat failed', error);
    res.status(500).json({ message: 'AI service is currently unavailable' });
  }
});

// Generate a lesson outline and quiz for a given topic
router.post(
  '/generate-lesson',
  authenticate,
  checkRole([UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { topic, level, language } = req.body;
      if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ message: 'Missing required field: topic' });
      }

      const lesson = await generateLessonFromTopic(topic, level || 'beginner', language || 'English');
      res.json({ lesson });
    } catch (error) {
      console.error('AI lesson generation failed', error);
      res.status(500).json({ message: 'Unable to generate lesson content at this time' });
    }
  }
);

// Summarize text or transcript
router.post('/summarize', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { text, maxSentences } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Missing required field: text' });
    }

    const summary = await summarizeText(text, typeof maxSentences === 'number' ? maxSentences : 5);
    res.json({ summary });
  } catch (error) {
    console.error('AI summarization failed', error);
    res.status(500).json({ message: 'Unable to summarize content at this time' });
  }
});

// Generate quiz questions from lesson content
router.post(
  '/generate-quiz',
  authenticate,
  checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { lessonContent, numberOfQuestions, difficulty } = req.body;

      if (!lessonContent || typeof lessonContent !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: lessonContent'
        });
      }

      const questions = await generateQuizFromContent(
        lessonContent,
        numberOfQuestions || 5,
        difficulty || 'medium'
      );

      res.json({
        success: true,
        data: questions,
        message: 'Quiz questions generated successfully'
      });
    } catch (error) {
      console.error('AI quiz generation failed', error);
      res.status(500).json({
        success: false,
        message: 'Unable to generate quiz questions at this time',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Extract key points from content
router.post('/extract-key-points', authenticate, async (req: Request, res: Response) => {
  try {
    const { content, numberOfPoints } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: content'
      });
    }

    const keyPoints = await extractKeyPoints(content, numberOfPoints || 5);

    res.json({
      success: true,
      data: keyPoints,
      message: 'Key points extracted successfully'
    });
  } catch (error) {
    console.error('AI key points extraction failed', error);
    res.status(500).json({
      success: false,
      message: 'Unable to extract key points at this time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get personalized course recommendations
router.get('/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;

    // Get student's completed courses
    const enrollments = await Enrollment.find({
      studentId,
      status: 'approved' // Use approved instead of completed if that's the status
    }).populate<{ course: { title: string; category: string; level: string; _id: any } }>('course', 'title category level');

    const completedCourses = enrollments.map(e => e.course.title);

    // Get student's progress to identify weak/strong areas
    const progressRecords = await Progress.find({ studentId })
      .populate<{ course: { title: string; category: string } }>('course', 'title category');

    // Simple analysis of performance
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    progressRecords.forEach(progress => {
      const course = progress.course as any;
      if (progress.completionPercentage < 60) {
        weakAreas.push(course.category);
      } else if (progress.completionPercentage > 85) {
        strongAreas.push(course.category);
      }
    });

    // Get available courses
    const availableCourses = await Course.find({
      isPublished: true, // Use isPublished instead of status
      _id: { $nin: enrollments.map(e => e.course._id) }
    }).select('title description level category').limit(20);

    const coursesForAI = availableCourses.map(c => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      level: c.level as string,
      category: (c.category as any)?.toString() || ''
    }));

    const studentProfile = {
      completedCourses,
      currentLevel: 'intermediate', // Could be calculated from progress
      interests: [...new Set(enrollments.map(e => (e.course as any).category.toString()))],
      weakAreas: [...new Set(weakAreas)],
      strongAreas: [...new Set(strongAreas)]
    };

    const recommendations = await generateRecommendations(studentProfile, coursesForAI);

    res.json({
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully'
    });
  } catch (error) {
    console.error('AI recommendations failed', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate recommendations at this time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// AI Chatbot endpoint
router.post('/chatbot', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationHistory, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: message'
      });
    }

    const response = await chatbotResponse(
      message,
      conversationHistory || [],
      context
    );

    res.json({
      success: true,
      data: { response },
      message: 'Chatbot response generated successfully'
    });
  } catch (error) {
    console.error('AI chatbot failed', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate chatbot response at this time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate personalized study plan
router.post('/study-plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, targetCompletionDate, availableHoursPerWeek, preferredStudyDays } = req.body;

    if (!courseId || !targetCompletionDate || !availableHoursPerWeek) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, targetCompletionDate, availableHoursPerWeek'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const courseDetails = {
      title: course.title,
      totalLessons: course.lessons?.length || 10,
      estimatedHours: typeof course.duration === 'string' ? parseInt(course.duration) || 20 : course.duration || 20
    };

    const studentGoals = {
      targetCompletionDate: new Date(targetCompletionDate),
      availableHoursPerWeek: Number(availableHoursPerWeek),
      preferredStudyDays: preferredStudyDays || ['Monday', 'Wednesday', 'Friday']
    };

    const studyPlan = await generateStudyPlan(courseDetails, studentGoals);

    res.json({
      success: true,
      data: studyPlan,
      message: 'Study plan generated successfully'
    });
  } catch (error) {
    console.error('AI study plan generation failed', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate study plan at this time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analyze student performance
router.get('/performance-analysis', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;

    // Get quiz scores
    const quizAttempts = await Quiz.find({
      'attempts.studentId': studentId
    }).select('attempts');

    const quizScores: number[] = [];
    quizAttempts.forEach(quiz => {
      quiz.attempts.forEach(attempt => {
        if (attempt.studentId.toString() === studentId) {
          quizScores.push(attempt.percentage);
        }
      });
    });

    // Get assignment scores
    const assignments = await Assignment.find({
      'submissions.studentId': studentId,
      'submissions.status': 'graded'
    }).select('submissions maxScore');

    const assignmentScores: number[] = [];
    assignments.forEach(assignment => {
      assignment.submissions.forEach(submission => {
        if (submission.studentId.toString() === studentId && submission.grade !== undefined) {
          const percentage = (submission.grade / assignment.maxPoints) * 100;
          assignmentScores.push(percentage);
        }
      });
    });

    // Get completion rate
    const progressRecords = await Progress.find({ studentId });
    const completionRate = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + p.completionPercentage, 0) / progressRecords.length
      : 0;

    // Calculate average time per lesson (simplified)
    const averageTimePerLesson = 25; // Could be calculated from actual data

    // Identify struggling topics (simplified)
    const strugglingTopics: string[] = [];
    progressRecords.forEach(progress => {
      if (progress.completionPercentage < 60) {
        strugglingTopics.push(progress.course.toString());
      }
    });

    const performanceData = {
      quizScores,
      assignmentScores,
      completionRate,
      averageTimePerLesson,
      strugglingTopics
    };

    const analysis = await analyzePerformance(performanceData);

    res.json({
      success: true,
      data: {
        ...analysis,
        rawData: performanceData
      },
      message: 'Performance analysis completed successfully'
    });
  } catch (error) {
    console.error('AI performance analysis failed', error);
    res.status(500).json({
      success: false,
      message: 'Unable to analyze performance at this time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
