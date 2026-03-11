import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Course from '../models/Course.js';
import User, { UserRole } from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import { notifyUser } from '../utils/socket.js';

/**
 * @route   GET /api/admin/courses/pending-review
 * @desc    Get all courses pending admin review
 * @access  Private (Admin Only)
 */
export const getPendingReviewCourses = async (req: AuthRequest, res: Response) => {
    try {
        const pendingCourses = await Course.find({ status: 'pending' })
            .populate('instructor', 'name email')
            .populate('category', 'name icon')
            .sort({ createdAt: -1 });

        res.json(pendingCourses);
    } catch (error) {
        console.error('Get pending review courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/admin/courses/:courseId/preview
 * @desc    Preview course details for admin review
 * @access  Private (Admin Only)
 */
export const previewCourseForReview = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
            .populate('instructor', 'name email role')
            .populate('category', 'name icon')
            .populate('students.studentId', 'name email');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get instructor stats
        const instructorCourses = await Course.countDocuments({ instructor: course.instructor._id });
        const instructorPublishedCourses = await Course.countDocuments({ 
            instructor: course.instructor._id, 
            status: 'approved' 
        });

        res.json({
            course,
            instructorStats: {
                totalCourses: instructorCourses,
                publishedCourses: instructorPublishedCourses,
                approvalRate: instructorPublishedCourses > 0 ? (instructorPublishedCourses / instructorCourses * 100).toFixed(1) : '0'
            }
        });
    } catch (error) {
        console.error('Preview course for review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   PUT /api/admin/courses/:courseId/review
 * @desc    Admin review decision (accept/reject)
 * @access  Private (Admin Only)
 */
export const reviewCourseDecision = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { decision, adminComment } = req.body;

        if (!['accept', 'reject'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision. Use "accept" or "reject".' });
        }

        const course = await Course.findById(courseId)
            .populate('instructor', 'name email');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'pending') {
            return res.status(400).json({ message: 'Course is not in pending review status' });
        }

        if (decision === 'accept') {
            course.status = 'approved';
            course.isPublished = true;
            course.isHidden = false;
            course.adminComment = adminComment || 'Course approved by admin';

            // Notify instructor
            notifyUser(
                course.instructor._id.toString(),
                `Your course "${course.title}" has been approved and published!`,
                { courseId: course._id, status: 'approved' }
            );

            res.json({
                message: 'Course approved and published successfully',
                course
            });
        } else {
            course.status = 'rejected';
            course.isPublished = false;
            course.isHidden = true;
            course.adminComment = adminComment || 'Course rejected by admin';

            // Notify instructor
            notifyUser(
                course.instructor._id.toString(),
                `Your course "${course.title}" has been rejected. Please review admin comments.`,
                { courseId: course._id, status: 'rejected', adminComment: course.adminComment }
            );

            res.json({
                message: 'Course rejected successfully',
                course
            });
        }

        await course.save();
    } catch (error) {
        console.error('Review course decision error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/courses/:courseId/free-preview
 * @desc    Get free preview content (Part 1) for any user
 * @access  Public
 */
export const getFreePreview = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
            .select('title description thumbnailUrl previewVideoUrl lessons price instructor status isPublished')
            .populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!course.isPublished || course.status !== 'approved') {
            return res.status(403).json({ message: 'This course is not available for preview' });
        }

        // Get only Part 1 (first lesson) for free preview
        const freePreviewLesson = course.lessons.length > 0 ? course.lessons[0] : null;

        res.json({
            course: {
                _id: course._id,
                title: course.title,
                description: course.description,
                thumbnailUrl: course.thumbnailUrl,
                instructor: course.instructor,
                price: course.price,
                status: course.status
            },
            freePreview: {
                lesson: freePreviewLesson,
                message: freePreviewLesson 
                    ? 'Part 1 available for free preview. Enroll to access full course.' 
                    : 'No preview content available'
            }
        });
    } catch (error) {
        console.error('Get free preview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/courses/:courseId/full-content
 * @desc    Get full course content (requires enrollment and payment verification)
 * @access  Private (Enrolled & Verified Students Only)
 */
export const getFullCourseContent = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const course = await Course.findById(courseId)
            .populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is admin or instructor
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
        const isInstructor = course.instructor._id.toString() === userId;

        if (isAdmin || isInstructor) {
            return res.json({
                course,
                accessLevel: isAdmin ? 'admin' : 'instructor',
                message: 'Full access granted'
            });
        }

        // Check enrollment status
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
            status: 'approved'
        });

        if (!enrollment) {
            return res.status(403).json({ 
                message: 'Enrollment required to access full content',
                suggestion: 'Request enrollment and wait for admin verification'
            });
        }

        // Check payment verification
        const payment = await Payment.findOne({
            user: userId,
            course: courseId,
            status: 'completed'
        });

        if (!payment) {
            return res.status(403).json({ 
                message: 'Payment verification required',
                suggestion: 'Complete payment or wait for admin verification'
            });
        }

        res.json({
            course,
            accessLevel: 'student',
            enrollment: {
                status: enrollment.status,
                requestedAt: enrollment.requestedAt,
                updatedAt: enrollment.updatedAt
            },
            payment: {
                status: payment.status,
                amount: payment.amount,
                paymentDate: payment.paymentDate
            }
        });
    } catch (error) {
        console.error('Get full course content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/admin/enrollments/verification
 * @desc    Get all enrollments requiring payment verification
 * @access  Private (Admin Only)
 */
export const getEnrollmentsForVerification = async (req: AuthRequest, res: Response) => {
    try {
        // Get enrollments with pending status
        const pendingEnrollments = await Enrollment.find({ status: 'pending' })
            .populate('user', 'name email')
            .populate('course', 'title price instructor')
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name' }
            })
            .sort({ requestedAt: -1 });

        // Get payments for these enrollments
        const enrollmentsWithPayments = await Promise.all(
            pendingEnrollments.map(async (enrollment) => {
                const payment = await Payment.findOne({
                    user: enrollment.user._id,
                    course: enrollment.course._id
                });

                return {
                    enrollment,
                    payment,
                    requiresVerification: payment ? payment.status === 'pending' : true
                };
            })
        );

        res.json(enrollmentsWithPayments);
    } catch (error) {
        console.error('Get enrollments for verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   PUT /api/admin/enrollments/:enrollmentId/verify
 * @desc    Verify enrollment and grant full access
 * @access  Private (Admin Only)
 */
export const verifyEnrollmentAndGrantAccess = async (req: AuthRequest, res: Response) => {
    try {
        const { enrollmentId } = req.params;
        const { adminComment } = req.body;

        const enrollment = await Enrollment.findById(enrollmentId)
            .populate('user', 'name email')
            .populate('course', 'title');

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (enrollment.status !== 'pending') {
            return res.status(400).json({ message: 'Enrollment is not in pending status' });
        }

        // Update payment status to completed
        await Payment.updateOne(
            { user: enrollment.user._id, course: enrollment.course._id },
            { status: 'completed', updatedAt: new Date() }
        );

        // Update enrollment status
        enrollment.status = 'approved';
        enrollment.adminComment = adminComment || 'Payment verified and access granted by admin';
        enrollment.updatedAt = new Date();
        await enrollment.save();

        // Update course enrollment
        const course = await Course.findById(enrollment.course._id);
        if (course) {
            const studentEntry = course.students.find(
                (entry) => entry.studentId.toString() === enrollment.user._id.toString()
            );

            if (studentEntry) {
                studentEntry.status = 'approved';
                studentEntry.approvedAt = new Date();
            } else {
                course.students.push({
                    studentId: enrollment.user._id,
                    status: 'approved',
                    enrolledAt: enrollment.requestedAt,
                    approvedAt: new Date()
                });
            }

            // Add to enrolledStudents if not already there
            if (!course.enrolledStudents.includes(enrollment.user._id)) {
                course.enrolledStudents.push(enrollment.user._id);
            }

            // Remove from pendingApprovals
            course.pendingApprovals = course.pendingApprovals.filter(
                (id) => id.toString() !== enrollment.user._id.toString()
            );

            await course.save();
        }

        // Notify student
        notifyUser(
            enrollment.user._id.toString(),
            `Your enrollment for "${(enrollment.course as any).title}" has been verified! You now have full access.`,
            { courseId: enrollment.course._id, status: 'approved' }
        );

        res.json({
            message: 'Enrollment verified and full access granted',
            enrollment
        });
    } catch (error) {
        console.error('Verify enrollment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/teacher/courses/my-pending
 * @desc    Get teacher's courses pending admin review
 * @access  Private (Teacher Only)
 */
export const getTeacherPendingCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const pendingCourses = await Course.find({
            instructor: userId,
            status: 'pending'
        })
            .populate('category', 'name icon')
            .sort({ createdAt: -1 });

        res.json(pendingCourses);
    } catch (error) {
        console.error('Get teacher pending courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/teacher/courses/my-published
 * @desc    Get teacher's published courses
 * @access  Private (Teacher Only)
 */
export const getTeacherPublishedCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const publishedCourses = await Course.find({
            instructor: userId,
            status: 'approved',
            isPublished: true
        })
            .populate('category', 'name icon')
            .populate('enrolledStudents', 'name')
            .sort({ createdAt: -1 });

        res.json(publishedCourses);
    } catch (error) {
        console.error('Get teacher published courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};