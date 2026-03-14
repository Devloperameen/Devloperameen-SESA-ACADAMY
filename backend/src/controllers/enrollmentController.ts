import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { notifyUser } from '../utils/socket.js';

/**
 * @route   POST /api/enrollments/request/:courseId
 * @desc    Request access to a course
 * @access  Private (Authenticated User)
 */
export const requestAccess = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { paymentProofUrl, paymentMethod, transactionId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // 1. Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // 2. Clear any existing rejected request or check for existing ones
        // The unique index handles duplicates, but we might want to allow re-requesting if rejected
        let enrollment = await Enrollment.findOne({
            user: new mongoose.Types.ObjectId(userId),
            course: new mongoose.Types.ObjectId(courseId as string)
        });

        if (enrollment) {
            if (enrollment.status === 'approved') {
                return res.status(400).json({ message: 'You already have access to this course' });
            }
            if (enrollment.status === 'pending') {
                return res.status(400).json({ message: 'Your request is already pending approval' });
            }
            // If rejected, allow re-requesting (updating status to pending)
            enrollment.status = 'pending';
            enrollment.paymentProofUrl = paymentProofUrl;
            enrollment.paymentMethod = paymentMethod || 'bank_transfer';
            enrollment.transactionId = transactionId;
            enrollment.requestedAt = new Date();
            await enrollment.save();
        } else {
            // 3. Create new enrollment request
            enrollment = new Enrollment({
                user: new mongoose.Types.ObjectId(userId),
                course: new mongoose.Types.ObjectId(courseId as string),
                paymentProofUrl,
                paymentMethod: paymentMethod || 'bank_transfer',
                transactionId,
                status: 'pending'
            });
            await enrollment.save();
        }

        res.status(201).json({
            message: 'Access request submitted successfully. Waiting for admin approval.',
            enrollment
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already requested access to this course' });
        }
        console.error('Request Access Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @route   GET /api/admin/enrollments/pending
 * @desc    List all pending enrollment requests
 * @access  Private (Admin Only)
 */
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const pendingRequests = await Enrollment.find({ status: 'pending' })
            .populate('user', 'name email')
            .populate('course', 'title description')
            .sort({ requestedAt: 1 });

        res.json(pendingRequests);
    } catch (error) {
        console.error('Get Pending Requests Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @route   PUT /api/admin/enrollments/:enrollmentId
 * @desc    Approve or Reject an enrollment request
 * @access  Private (Admin Only)
 */
export const updateEnrollmentStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { enrollmentId } = req.params;
        const { status, adminComment } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use "approved" or "rejected".' });
        }

        const enrollment = await Enrollment.findById(enrollmentId).populate('course', 'title');
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment request not found' });
        }

        enrollment.status = status;
        if (adminComment) {
            enrollment.adminComment = adminComment;
        }
        await enrollment.save();

        // If approved, notify the user in real-time
        if (status === 'approved') {
            const courseTitle = (enrollment.course as any).title;
            notifyUser(
                enrollment.user.toString(),
                `Your access to "${courseTitle}" has been approved!`,
                { courseId: enrollment.course._id, status: 'approved' }
            );
        }

        res.json({
            message: `Enrollment status updated to ${status}`,
            enrollment
        });
    } catch (error) {
        console.error('Update Enrollment Status Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
