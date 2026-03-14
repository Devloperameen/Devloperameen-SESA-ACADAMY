import express from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuthenticate, checkRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { createChatResponse, generateLessonFromTopic, summarizeText } from '../services/aiService.js';

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
    const messages = [
      {
        role: 'system',
        content:
          'You are the SESA AI Assistant. Help learners, instructors, and admins with course navigation, enrollment, payments, content creation, and troubleshooting. Keep answers concise and friendly.',
      },
    ];

    if (context && typeof context === 'string') {
      messages.push({ role: 'system', content: context });
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

export default router;
