import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import { authenticate, checkRole, type AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ─── ENROLLMENT APPROVAL ──────────────────────────────────────────────────────

const hasPendingEnrollment = (course: any, studentId: string): boolean => {
    const inPendingApprovals = course.pendingApprovals.some((id: mongoose.Types.ObjectId) => id.toString() === studentId);
    if (inPendingApprovals) return true;
    return course.students.some((entry: any) => entry.studentId.toString() === studentId && entry.status === 'pending');
};

router.put(
    '/approve-enrollment',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
    [
        body('courseId', 'Valid courseId is required').isMongoId(),
        body('studentId', 'Valid studentId is required').isMongoId(),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { courseId, studentId } = req.body;

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            if (!hasPendingEnrollment(course, studentId)) {
                return res.status(400).json({ message: 'Student is not pending approval for this course' });
            }

            course.pendingApprovals = course.pendingApprovals.filter(
                (id: mongoose.Types.ObjectId) => id.toString() !== studentId
            );

            const alreadyEnrolled = course.enrolledStudents.some(
                (id: mongoose.Types.ObjectId) => id.toString() === studentId
            );
            if (!alreadyEnrolled) {
                course.enrolledStudents.push(new mongoose.Types.ObjectId(studentId));
            }

            const existing = course.students.find((entry) => entry.studentId.toString() === studentId);
            if (existing) {
                existing.status = 'approved';
                existing.approvedAt = new Date();
            } else {
                course.students.push({
                    studentId: new mongoose.Types.ObjectId(studentId),
                    status: 'approved',
                    enrolledAt: new Date(),
                    approvedAt: new Date(),
                });
            }

            await course.save();

            res.json({
                message: 'Enrollment approved successfully',
                courseId,
                studentId,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// ─── ADMIN COURSE MANAGEMENT ──────────────────────────────────────────────────

// @route   GET /api/admin/courses
// @desc    Get all courses for admin management
// @access  Admin
router.get('/courses', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name email')
            .populate('category', 'name icon')
            .select('-students -enrolledStudents -pendingApprovals -comments -reviews -lessons')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/courses/:id/lock
// @desc    Lock a course (prevents student access)
// @access  Admin
router.patch('/courses/:id/lock', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.status = 'locked';
        course.lockedAt = new Date();
        await course.save();

        res.json({ message: 'Course locked successfully', courseId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/courses/:id/unlock
// @desc    Unlock a previously locked course (back to approved)
// @access  Admin
router.patch('/courses/:id/unlock', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.status = 'approved';
        course.lockedAt = undefined;
        await course.save();

        res.json({ message: 'Course unlocked successfully', courseId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/courses/:id/hide
// @desc    Hide a course from student browse
// @access  Admin
router.patch('/courses/:id/hide', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.isHidden = true;
        course.isPublished = false;
        await course.save();

        res.json({ message: 'Course hidden from students', courseId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/courses/:id/show
// @desc    Unhide a course
// @access  Admin
router.patch('/courses/:id/show', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.isHidden = false;
        course.isPublished = true;
        await course.save();

        res.json({ message: 'Course is now visible to students', courseId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Admin delete any course
// @access  Admin
router.delete('/courses/:id', authenticate, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        res.json({ message: 'Course deleted permanently', courseId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/courses/:id/status
// @desc    Set full course status (approve/reject/lock/hide/published/pending)
// @access  Admin
router.patch(
    '/courses/:id/status',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
    [
        body('status').isIn(['pending', 'approved', 'rejected', 'locked', 'hidden']),
        body('adminComment').optional().isString(),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const course = await Course.findById(req.params.id);
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const { status, adminComment } = req.body;
            course.status = status;
            if (adminComment) course.adminComment = adminComment;

            if (status === 'approved') {
                course.isPublished = true;
                course.isHidden = false;
                course.lockedAt = undefined;
            } else if (status === 'locked') {
                course.lockedAt = new Date();
            } else if (status === 'hidden') {
                course.isPublished = false;
                course.isHidden = true;
            } else if (status === 'rejected') {
                course.isPublished = false;
            }

            await course.save();
            res.json({ message: `Course status updated to ${status}`, course });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
