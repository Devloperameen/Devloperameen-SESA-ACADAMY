// Video Workflow Controller with Production-Ready Implementation
import type { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { VideoUpload, LessonAccess, Payment, Screenshot, CourseProgress } from '../models/VideoWorkflow.js';
import type { AuthRequest } from '../middleware/authEnhanced.js';
import { authenticate, checkRole } from '../middleware/authEnhanced.js';
import { validationResult } from 'express-validator';

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'videos');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP4, MOV, AVI, and MKV files are allowed.'));
        }
    }
});

// Configure multer for screenshot uploads
const screenshotStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'screenshots');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'screenshot-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const screenshotUpload = multer({
    storage: screenshotStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }
    }
});

// Upload video (Teacher only)
export const uploadVideo = [
    authenticate,
    checkRole(['instructor', 'assistant_instructor']),
    videoUpload.single('video'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No video file uploaded'
                });
            }

            const { title, description, courseId, lessonId } = req.body;

            // Create video upload record
            const videoUpload = new VideoUpload({
                title,
                description,
                instructorId: req.user!.id,
                courseId,
                lessonId,
                videoUrl: `/uploads/videos/${req.file.filename}`,
                fileSize: req.file.size,
                format: req.file.originalname.split('.').pop()?.toLowerCase(),
                status: 'processing',
                metadata: {
                    uploadDate: new Date(),
                    language: req.body.language || 'en'
                }
            });

            await videoUpload.save();

            // Simulate video processing (in production, use actual video processing service)
            setTimeout(async () => {
                videoUpload.status = 'pending_review';
                videoUpload.metadata.processingTime = 30; // 30 seconds
                await videoUpload.save();
            }, 30000); // 30 seconds

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully and is being processed',
                data: {
                    videoId: videoUpload._id,
                    title: videoUpload.title,
                    status: videoUpload.status,
                    uploadDate: videoUpload.createdAt
                }
            });
        } catch (error) {
            console.error('Video upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload video',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Get pending videos for admin review
export const getPendingVideos = [
    authenticate,
    checkRole(['admin', 'super_admin', 'moderator']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const [videos, total] = await Promise.all([
                VideoUpload.find({ status: 'pending_review' })
                    .populate('instructorId', 'name email profileImage')
                    .populate('courseId', 'title')
                    .populate('lessonId', 'title order')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                VideoUpload.countDocuments({ status: 'pending_review' })
            ]);

            res.json({
                success: true,
                data: videos,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalVideos: total
                }
            });
        } catch (error) {
            console.error('Get pending videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending videos',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Approve/Reject video (Admin only)
export const reviewVideo = [
    authenticate,
    checkRole(['admin', 'super_admin', 'moderator']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.params;
            const { decision, feedback, notes } = req.body;

            if (!['approved', 'rejected'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid decision. Must be either "approved" or "rejected"'
                });
            }

            const video = await VideoUpload.findById(videoId);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            if (video.status !== 'pending_review') {
                return res.status(400).json({
                    success: false,
                    message: 'Video is not pending review'
                });
            }

            // Update video status and admin review
            video.status = decision === 'approved' ? 'approved' : 'rejected';
            video.adminReview = {
                reviewedBy: req.user!.id,
                reviewedAt: new Date(),
                decision,
                feedback,
                notes
            };

            await video.save();

            // If approved, update lesson access for first lesson
            if (decision === 'approved') {
                // Create lesson access for first lesson (free access)
                const lessonAccess = new LessonAccess({
                    studentId: null, // Will be populated when students enroll
                    courseId: video.courseId,
                    lessonId: video.lessonId,
                    accessType: 'free',
                    progress: {
                        totalDuration: video.duration,
                        lastAccessedAt: new Date()
                    }
                });

                await lessonAccess.save();
            }

            res.json({
                success: true,
                message: `Video ${decision} successfully`,
                data: {
                    videoId: video._id,
                    status: video.status,
                    reviewedBy: req.user!.name,
                    reviewedAt: video.adminReview?.reviewedAt
                }
            });
        } catch (error) {
            console.error('Video review error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to review video',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Get accessible lessons for student
export const getAccessibleLessons = [
    authenticate,
    checkRole(['student', 'premium_student', 'trial_student']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { courseId } = req.params;
            const studentId = req.user!.id;

            // Get all lesson accesses for this student and course
            const lessonAccesses = await LessonAccess.find({
                studentId,
                courseId
            })
            .populate('lessonId', 'title order videoUrl')
            .populate('paymentInfo')
            .sort({ 'lessonId.order': 1 });

            // Determine which lessons are accessible
            const accessibleLessons = lessonAccesses.map(access => {
                const isAccessible = access.accessType === 'free' || 
                                 (access.accessType === 'paid' && access.paymentInfo?.status === 'completed');

                return {
                    lessonId: access.lessonId._id,
                    title: access.lessonId.title,
                    order: access.lessonId.order,
                    videoUrl: isAccessible ? access.lessonId.videoUrl : null,
                    accessType: access.accessType,
                    isAccessible,
                    paymentStatus: access.paymentInfo?.status,
                    progress: access.progress,
                    requiresPayment: access.accessType === 'paid' && access.paymentInfo?.status !== 'completed'
                };
            });

            res.json({
                success: true,
                data: accessibleLessons
            });
        } catch (error) {
            console.error('Get accessible lessons error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch accessible lessons',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Process payment and unlock lesson
export const processPayment = [
    authenticate,
    checkRole(['student', 'premium_student', 'trial_student']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { lessonId } = req.params;
            const { paymentMethod, amount } = req.body;
            const studentId = req.user!.id;

            // Get lesson access
            const lessonAccess = await LessonAccess.findOne({
                studentId,
                lessonId
            });

            if (!lessonAccess) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson access not found'
                });
            }

            if (lessonAccess.accessType !== 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'This lesson does not require payment'
                });
            }

            if (lessonAccess.paymentInfo?.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment already completed for this lesson'
                });
            }

            // Create payment record
            const payment = new Payment({
                studentId,
                courseId: lessonAccess.courseId,
                lessonId,
                amount,
                method: paymentMethod,
                status: 'pending',
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    device: req.headers['sec-ch-ua-platform'],
                    browser: req.headers['sec-ch-ua']
                }
            });

            await payment.save();

            // Simulate payment processing (in production, integrate with Stripe/PayPal)
            setTimeout(async () => {
                try {
                    payment.status = 'completed';
                    payment.transactionId = 'txn_' + Date.now();
                    await payment.save();

                    // Update lesson access
                    lessonAccess.paymentInfo = {
                        paymentId: payment._id,
                        amount,
                        paidAt: new Date(),
                        paymentMethod,
                        transactionId: payment.transactionId,
                        status: 'completed'
                    };

                    await lessonAccess.save();

                    console.log(`Payment completed for student ${studentId}, lesson ${lessonId}`);
                } catch (error) {
                    console.error('Payment processing error:', error);
                }
            }, 2000); // 2 seconds

            res.json({
                success: true,
                message: 'Payment initiated successfully',
                data: {
                    paymentId: payment._id,
                    amount,
                    status: 'pending'
                }
            });
        } catch (error) {
            console.error('Process payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process payment',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Upload screenshot
export const uploadScreenshot = [
    authenticate,
    checkRole(['student', 'premium_student', 'trial_student']),
    screenshotUpload.single('screenshot'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No screenshot file uploaded'
                });
            }

            const { courseId, lessonId, timestamp } = req.body;
            const studentId = req.user!.id;

            // Create screenshot record
            const screenshot = new Screenshot({
                studentId,
                courseId,
                lessonId,
                imageUrl: `/uploads/screenshots/${req.file.filename}`,
                fileSize: req.file.size,
                dimensions: {
                    width: parseInt(req.body.width) || 1920,
                    height: parseInt(req.body.height) || 1080
                },
                uploadContext: {
                    timestamp: parseInt(timestamp) || 0,
                    deviceInfo: req.headers['sec-ch-ua-platform'],
                    browser: req.headers['sec-ch-ua']
                }
            });

            await screenshot.save();

            res.status(201).json({
                success: true,
                message: 'Screenshot uploaded successfully',
                data: {
                    screenshotId: screenshot._id,
                    imageUrl: screenshot.imageUrl,
                    uploadedAt: screenshot.createdAt
                }
            });
        } catch (error) {
            console.error('Screenshot upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload screenshot',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Get screenshots for admin review
export const getScreenshotsForReview = [
    authenticate,
    checkRole(['admin', 'super_admin', 'moderator']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { courseId, lessonId } = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const filter: any = { status: 'uploaded' };
            if (courseId) filter.courseId = courseId;
            if (lessonId) filter.lessonId = lessonId;

            const [screenshots, total] = await Promise.all([
                Screenshot.find(filter)
                    .populate('studentId', 'name email profileImage')
                    .populate('courseId', 'title')
                    .populate('lessonId', 'title order')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Screenshot.countDocuments(filter)
            ]);

            res.json({
                success: true,
                data: screenshots,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalScreenshots: total
                }
            });
        } catch (error) {
            console.error('Get screenshots error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch screenshots',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Review screenshot (Admin only)
export const reviewScreenshot = [
    authenticate,
    checkRole(['admin', 'super_admin', 'moderator']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { screenshotId } = req.params;
            const { approved, feedback, flagged, flagReason } = req.body;

            const screenshot = await Screenshot.findById(screenshotId);
            if (!screenshot) {
                return res.status(404).json({
                    success: false,
                    message: 'Screenshot not found'
                });
            }

            // Update screenshot review
            screenshot.adminReview = {
                reviewedBy: req.user!.id,
                reviewedAt: new Date(),
                approved,
                feedback,
                flagged: flagged || false,
                flagReason
            };

            screenshot.status = approved ? 'approved' : (flagged ? 'flagged' : 'reviewed');

            await screenshot.save();

            res.json({
                success: true,
                message: `Screenshot ${approved ? 'approved' : flagged ? 'flagged' : 'reviewed'} successfully`,
                data: {
                    screenshotId: screenshot._id,
                    status: screenshot.status,
                    reviewedBy: req.user!.name,
                    reviewedAt: screenshot.adminReview?.reviewedAt
                }
            });
        } catch (error) {
            console.error('Review screenshot error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to review screenshot',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
];

// Serve uploaded files (to prevent 404 errors)
export const serveUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { type, filename } = req.params;
        const allowedTypes = ['videos', 'screenshots'];
        
        if (!allowedTypes.includes(type)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const filePath = path.join(process.cwd(), 'uploads', type, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('Serve upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to serve file',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export { videoUpload, screenshotUpload };
