import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './User.js';

export interface ILesson {
    title: string;
    videoUrl: string;
    order: number;
    description?: string;
    resources?: {
        title: string;
        url: string;
        type: 'pdf' | 'link' | 'code' | 'doc';
    }[];
}

export interface ICourse extends Document {
    title: string;
    description: string;
    resourceUrl: string;
    previewVideoUrl?: string;
    lessons: ILesson[];
    quizzes: mongoose.Types.ObjectId[];
    assignments: mongoose.Types.ObjectId[];
    youtubeVideoId?: string;
    thumbnailUrl?: string;
    lockedContent: string[];
    category?: mongoose.Types.ObjectId;
    instructor: mongoose.Types.ObjectId;
    students: {
        studentId: mongoose.Types.ObjectId;
        status: 'pending' | 'approved' | 'rejected';
        enrolledAt?: Date;
        approvedAt?: Date;
    }[];
    enrolledStudents: mongoose.Types.ObjectId[];
    pendingApprovals: mongoose.Types.ObjectId[];
    comments: {
        userId: mongoose.Types.ObjectId;
        userName: string;
        userRole: UserRole;
        text: string;
        createdAt: Date;
    }[];
    reviews: {
        userId: mongoose.Types.ObjectId;
        userName: string;
        userRole: UserRole;
        rating: number;
        text: string;
        createdAt: Date;
    }[];
    status: 'pending' | 'approved' | 'rejected' | 'locked' | 'hidden';
    adminComment?: string;
    isHidden: boolean;
    lockedAt?: Date;
    tags?: string[];
    level?: 'beginner' | 'intermediate' | 'advanced';
    gradeLevel?: 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12' | 'General';
    duration?: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LessonSchema = new Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    order: { type: Number, required: true },
    description: { type: String },
    resources: [{
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'link', 'code', 'doc'], default: 'link' }
    }]
});

const CourseSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    resourceUrl: { type: String, required: true },
    previewVideoUrl: { type: String },
    lessons: [LessonSchema],
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
    youtubeVideoId: { type: String },
    thumbnailUrl: { type: String },
    lockedContent: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        enrolledAt: { type: Date, default: Date.now },
        approvedAt: { type: Date }
    }],
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingApprovals: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        userRole: { type: String, enum: Object.values(UserRole), required: true },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
    reviews: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        userRole: { type: String, enum: Object.values(UserRole), required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'locked', 'hidden'], default: 'pending' },
    adminComment: { type: String },
    isHidden: { type: Boolean, default: false },
    lockedAt: { type: Date },
    tags: [{ type: String }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    gradeLevel: { type: String, enum: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'General'], default: 'General' },
    duration: { type: String },
    price: { type: Number, default: 0, min: 0 },
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
CourseSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.model<ICourse>('Course', CourseSchema);
