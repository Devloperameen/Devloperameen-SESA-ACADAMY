import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, checkRole, type AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
    getPendingReviewCourses,
    previewCourseForReview,
    reviewCourseDecision,
    getFreePreview,
    getFullCourseContent,
    getEnrollmentsForVerification,
    verifyEnrollmentAndGrantAccess,
    getTeacherPendingCourses,
    getTeacherPublishedCourses
} from '../controllers/courseManagementController.js';
import { allowFreePreview, requireFullAccess, requireCourseManagement } from '../middleware/freePreviewAccess.js';

const router = express.Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ─── ADMIN COURSE REVIEW ROUTES ───────────────────────────────────────────────

/**
 * @route   GET /api/admin/courses/pending-review
 * @desc    Get all courses pending admin review
 * @access  Private (Admin Only)
 */
router.get('/admin/courses/pending-review', 
    authenticate, 
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), 
    getPendingReviewCourses
);

/**
 * @route   GET /api/admin/courses/:courseId/preview
 * @desc    Preview course details for admin review
 * @access  Private (Admin Only)
 */
router.get('/admin/courses/:courseId/preview', 
    authenticate, 
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]), 
    previewCourseForReview
);

/**
 * @route   PUT /api/admin/courses/:courseId/review
 * @desc    Admin review decision (accept/reject)
 * @access  Private (Admin Only)
 */
router.put('/admin/courses/:courseId/review',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
    [
        body('decision', 'Decision is required').isIn(['accept', 'reject']),
        body('adminComment').optional().isString().trim()
    ],
    validate,
    reviewCourseDecision
);

// ─── FREE PREVIEW ROUTES ──────────────────────────────────────────────────────

/**
 * @route   GET /api/courses/:courseId/free-preview
 * @desc    Get free preview content (Part 1) for any user
 * @access  Public
 */
router.get('/courses/:courseId/free-preview', getFreePreview);

/**
 * @route   GET /api/courses/:courseId/lesson/:lessonIndex
 * @desc    Get specific lesson content with access control
 * @access  Private (with free preview for Part 1)
 */
router.get('/courses/:courseId/lesson/:lessonIndex',
    authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { courseId, lessonIndex } = req.params;
            const index = parseInt(lessonIndex);

            // Part 1 (index 0) is always free
            if (index === 0) {
                return allowFreePreview(req, res, next);
            }

            // Other lessons require full access
            return requireFullAccess(req, res, next);
        } catch (error) {
            console.error('Lesson access middleware error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    async (req: AuthRequest, res: Response) => {
        try {
            const { courseId, lessonIndex } = req.params;
            const index = parseInt(lessonIndex);

            const course = req.course;
            if (!course || index >= course.lessons.length) {
                return res.status(404).json({ message: 'Lesson not found' });
            }

            const lesson = course.lessons[index];
            const isFreePreview = index === 0;

            res.json({
                course: {
                    _id: course._id,
                    title: course.title,
                    instructor: course.instructor
                },
                lesson,
                accessInfo: {
                    isFreePreview,
                    currentIndex: index,
                    totalLessons: course.lessons.length,
                    nextLessonAvailable: index < course.lessons.length - 1,
                    accessLevel: req.accessLevel || 'guest',
                    lessonAccess: req.lessonAccess || (isFreePreview ? 'free' : 'restricted')
                }
            });
        } catch (error) {
            console.error('Get lesson error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// ─── FULL COURSE ACCESS ROUTES ────────────────────────────────────────────────

/**
 * @route   GET /api/courses/:courseId/full-content
 * @desc    Get full course content (requires enrollment and payment verification)
 * @access  Private (Enrolled & Verified Students Only)
 */
router.get('/courses/:courseId/full-content',
    authenticate,
    requireFullAccess,
    getFullCourseContent
);

// ─── ENROLLMENT VERIFICATION ROUTES ───────────────────────────────────────────

/**
 * @route   GET /api/admin/enrollments/verification
 * @desc    Get all enrollments requiring payment verification
 * @access  Private (Admin Only)
 */
router.get('/admin/enrollments/verification',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
    getEnrollmentsForVerification
);

/**
 * @route   PUT /api/admin/enrollments/:enrollmentId/verify
 * @desc    Verify enrollment and grant full access
 * @access  Private (Admin Only)
 */
router.put('/admin/enrollments/:enrollmentId/verify',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
    [
        body('adminComment').optional().isString().trim()
    ],
    validate,
    verifyEnrollmentAndGrantAccess
);

// ─── TEACHER DASHBOARD ROUTES ────────────────────────────────────────────────

/**
 * @route   GET /api/teacher/courses/my-pending
 * @desc    Get teacher's courses pending admin review
 * @access  Private (Teacher Only)
 */
router.get('/teacher/courses/my-pending',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]),
    getTeacherPendingCourses
);

/**
 * @route   GET /api/teacher/courses/my-published
 * @desc    Get teacher's published courses
 * @access  Private (Teacher Only)
 */
router.get('/teacher/courses/my-published',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]),
    getTeacherPublishedCourses
);

/**
 * @route   GET /api/teacher/courses/my-stats
 * @desc    Get teacher's course statistics
 * @access  Private (Teacher Only)
 */
router.get('/teacher/courses/my-stats',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]),
    async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;

            const totalCourses = await Course.countDocuments({ instructor: userId });
            const pendingCourses = await Course.countDocuments({ 
                instructor: userId, 
                status: 'pending' 
            });
            const publishedCourses = await Course.countDocuments({ 
                instructor: userId, 
                status: 'approved',
                isPublished: true
            });
            const rejectedCourses = await Course.countDocuments({ 
                instructor: userId, 
                status: 'rejected' 
            });

            // Get total students across all published courses
            const publishedCoursesData = await Course.find({
                instructor: userId,
                status: 'approved',
                isPublished: true
            }).select('enrolledStudents');

            const totalStudents = publishedCoursesData.reduce(
                (sum, course) => sum + course.enrolledStudents.length, 0
            );

            res.json({
                stats: {
                    totalCourses,
                    pendingCourses,
                    publishedCourses,
                    rejectedCourses,
                    totalStudents,
                    approvalRate: totalCourses > 0 ? (publishedCourses / totalCourses * 100).toFixed(1) : '0'
                }
            });
        } catch (error) {
            console.error('Get teacher stats error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// ─── COURSE MANAGEMENT ROUTES ────────────────────────────────────────────────

/**
 * @route   PATCH /api/courses/:courseId/toggle-lock
 * @desc    Lock or unlock a course (Admin/Instructor)
 * @access  Private (Admin/Instructor)
 */
router.patch('/courses/:courseId/toggle-lock',
    authenticate,
    requireCourseManagement,
    [
        body('locked', 'Locked status is required').isBoolean()
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { locked } = req.body;
            const course = req.course!;

            if (locked) {
                course.status = 'locked';
                course.lockedAt = new Date();
                course.isPublished = false;
            } else {
                course.status = 'approved';
                course.lockedAt = undefined;
                course.isPublished = true;
            }

            await course.save();

            res.json({
                message: `Course ${locked ? 'locked' : 'unlocked'} successfully`,
                course: {
                    _id: course._id,
                    title: course.title,
                    status: course.status,
                    isPublished: course.isPublished,
                    lockedAt: course.lockedAt
                }
            });
        } catch (error) {
            console.error('Toggle course lock error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   PATCH /api/courses/:courseId/toggle-visibility
 * @desc    Show or hide a course (Admin/Instructor)
 * @access  Private (Admin/Instructor)
 */
router.patch('/courses/:courseId/toggle-visibility',
    authenticate,
    requireCourseManagement,
    [
        body('visible', 'Visibility status is required').isBoolean()
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { visible } = req.body;
            const course = req.course!;

            course.isHidden = !visible;
            course.isPublished = visible;

            await course.save();

            res.json({
                message: `Course ${visible ? 'made visible' : 'hidden'} successfully`,
                course: {
                    _id: course._id,
                    title: course.title,
                    isHidden: course.isHidden,
                    isPublished: course.isPublished
                }
            });
        } catch (error) {
            console.error('Toggle course visibility error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;