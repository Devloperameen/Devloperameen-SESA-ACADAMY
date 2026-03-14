import mongoose, { Schema, Document } from 'mongoose';

export enum EvaluationRating {
    STRONGLY_AGREE = 5,
    AGREE = 4,
    NEUTRAL = 3,
    DISAGREE = 2,
    STRONGLY_DISAGREE = 1
}

export interface IEvaluation extends Document {
    student: mongoose.Types.ObjectId;
    instructor: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    ratings: {
        clarity: EvaluationRating;
        engagement: EvaluationRating;
        support: EvaluationRating;
        knowledge: EvaluationRating;
        overall: EvaluationRating;
    };
    feedback?: string;
    createdAt: Date;
}

const EvaluationSchema: Schema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    ratings: {
        clarity: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
        engagement: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
        support: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
        knowledge: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
        overall: { type: Number, enum: [1, 2, 3, 4, 5], required: true }
    },
    feedback: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// One evaluation per student per instructor per course
EvaluationSchema.index({ student: 1, instructor: 1, course: 1 }, { unique: true });

export default mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
