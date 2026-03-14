// Enhanced Course Schema with Optimizations
import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from './User.js';

export interface ILesson {
    title: string;
    videoUrl: string;
    order: number;
    description?: string;
    duration?: number; // in minutes
    resources?: {
        title: string;
        url: string;
        type: 'pdf' | 'link' | 'code' | 'doc' | 'video';
        size?: number; // in bytes
        downloadCount?: number;
    }[];
    isLocked?: boolean;
    prerequisites?: string[]; // lesson IDs
    learningObjectives?: string[];
    quizIds?: Types.ObjectId[];
}

export interface IReview extends Document {
    userId: Types.ObjectId;
    userName: string;
    userRole: UserRole;
    rating: number; // 1-5 stars
    text: string;
    pros?: string[];
    cons?: string[];
    helpfulForLearning?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEnrollment extends Document {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'dropped';
    enrolledAt: Date;
    approvedAt?: Date;
    completedAt?: Date;
    progressPercentage?: number; // 0-100
    lastAccessedAt?: Date;
    completionCertificate?: Types.ObjectId; // reference to Certificate model
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentAmount?: number;
    paymentCurrency?: string;
    refundAmount?: number;
    refundReason?: string;
}

export interface IAnalytics extends Document {
    courseId: Types.ObjectId;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageCompletionTime: number; // in days
    averageRating: number;
    totalRevenue: number;
    monthlyEnrollments: number[];
    monthlyRevenue: number[];
    popularLessons: {
        lessonId: Types.ObjectId;
        viewCount: number;
        completionCount: number;
        averageTimeSpent: number; // in minutes
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ICourse extends Document {
    title: string;
    description: string;
    shortDescription?: string; // for course cards
    resourceUrl: string;
    previewVideoUrl?: string;
    thumbnailUrl?: string;
    lessons: ILesson[];
    quizzes: Types.ObjectId[];
    assignments: Types.ObjectId[];
    youtubeVideoId?: string;
    category?: Types.ObjectId;
    subcategory?: string;
    tags: string[];
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    gradeLevel: 'Grade 8' | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12' | 'General' | 'Higher Education' | 'Professional';
    duration?: string; // total course duration in hours
    price: number;
    currency?: string;
    discountPrice?: number;
    discountValidUntil?: Date;
    language: string;
    subtitles?: string[];
    instructor: Types.ObjectId;
    maxEnrollments?: number;
    currentEnrollments: number;
    rating: {
        average: number;
        count: number;
        distribution: { 1: number, 2: number, 3: number, 4: number, 5: number };
    };
    reviews: IReview[];
    status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'rejected';
    adminComment?: string;
    isPublished: boolean;
    isFeatured: boolean;
    difficulty: number; // 1-10 scale
    estimatedHours: number;
    certificateTemplate?: Types.ObjectId;
    prerequisites: string[]; // course IDs
    learningOutcomes: string[];
    targetAudience: string[];
    materials: {
        type: 'video' | 'text' | 'interactive' | 'downloadable';
        url: string;
        size?: number;
        format?: string;
    }[];
    seo: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
    };
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    archivedAt?: Date;
}

// Optimized Lesson Schema
const LessonSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    videoUrl: { type: String, required: true },
    order: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 1000 },
    duration: { type: Number, min: 0 }, // in minutes
    resources: [{
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'link', 'code', 'doc', 'video'], default: 'link' },
        size: { type: Number, min: 0 }, // in bytes
        downloadCount: { type: Number, default: 0, min: 0 }
    }],
    isLocked: { type: Boolean, default: false },
    prerequisites: [{ type: String }], // lesson IDs
    learningObjectives: [{ type: String, trim: true }],
    quizIds: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }]
}, { timestamps: true });

// Optimized Review Schema with compound index
const ReviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true, trim: true },
    userRole: { type: String, enum: Object.values(UserRole), required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    pros: [{ type: String, trim: true, maxlength: 500 }],
    cons: [{ type: String, trim: true, maxlength: 500 }],
    helpfulForLearning: { type: Boolean, default: false }
}, { timestamps: true });

// Optimized Enrollment Schema
const EnrollmentSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'completed', 'dropped'], 
        default: 'pending' 
    },
    enrolledAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    completedAt: { type: Date },
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessedAt: { type: Date },
    completionCertificate: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending' 
    },
    paymentAmount: { type: Number, min: 0 },
    paymentCurrency: { type: String, default: 'USD' },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String, trim: true }
}, { timestamps: true });

// Optimized Analytics Schema
const AnalyticsSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    totalEnrollments: { type: Number, default: 0, min: 0 },
    activeEnrollments: { type: Number, default: 0, min: 0 },
    completedEnrollments: { type: Number, default: 0, min: 0 },
    averageCompletionTime: { type: Number, default: 0, min: 0 }, // in days
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    monthlyEnrollments: [{ type: Number }],
    monthlyRevenue: [{ type: Number }],
    popularLessons: [{
        lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
        viewCount: { type: Number, default: 0, min: 0 },
        completionCount: { type: Number, default: 0, min: 0 },
        averageTimeSpent: { type: Number, default: 0, min: 0 } // in minutes
    }]
}, { timestamps: true });

// Enhanced Course Schema with indexes
const CourseSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    shortDescription: { type: String, trim: true, maxlength: 500 },
    resourceUrl: { type: String, required: true },
    previewVideoUrl: { type: String },
    thumbnailUrl: { type: String },
    lessons: [LessonSchema],
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
    youtubeVideoId: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    subcategory: { type: String, trim: true },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'], 
        default: 'beginner' 
    },
    gradeLevel: { 
        type: String, 
        enum: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'General', 'Higher Education', 'Professional'], 
        default: 'General' 
    },
    duration: { type: String }, // total course duration in hours
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    discountPrice: { type: Number, min: 0 },
    discountValidUntil: { type: Date },
    language: { type: String, default: 'English' },
    subtitles: [{ type: String }],
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    maxEnrollments: { type: Number, default: 0, min: 0 },
    currentEnrollments: { type: Number, default: 0, min: 0 },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0, min: 0 },
        distribution: { 
            1: { type: Number, default: 0, min: 0 },
            2: { type: Number, default: 0, min: 0 },
            3: { type: Number, default: 0, min: 0 },
            4: { type: Number, default: 0, min: 0 },
            5: { type: Number, default: 0, min: 0 }
        }
    },
    reviews: [ReviewSchema],
    status: { 
        type: String, 
        enum: ['draft', 'pending_review', 'approved', 'published', 'archived', 'rejected'], 
        default: 'draft' 
    },
    adminComment: { type: String, trim: true },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    difficulty: { type: Number, min: 1, max: 10, default: 5 },
    estimatedHours: { type: Number, min: 0 },
    certificateTemplate: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    prerequisites: [{ type: String }], // course IDs
    learningOutcomes: [{ type: String, trim: true, maxlength: 200 }],
    targetAudience: [{ type: String, trim: true, maxlength: 100 }],
    materials: [{
        type: { type: String, enum: ['video', 'text', 'interactive', 'downloadable'] },
        url: { type: String },
        size: { type: Number, min: 0 },
        format: { type: String }
    }],
    seo: {
        title: { type: String, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 500 },
        keywords: [{ type: String, trim: true, maxlength: 50 }],
        slug: { type: String, trim: true, lowercase: true, maxlength: 100 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
    archivedAt: { type: Date }
}, { timestamps: true });

// Compound indexes for performance
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
CourseSchema.index({ category: 1, level: 1, isPublished: 1, isFeatured: 1 });
CourseSchema.index({ instructor: 1, createdAt: -1 });
CourseSchema.index({ 'seo.slug': 1 }, { unique: true });

// Pre-save middleware for SEO slug generation
CourseSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.seo.slug) {
        this.seo.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
    }
    this.updatedAt = new Date();
    next();
});

export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
