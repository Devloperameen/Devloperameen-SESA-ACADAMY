import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    assessmentType: 'quiz' | 'assignment' | 'midterm' | 'final';
    quizId?: mongoose.Types.ObjectId;
    assignmentId?: mongoose.Types.ObjectId;
    answers?: any[]; // For quizzes
    fileUrl?: string; // For assignments
    textResponse?: string; // For assignments
    score?: number;
    feedback?: string;
    status: 'pending' | 'graded';
    gradedBy?: mongoose.Types.ObjectId;
    submittedAt: Date;
    gradedAt?: Date;
}

const SubmissionSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    assessmentType: { type: String, enum: ['quiz', 'assignment', 'midterm', 'final'], required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    answers: [{ type: Schema.Types.Mixed }],
    fileUrl: { type: String },
    textResponse: { type: String },
    score: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ['pending', 'graded'], default: 'pending' },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date }
});

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);
