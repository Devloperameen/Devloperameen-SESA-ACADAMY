// Enhanced Models for Video Workflow, Payment System, and Screenshot Management
import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from './User.js';

// Video Upload Model
export interface IVideoUpload extends Document {
    title: string;
    description: string;
    instructorId: Types.ObjectId;
    courseId: Types.ObjectId;
    lessonId: Types.ObjectId;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number; // in seconds
    fileSize: number; // in bytes
    format: string; // mp4, mov, etc.
    resolution: string; // 1080p, 720p, etc.
    status: 'uploading' | 'processing' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'archived';
    adminReview: {
        reviewedBy?: Types.ObjectId;
        reviewedAt?: Date;
        decision?: 'approved' | 'rejected';
        feedback?: string;
        notes?: string;
    };
    metadata: {
        uploadDate: Date;
        processingTime?: number;
        quality: 'low' | 'medium' | 'high' | 'ultra';
        hasSubtitles: boolean;
        language: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Lesson Access Control Model
export interface ILessonAccess extends Document {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    lessonId: Types.ObjectId;
    accessType: 'free' | 'paid' | 'granted';
    paymentInfo: {
        paymentId?: Types.ObjectId;
        amount: number;
        currency: string;
        paidAt?: Date;
        paymentMethod: 'stripe' | 'paypal' | 'manual';
        transactionId?: string;
        status: 'pending' | 'completed' | 'failed' | 'refunded';
    };
    progress: {
        watchedDuration: number; // seconds watched
        totalDuration: number; // total lesson duration
        percentage: number; // 0-100
        completed: boolean;
        completedAt?: Date;
        lastAccessedAt: Date;
    };
    screenshot: {
        url: string;
        uploadedAt: Date;
        approved: boolean;
        adminReview?: {
            reviewedBy: Types.ObjectId;
            reviewedAt: Date;
            approved: boolean;
            feedback?: string;
        };
    }[];
    createdAt: Date;
    updatedAt: Date;
}

// Payment Transaction Model
export interface IPayment extends Document {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    lessonId: Types.ObjectId;
    amount: number;
    currency: string;
    method: 'stripe' | 'paypal' | 'manual';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentIntentId?: string; // Stripe specific
    refundId?: string;
    metadata: {
        ipAddress: string;
        userAgent: string;
        device: string;
        browser: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Screenshot Model for Admin Preview
export interface IScreenshot extends Document {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    lessonId: Types.ObjectId;
    imageUrl: string;
    thumbnailUrl?: string;
    fileSize: number;
    dimensions: {
        width: number;
        height: number;
    };
    uploadContext: {
        timestamp: number; // video timestamp where screenshot was taken
        deviceInfo: string;
        browser: string;
    };
    adminReview: {
        reviewedBy?: Types.ObjectId;
        reviewedAt?: Date;
        approved: boolean;
        feedback?: string;
        flagged: boolean;
        flagReason?: string;
    };
    status: 'uploaded' | 'reviewed' | 'approved' | 'flagged' | 'deleted';
    createdAt: Date;
    updatedAt: Date;
}

// Course Progress Model
export interface ICourseProgress extends Document {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    totalLessons: number;
    completedLessons: number;
    lockedLessons: number;
    unlockedLessons: number;
    totalWatchTime: number; // in seconds
    averageCompletionRate: number; // percentage
    lastAccessedAt: Date;
    completedAt?: Date;
    certificate: {
        issued: boolean;
        issuedAt?: Date;
        certificateUrl?: string;
        score?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Video Upload Schema
const VideoUploadSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    duration: { type: Number, required: true, min: 0 },
    fileSize: { type: Number, required: true, min: 0 },
    format: { type: String, required: true, enum: ['mp4', 'mov', 'avi', 'mkv'] },
    resolution: { type: String, required: true, enum: ['360p', '480p', '720p', '1080p', '4K'] },
    status: { 
        type: String, 
        enum: ['uploading', 'processing', 'pending_review', 'approved', 'rejected', 'published', 'archived'], 
        default: 'uploading' 
    },
    adminReview: {
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        decision: { type: String, enum: ['approved', 'rejected'] },
        feedback: { type: String, trim: true, maxlength: 1000 },
        notes: { type: String, trim: true, maxlength: 500 }
    },
    metadata: {
        uploadDate: { type: Date, default: Date.now },
        processingTime: { type: Number, min: 0 },
        quality: { type: String, enum: ['low', 'medium', 'high', 'ultra'], default: 'medium' },
        hasSubtitles: { type: Boolean, default: false },
        language: { type: String, default: 'en' }
    }
}, { timestamps: true });

// Lesson Access Schema
const LessonAccessSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    accessType: { 
        type: String, 
        enum: ['free', 'paid', 'granted'], 
        default: 'free' 
    },
    paymentInfo: {
        paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' },
        paidAt: { type: Date },
        paymentMethod: { type: String, enum: ['stripe', 'paypal', 'manual'], default: 'stripe' },
        transactionId: { type: String },
        status: { 
            type: String, 
            enum: ['pending', 'completed', 'failed', 'refunded'], 
            default: 'pending' 
        }
    },
    progress: {
        watchedDuration: { type: Number, default: 0, min: 0 },
        totalDuration: { type: Number, required: true, min: 0 },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        lastAccessedAt: { type: Date, default: Date.now }
    },
    screenshot: [{
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        approved: { type: Boolean, default: false },
        adminReview: {
            reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: { type: Date },
            approved: { type: Boolean },
            feedback: { type: String, trim: true, maxlength: 500 }
        }
    }]
}, { timestamps: true });

// Payment Schema
const PaymentSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    method: { type: String, enum: ['stripe', 'paypal', 'manual'], default: 'stripe' },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'], 
        default: 'pending' 
    },
    transactionId: { type: String },
    paymentIntentId: { type: String },
    refundId: { type: String },
    metadata: {
        ipAddress: { type: String },
        userAgent: { type: String },
        device: { type: String },
        browser: { type: String }
    }
}, { timestamps: true });

// Screenshot Schema
const ScreenshotSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    fileSize: { type: Number, required: true, min: 0 },
    dimensions: {
        width: { type: Number, required: true, min: 1 },
        height: { type: Number, required: true, min: 1 }
    },
    uploadContext: {
        timestamp: { type: Number, required: true, min: 0 },
        deviceInfo: { type: String },
        browser: { type: String }
    },
    adminReview: {
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        approved: { type: Boolean, default: false },
        feedback: { type: String, trim: true, maxlength: 500 },
        flagged: { type: Boolean, default: false },
        flagReason: { type: String, trim: true, maxlength: 200 }
    },
    status: { 
        type: String, 
        enum: ['uploaded', 'reviewed', 'approved', 'flagged', 'deleted'], 
        default: 'uploaded' 
    }
}, { timestamps: true });

// Course Progress Schema
const CourseProgressSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    totalLessons: { type: Number, required: true, min: 0 },
    completedLessons: { type: Number, default: 0, min: 0 },
    lockedLessons: { type: Number, default: 0, min: 0 },
    unlockedLessons: { type: Number, default: 0, min: 0 },
    totalWatchTime: { type: Number, default: 0, min: 0 },
    averageCompletionRate: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    certificate: {
        issued: { type: Boolean, default: false },
        issuedAt: { type: Date },
        certificateUrl: { type: String },
        score: { type: Number, min: 0, max: 100 }
    }
}, { timestamps: true });

// Compound indexes for performance
VideoUploadSchema.index({ instructorId: 1, status: 1 });
VideoUploadSchema.index({ courseId: 1, lessonId: 1 });
VideoUploadSchema.index({ status: 1, createdAt: -1 });

LessonAccessSchema.index({ studentId: 1, courseId: 1 });
LessonAccessSchema.index({ studentId: 1, lessonId: 1 });
LessonAccessSchema.index({ 'paymentInfo.status': 1 });

PaymentSchema.index({ studentId: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ paymentIntentId: 1 });

ScreenshotSchema.index({ studentId: 1, status: 1 });
ScreenshotSchema.index({ courseId: 1, lessonId: 1 });
ScreenshotSchema.index({ 'adminReview.approved': 1 });

CourseProgressSchema.index({ studentId: 1, courseId: 1 });
CourseProgressSchema.index({ studentId: 1, completedAt: -1 });

// Pre-save middleware for timestamps
VideoUploadSchema.pre('save', function() {
    this.updatedAt = new Date();
});

LessonAccessSchema.pre('save', function() {
    this.updatedAt = new Date();
    if (this.progress.completed && !this.progress.completedAt) {
        this.progress.completedAt = new Date();
    }
});

export const VideoUpload = mongoose.models.VideoUpload || mongoose.model<IVideoUpload>('VideoUpload', VideoUploadSchema);
export const LessonAccess = mongoose.models.LessonAccess || mongoose.model<ILessonAccess>('LessonAccess', LessonAccessSchema);
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export const Screenshot = mongoose.models.Screenshot || mongoose.model<IScreenshot>('Screenshot', ScreenshotSchema);
export const CourseProgress = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
