import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Evaluation from '../models/Evaluation.js';
import Course from '../models/Course.js';

/**
 * @desc    Submit a teacher evaluation
 * @route   POST /api/evaluations
 */
export const submitEvaluation = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, instructorId, ratings, feedback } = req.body;

        // Check if student is enrolled in the course
        const studentId = req.user!.id;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if evaluation already exists
        const existing = await Evaluation.findOne({
            student: studentId,
            instructor: instructorId,
            course: courseId
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already evaluated this instructor for this course' });
        }

        const evaluation = new Evaluation({
            student: studentId,
            instructor: instructorId,
            course: courseId,
            ratings,
            feedback
        });

        await evaluation.save();
        res.status(201).json(evaluation);
    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get evaluations for an instructor
 * @route   GET /api/evaluations/instructor/:instructorId
 */
export const getInstructorEvaluations = async (req: AuthRequest, res: Response) => {
    try {
        const { instructorId } = req.params;
        
        // Only admin or the instructor themselves can see detailed evaluations
        if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin' && req.user!.id !== instructorId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const evaluations = await Evaluation.find({ instructor: instructorId })
            .populate('student', 'name email')
            .populate('course', 'title');
            
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
