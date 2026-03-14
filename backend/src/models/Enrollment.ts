import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    paymentMethod: 'bank_transfer' | 'cash' | 'chapa' | 'telebirr' | 'cbe_birr' | 'stripe' | 'paypal';
    transactionId?: string;
    paymentProofUrl?: string;
    adminComment?: string;
    requestedAt: Date;
    updatedAt: Date;
}

const EnrollmentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'chapa', 'telebirr', 'cbe_birr', 'stripe', 'paypal'],
        default: 'bank_transfer'
    },
    transactionId: { type: String },
    paymentProofUrl: { type: String },
    adminComment: { type: String },
    requestedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Unique compound index to prevent duplicate requests
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Update updatedAt on change
EnrollmentSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
