// Video Workflow Routes with Production-Ready Implementation
import { Router } from 'express';
import { 
    uploadVideo, 
    getPendingVideos, 
    reviewVideo, 
    getAccessibleLessons, 
    processPayment, 
    uploadScreenshot, 
    getScreenshotsForReview, 
    reviewScreenshot, 
    serveUpload 
} from '../controllers/videoWorkflowController.js';
import { authenticate } from '../middleware/authEnhanced.js';
import { body, param } from 'express-validator';

const router = Router();

// Validation middleware
const videoUploadValidation = [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description must be between 1 and 2000 characters'),
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('lessonId').isMongoId().withMessage('Valid lesson ID is required'),
    body('language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja']).withMessage('Invalid language code')
];

const videoReviewValidation = [
    param('videoId').isMongoId().withMessage('Valid video ID is required'),
    body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be either approved or rejected'),
    body('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

const paymentValidation = [
    param('lessonId').isMongoId().withMessage('Valid lesson ID is required'),
    body('paymentMethod').isIn(['stripe', 'paypal', 'manual']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
];

const screenshotUploadValidation = [
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('lessonId').isMongoId().withMessage('Valid lesson ID is required'),
    body('timestamp').optional().isInt({ min: 0 }).withMessage('Timestamp must be a non-negative integer'),
    body('width').optional().isInt({ min: 1 }).withMessage('Width must be a positive integer'),
    body('height').optional().isInt({ min: 1 }).withMessage('Height must be a positive integer')
];

const screenshotReviewValidation = [
    param('screenshotId').isMongoId().withMessage('Valid screenshot ID is required'),
    body('approved').isBoolean().withMessage('Approved must be a boolean'),
    body('feedback').optional().trim().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters'),
    body('flagged').optional().isBoolean().withMessage('Flagged must be a boolean'),
    body('flagReason').optional().trim().isLength({ max: 200 }).withMessage('Flag reason must be less than 200 characters')
];

// Video upload routes
router.post('/videos/upload', authenticate, videoUploadValidation, uploadVideo);
router.get('/videos/pending', authenticate, getPendingVideos);
router.put('/videos/:videoId/review', authenticate, videoReviewValidation, reviewVideo);

// Lesson access routes
router.get('/courses/:courseId/lessons', authenticate, getAccessibleLessons);
router.post('/lessons/:lessonId/payment', authenticate, paymentValidation, processPayment);

// Screenshot routes
router.post('/screenshots/upload', authenticate, screenshotUploadValidation, uploadScreenshot);
router.get('/screenshots/review', authenticate, getScreenshotsForReview);
router.put('/screenshots/:screenshotId/review', authenticate, screenshotReviewValidation, reviewScreenshot);

// File serving route
router.get('/uploads/:type/:filename', serveUpload);

export default router;
