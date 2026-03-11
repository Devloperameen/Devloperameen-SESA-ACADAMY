import express from 'express';
import type { Request, NextFunction } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Course, { type ICourse } from '../models/Course.js';
import User, { UserRole } from '../models/User.js';
import { authenticate, checkRole, optionalAuthenticate, type AuthRequest } from '../middleware/auth.js';
import { verifyAccess } from '../middleware/verifyAccess.js';
import { parseYouTubeUrl, validateYouTubeUrl } from '../utils/youtubeParser.js';

const router = express.Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const uniqueObjectIds = (ids: (mongoose.Types.ObjectId | string)[]): mongoose.Types.ObjectId[] => {
    return Array.from(new Set(ids.map((id) => id.toString()))).map((id) => new mongoose.Types.ObjectId(id));
};

const syncEnrollmentArrays = (course: ICourse): void => {
    const approved = uniqueObjectIds(
        course.students
            .filter((entry) => entry.status === 'approved')
            .map((entry) => entry.studentId)
    );

    const pending = uniqueObjectIds(
        course.students
            .filter((entry) => entry.status === 'pending')
            .map((entry) => entry.studentId)
    );

    course.enrolledStudents = approved;
    course.pendingApprovals = pending;
};

const getEnrollmentStatus = (course: ICourse, userId: string): 'approved' | 'pending' | 'rejected' | 'unknown' => {
    const inApproved = course.enrolledStudents.some((id) => id.toString() === userId);
    if (inApproved) return 'approved';

    const inPending = course.pendingApprovals.some((id) => id.toString() === userId);
    if (inPending) return 'pending';

    const legacy = course.students.find((entry) => entry.studentId.toString() === userId);
    if (!legacy) return 'unknown';

    return legacy.status;
};

const movePendingToApproved = (course: ICourse, studentId: string): { ok: boolean; message?: string } => {
    const isPending = course.pendingApprovals.some((id) => id.toString() === studentId) ||
        course.students.some((entry) => entry.studentId.toString() === studentId && entry.status === 'pending');

    if (!isPending) {
        return { ok: false, message: 'Student is not pending approval for this course' };
    }

    course.pendingApprovals = course.pendingApprovals.filter((id) => id.toString() !== studentId);

    const isAlreadyEnrolled = course.enrolledStudents.some((id) => id.toString() === studentId);
    if (!isAlreadyEnrolled) {
        course.enrolledStudents.push(new mongoose.Types.ObjectId(studentId));
    }

    const existingEnrollment = course.students.find((entry) => entry.studentId.toString() === studentId);
    if (existingEnrollment) {
        existingEnrollment.status = 'approved';
        existingEnrollment.approvedAt = new Date();
    } else {
        course.students.push({
            studentId: new mongoose.Types.ObjectId(studentId),
            status: 'approved',
            enrolledAt: new Date(),
            approvedAt: new Date(),
        });
    }

    return { ok: true };
};

const requestEnrollment = async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const watchedPart1 = req.body?.watchedPart1 === true || req.body?.watchedPart1 === 'true';
        if (!watchedPart1) {
            return res.status(400).json({ message: 'Watch Part 1 first to request enrollment' });
        }

        const studentId = req.user!.id;

        if (course.enrolledStudents.some((id) => id.toString() === studentId)) {
            return res.status(400).json({ message: 'You are already enrolled in this course' });
        }

        if (course.pendingApprovals.some((id) => id.toString() === studentId)) {
            return res.status(400).json({ message: 'Your enrollment request is already pending approval' });
        }

        const existingEnrollment = course.students.find((entry) => entry.studentId.toString() === studentId);
        if (existingEnrollment) {
            existingEnrollment.status = 'pending';
            existingEnrollment.enrolledAt = new Date();
            delete (existingEnrollment as any).approvedAt;
        } else {
            course.students.push({
                studentId: new mongoose.Types.ObjectId(studentId),
                status: 'pending',
                enrolledAt: new Date(),
            });
        }

        syncEnrollmentArrays(course);
        await course.save();

        res.json({ message: 'Enrollment request added to pending approvals' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   POST api/courses
// @desc    Create Course (Instructor/Admin only) - Auto goes to Admin Review Mode
// @access  Private
router.post(
    '/',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]),
    [
        body('title', 'Title is required').trim().notEmpty().escape(),
        body('description', 'Description is required').trim().notEmpty().escape(),
        body('resourceUrl').optional().isString(),
        body('previewVideoUrl').optional().isString(),
        body('lessons').optional().isArray(),
        body('price').optional().isFloat({ min: 0 }),
        body('category').optional().isMongoId(),
        body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
        body('duration').optional().trim(),
        body('tags').optional().isArray(),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const {
                title,
                description,
                resourceUrl,
                previewVideoUrl,
                lessons,
                category,
                level,
                duration,
                tags,
                price,
            } = req.body;

            const effectivePreviewVideo = previewVideoUrl || resourceUrl;
            if (!effectivePreviewVideo) {
                return res.status(400).json({ message: 'A preview video URL is required' });
            }

            if (!validateYouTubeUrl(effectivePreviewVideo)) {
                return res.status(400).json({ message: 'Invalid preview YouTube URL' });
            }

            const youtubeData = parseYouTubeUrl(effectivePreviewVideo);
            if (!youtubeData) {
                return res.status(400).json({ message: 'Invalid YouTube URL' });
            }

            const normalizedLessons = Array.isArray(lessons)
                ? lessons.filter((lesson: any) => typeof lesson === 'object' && lesson !== null && lesson.title && lesson.videoUrl)
                : [];

            // Auto-set status to "Pending Approval" for teacher-created courses
            const isTeacher = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
            const initialStatus = isTeacher ? 'pending' : 'approved';
            const isPublished = !isTeacher; // Only auto-publish if created by admin

            const course = new Course({
                title,
                description,
                resourceUrl: effectivePreviewVideo,
                previewVideoUrl: effectivePreviewVideo,
                lessons: normalizedLessons,
                youtubeVideoId: youtubeData.videoId,
                thumbnailUrl: youtubeData.thumbnailUrl,
                category,
                level,
                duration,
                tags,
                price: typeof price === 'number' ? price : Number(price) || 0,
                instructor: req.user!.id,
                students: [],
                enrolledStudents: [],
                pendingApprovals: [],
                comments: [],
                reviews: [],
                status: initialStatus,
                isPublished,
                isHidden: isTeacher, // Hide from students while pending
            });

            await course.save();
            await course.populate('instructor', 'name');
            await course.populate('category', 'name icon');

            res.status(201).json({
                ...course.toObject(),
                message: isTeacher 
                    ? 'Course created successfully and submitted for admin review' 
                    : 'Course created and published successfully'
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET api/courses
// @desc    Get all courses (privacy aware)
// @access  Public/Private
router.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role === UserRole.STUDENT) {
            const studentCourses = await Course.find({
                status: 'approved',
                isPublished: true,
                enrolledStudents: req.user.id,
            })
                .populate('instructor', 'name')
                .populate('category', 'name icon')
                .sort({ createdAt: -1 });

            return res.json(studentCourses);
        }

        if (
            req.user?.role === UserRole.ADMIN ||
            req.user?.role === UserRole.SUPER_ADMIN ||
            req.user?.role === UserRole.INSTRUCTOR
        ) {
            const staffCourses = await Course.find()
                .populate('instructor', 'name')
                .populate('category', 'name icon')
                .sort({ createdAt: -1 });

            return res.json(staffCourses);
        }

        const publicCourses = await Course.find({ status: 'approved', isPublished: true })
            .populate('instructor', 'name')
            .populate('category', 'name icon')
            .select('-students -enrolledStudents -pendingApprovals -lessons')
            .sort({ createdAt: -1 });

        const sanitized = publicCourses.map((course) => {
            const data = course.toObject();
            delete (data as any).resourceUrl;
            return data;
        });

        res.json(sanitized);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/my/created
// @desc    Get courses created by current instructor
// @access  Private (Instructor/Admin)
router.get('/my/created', authenticate, checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const courses = await Course.find({ instructor: req.user!.id })
            .populate('instructor', 'name')
            .populate('category', 'name icon')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/my/enrolled
// @desc    Get courses enrolled by current student
// @access  Private (Student)
router.get('/my/enrolled', authenticate, checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]), async (req: AuthRequest, res: Response) => {
    try {
        const approvedOnly = req.query.approved === 'true';
        const studentId = req.user!.id;

        const courses = await Course.find({
            $or: [
                { enrolledStudents: studentId },
                { pendingApprovals: studentId },
                { 'students.studentId': studentId },
            ],
        })
            .populate('instructor', 'name')
            .populate('category', 'name icon');

        const coursesWithStatus = courses
            .map((course) => {
                const enrollmentStatus = getEnrollmentStatus(course, studentId);
                const enrollment = course.students.find((entry) => entry.studentId.toString() === studentId);

                if (approvedOnly && enrollmentStatus !== 'approved') {
                    return null;
                }

                return {
                    ...course.toObject(),
                    enrollmentStatus,
                    enrolledAt: enrollment?.enrolledAt,
                    approvedAt: enrollment?.approvedAt,
                };
            })
            .filter(Boolean);

        res.json(coursesWithStatus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/courses/enroll/:id
// @desc    Request enrollment after watching part 1
// @access  Private (Student)
router.post('/enroll/:id', authenticate, checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]), requestEnrollment);

// Legacy route compatibility
router.post('/:id/enroll', authenticate, checkRole([UserRole.STUDENT, UserRole.PREMIUM_STUDENT]), requestEnrollment);

// @route   PUT api/courses/approve
// @desc    Approve pending enrollment (admin only)
// @access  Private (Admin)
router.put(
    '/approve',
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
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const approval = movePendingToApproved(course, studentId);
            if (!approval.ok) {
                return res.status(400).json({ message: approval.message });
            }

            syncEnrollmentArrays(course);
            await course.save();

            res.json({ message: 'Student moved to enrolledStudents', courseId, studentId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Optional helper route for explicit rejection from approval queue
router.put(
    '/reject',
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
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const enrollment = course.students.find((entry) => entry.studentId.toString() === studentId);
            if (enrollment) {
                enrollment.status = 'rejected';
                delete (enrollment as any).approvedAt;
            }

            syncEnrollmentArrays(course);
            await course.save();

            res.json({ message: 'Student rejected from approval queue', courseId, studentId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   PATCH api/courses/:id/approve/:studentId
// @desc    Approve enrollment (admin/instructor)
// @access  Private
router.patch('/:id/approve/:studentId', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isInstructorLike = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
        if (isInstructorLike && course.instructor.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        const studentIdParam = String(req.params.studentId);
        const approval = movePendingToApproved(course, studentIdParam);
        if (!approval.ok) {
            return res.status(400).json({ message: approval.message });
        }

        syncEnrollmentArrays(course);
        await course.save();

        res.json({ message: 'Student approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH api/courses/:id/reject/:studentId
// @desc    Reject student enrollment
// @access  Private (Instructor/Admin)
router.patch('/:id/reject/:studentId', authenticate, checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isInstructorLike = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
        if (isInstructorLike && course.instructor.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized for this course' });
        }

        const enrollment = course.students.find((entry) => entry.studentId.toString() === req.params.studentId);
        if (!enrollment) return res.status(404).json({ message: 'Enrollment record not found' });

        enrollment.status = 'rejected';
        delete (enrollment as any).approvedAt;

        syncEnrollmentArrays(course);
        await course.save();

        res.json({ message: 'Student enrollment rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/:id/students
// @desc    Get enrollment list for a course
// @access  Private (Instructor/Admin)
router.get('/:id/students', authenticate, checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).populate('students.studentId', 'name email role');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isInstructorLike = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
        if (isInstructorLike && course.instructor.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized to view students for this course' });
        }

        res.json(course.students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/:id/comments
// @desc    Get discussion comments
// @access  Private
router.get('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).select('comments enrolledStudents instructor');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
        const isTeacher = req.user!.role === UserRole.INSTRUCTOR;
        const isEnrolledStudent = course.enrolledStudents.some((id) => id.toString() === req.user!.id);

        if (!isAdmin && !isTeacher && !isEnrolledStudent) {
            return res.status(403).json({ message: 'Only enrolled students can view this discussion' });
        }

        const comments = [...course.comments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/courses/:id/comments
// @desc    Add discussion comment
// @access  Private
router.post(
    '/:id/comments',
    authenticate,
    [body('text', 'Comment text is required').trim().isLength({ min: 1, max: 800 })],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const course = await Course.findById(req.params.id).select('comments enrolledStudents');
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
            const isTeacher = req.user!.role === UserRole.INSTRUCTOR;
            const isEnrolledStudent = course.enrolledStudents.some((id) => id.toString() === req.user!.id);

            if (!isAdmin && !isTeacher && !isEnrolledStudent) {
                return res.status(403).json({ message: 'Only enrolled students can post in this discussion' });
            }

            const user = await User.findById(req.user!.id).select('name role');
            if (!user) return res.status(404).json({ message: 'User not found' });

            course.comments.push({
                userId: user._id,
                userName: user.name,
                userRole: user.role,
                text: req.body.text,
                createdAt: new Date(),
            });

            await course.save();
            const createdComment = course.comments[course.comments.length - 1];
            res.status(201).json(createdComment);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   DELETE api/courses/:id/comments/:commentId
// @desc    Delete discussion comment (admin/teacher)
// @access  Private
router.delete('/:id/comments/:commentId', authenticate, checkRole(['admin', 'moderator', 'teacher', 'assistant_instructor']), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).select('comments');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const commentIndex = course.comments.findIndex((comment: any) => comment._id?.toString() === req.params.commentId);
        if (commentIndex === -1) return res.status(404).json({ message: 'Comment not found' });

        course.comments.splice(commentIndex, 1);
        await course.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/:id/reviews
// @desc    Get course reviews
// @access  Public
router.get('/:id/reviews', async (req: Request, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).select('reviews');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const reviews = [...course.reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/courses/:id/reviews
// @desc    Add a course review
// @access  Private
router.post(
    '/:id/reviews',
    authenticate,
    [
        body('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
        body('text', 'Review text is required').trim().isLength({ min: 1, max: 1000 })
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const course = await Course.findById(req.params.id).select('reviews enrolledStudents students');
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const isEnrolledStudent = course.enrolledStudents.some((id) => id.toString() === req.user!.id);

            // Admins shouldn't review courses unless enrolled
            if (!isEnrolledStudent) {
                return res.status(403).json({ message: 'Only enrolled students can review this course' });
            }

            // Check if user already reviewed
            const hasReviewed = course.reviews.some((review) => review.userId.toString() === req.user!.id);
            if (hasReviewed) {
                return res.status(400).json({ message: 'You have already reviewed this course' });
            }

            const user = await User.findById(req.user!.id).select('name role');
            if (!user) return res.status(404).json({ message: 'User not found' });

            course.reviews.push({
                userId: user._id,
                userName: user.name,
                userRole: user.role,
                rating: req.body.rating,
                text: req.body.text,
                createdAt: new Date(),
            });

            await course.save();
            const createdReview = course.reviews[course.reviews.length - 1];
            res.status(201).json(createdReview);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   DELETE api/courses/:id/reviews/:reviewId
// @desc    Delete a course review (admin/teacher or review author)
// @access  Private
router.delete('/:id/reviews/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).select('reviews instructor');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const reviewIndex = course.reviews.findIndex((review: any) => review._id?.toString() === req.params.reviewId);
        if (reviewIndex === -1) return res.status(404).json({ message: 'Review not found' });

        const review = course.reviews[reviewIndex];
        const isAdminOrMod = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN || req.user!.role === UserRole.MODERATOR;
        const isInstructor = course.instructor.toString() === req.user!.id;
        const isAuthor = review.userId.toString() === req.user!.id;

        if (!isAdminOrMod && !isInstructor && !isAuthor) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        course.reviews.splice(reviewIndex, 1);
        await course.save();

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/:id
// @desc    Get single course with resource access control
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const userId = req.user!.id;
        const isInstructor = course.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
        const isEnrolled = course.enrolledStudents.some((id) => id.toString() === userId);

        if (isAdmin || isInstructor || isEnrolled) {
            return res.json(course);
        }

        const courseData = course.toObject();
        const previewVideoUrl = course.previewVideoUrl || course.resourceUrl;
        delete (courseData as any).lessons;

        return res.json({
            ...courseData,
            resourceUrl: previewVideoUrl,
            previewVideoUrl,
            message: 'Enrollment required or approval pending to view full curriculum',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/courses/:courseId/content
// @desc    Get protected course content (videos, links, etc.)
// @access  Private (Approved Students/Admins/Instructors)
router.get('/:courseId/content', authenticate, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.courseId).select('title lockedContent lessons');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        res.json({
            title: course.title,
            lockedContent: course.lockedContent,
            lessons: course.lessons
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/courses/:id
// @desc    Update course (instructor/admin only)
// @access  Private
router.put(
    '/:id',
    authenticate,
    checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]),
    [
        body('title').optional().trim().notEmpty().escape(),
        body('description').optional().trim().notEmpty().escape(),
        body('resourceUrl').optional().isString(),
        body('previewVideoUrl').optional().isString(),
        body('lessons').optional().isArray(),
        body('price').optional().isFloat({ min: 0 }),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const course = await Course.findById(req.params.id);
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const isInstructorLike = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
            if (isInstructorLike && course.instructor.toString() !== req.user!.id) {
                return res.status(403).json({ message: 'Not authorized to update this course' });
            }

            const { title, description, resourceUrl, previewVideoUrl, lessons, price } = req.body;
            if (title) course.title = title;
            if (description) course.description = description;
            if (Array.isArray(lessons)) {
                course.lessons = lessons.filter(
                    (lesson: any) => typeof lesson === 'object' && lesson !== null && lesson.title && lesson.videoUrl
                );
            }

            if (typeof price === 'number' || typeof price === 'string') {
                const normalizedPrice = Number(price);
                if (!Number.isNaN(normalizedPrice) && normalizedPrice >= 0) {
                    course.price = normalizedPrice;
                }
            }

            const newPreviewUrl = previewVideoUrl || resourceUrl;
            if (newPreviewUrl) {
                if (!validateYouTubeUrl(newPreviewUrl)) {
                    return res.status(400).json({ message: 'Invalid preview YouTube URL' });
                }

                const parsed = parseYouTubeUrl(newPreviewUrl);
                if (!parsed) {
                    return res.status(400).json({ message: 'Invalid YouTube URL' });
                }

                course.previewVideoUrl = newPreviewUrl;
                course.resourceUrl = newPreviewUrl;
                course.youtubeVideoId = parsed.videoId;
                course.thumbnailUrl = parsed.thumbnailUrl;
            }

            await course.save();
            res.json(course);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

router.patch(
    '/:id/status',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
    [
        body('status', 'Invalid status').isIn(['approved', 'rejected', 'locked', 'hidden', 'pending']),
        body('adminComment').optional().isString()
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
            } else if (status === 'rejected') {
                course.isPublished = false;
            } else if (status === 'locked') {
                course.lockedAt = new Date();
            } else if (status === 'hidden') {
                course.isPublished = false;
                course.isHidden = true;
            }

            await course.save();
            res.json({ message: `Course ${status} successfully`, course });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   DELETE api/courses/:id
// @desc    Delete course (instructor/admin only)
// @access  Private
router.delete('/:id', authenticate, checkRole([UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isInstructorLike = req.user!.role === UserRole.INSTRUCTOR || req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;
        if (isInstructorLike && course.instructor.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
