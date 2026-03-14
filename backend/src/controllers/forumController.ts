import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import ForumThread from '../models/Forum.js';

/**
 * @desc    Create a new forum thread
 */
export const createThread = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, title, text, content } = req.body;
        const messageText = content || text;
        const thread = new ForumThread({
            course: courseId,
            title,
            creator: req.user!.id,
            posts: [{
                user: req.user!.id,
                userName: req.user!.name,
                text: messageText
            }]
        });
        await thread.save();
        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get all threads for a course
 */
export const getCourseThreads = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const threads = await ForumThread.find({ course: courseId }).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Add a post to a thread
 */
export const addPost = async (req: AuthRequest, res: Response) => {
    try {
        const { threadId } = req.params;
        const { text, content } = req.body;
        const messageText = content || text;
        const thread = await ForumThread.findById(threadId);
        if (!thread) return res.status(404).json({ message: 'Thread not found' });

        thread.posts.push({
            user: req.user!.id as any,
            userName: req.user!.name,
            text: messageText,
            createdAt: new Date()
        });
        await thread.save();
        res.json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
