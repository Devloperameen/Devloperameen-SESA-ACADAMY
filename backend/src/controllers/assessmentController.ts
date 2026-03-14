import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Quiz from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';

// ─── QUIZ CONTROLLERS ────────────────────────────────────────────────────────

/**
 * @desc    Create a new quiz for a course
 */
export const createQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { title, description, questions, timeLimit, passingScore, attemptsAllowed } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Only instructor or admin can add quiz
        if (course.instructor.toString() !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const quiz = new Quiz({
            course: courseId,
            title,
            description,
            questions,
            timeLimit,
            passingScore,
            attemptsAllowed
        });

        await quiz.save();

        // Add reference to course
        course.quizzes.push(quiz._id as any);
        await course.save();

        res.status(201).json(quiz);
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get all quizzes for a course
 */
export const getCourseQuizzes = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const quizzes = await Quiz.find({ course: courseId });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── ASSIGNMENT CONTROLLERS ──────────────────────────────────────────────────

/**
 * @desc    Create a new assignment
 */
export const createAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { title, description, resourceUrls, deadline, maxScore, instructions } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const assignment = new Assignment({
            course: courseId,
            title,
            description,
            resourceUrls,
            deadline,
            maxScore,
            instructions
        });

        await assignment.save();

        course.assignments.push(assignment._id as any);
        await course.save();

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── SUBMISSION CONTROLLERS ──────────────────────────────────────────────────

/**
 * @desc    Submit a quiz or assignment
 */
export const submitAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, assessmentType, assessmentId } = req.body;
        const { answers, fileUrl, textResponse } = req.body;

        const submission = new Submission({
            user: req.user!.id,
            course: courseId,
            assessmentType,
            quizId: assessmentType === 'quiz' ? assessmentId : undefined,
            assignmentId: assessmentType === 'assignment' ? assessmentId : undefined,
            answers,
            fileUrl,
            textResponse,
            status: assessmentType === 'quiz' ? 'graded' : 'pending' // Quizzes auto-graded later
        });

        if (assessmentType === 'quiz') {
            const quiz = await Quiz.findById(assessmentId);
            if (quiz) {
                let correctCount = 0;
                answers.forEach((ans: any, idx: number) => {
                    if (ans === quiz.questions[idx].correctAnswer) correctCount++;
                });
                // Simple score based on total questions
                submission.score = Math.round((correctCount / quiz.questions.length) * 100);
            }
        }

        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GRADEBOOK CONTROLLERS ───────────────────────────────────────────────────

/**
 * @desc    Add or update a manual mark (Midterm, Final, etc.)
 */
export const updateMark = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, courseId, assessmentType, score, feedback } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Authorization: Instructor or Admin
        if (course.instructor.toString() !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to award marks' });
        }

        // Upsert submission as the record of truth for the mark
        const query = {
            user: studentId,
            course: courseId,
            assessmentType
        };

        const update = {
            score,
            feedback,
            status: 'graded',
            gradedBy: req.user!.id,
            gradedAt: new Date(),
            submittedAt: new Date() // For manual marks, submission = grading
        };

        const submission = await Submission.findOneAndUpdate(query, update, {
            new: true,
            upsert: true
        });

        res.json(submission);
    } catch (error) {
        console.error('Update mark error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get gradebook for a course (Student view)
 */
export const getStudentGradebook = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const marks = await Submission.find({
            user: userId,
            course: courseId
        }).select('assessmentType score feedback status gradedAt');

        res.json(marks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get full gradebook for a course (Instructor/Admin view)
 */
export const getCourseGradebook = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const gradebook = await Submission.find({ course: courseId })
            .populate('user', 'name email')
            .select('user assessmentType score status');

        res.json(gradebook);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
