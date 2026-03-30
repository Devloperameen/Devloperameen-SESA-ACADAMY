import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    watchCount: number;
    totalMinutesWatched: number;
    timeSpent: number;
    lastWatchedAt: Date;
    completed: boolean;
    completionPercentage: number;
    averageScore: number;
    completedLessons: number[];
    quizScores: {
        quizId: mongoose.Types.ObjectId;
        score: number;
        completedAt: Date;
    }[];
    strugglingAreas: string[];
    strengths: string[];
    tutoringSessions: {
        sessionId: string;
        date: Date;
        messageCount: number;
        summary: string;
        topicsDiscussed: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ProgressSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    watchCount: { type: Number, default: 0 },
    totalMinutesWatched: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    lastWatchedAt: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completedLessons: [{ type: Number, default: [] }],
    quizScores: [{
        quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
        score: { type: Number },
        completedAt: { type: Date, default: Date.now }
    }],
    strugglingAreas: [{ type: String }],
    strengths: [{ type: String }],
    tutoringSessions: [{
        sessionId: { type: String },
        date: { type: Date, default: Date.now },
        messageCount: { type: Number },
        summary: { type: String },
        topicsDiscussed: { type: String }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Unique index: one progress record per user per course
ProgressSchema.index({ user: 1, course: 1 }, { unique: true });
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

ProgressSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.model<IProgress>('Progress', ProgressSchema);
