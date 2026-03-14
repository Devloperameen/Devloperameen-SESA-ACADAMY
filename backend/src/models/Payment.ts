import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'chapa' | 'telebirr' | 'cbe_birr';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    receiptImage?: string; // For bank transfers & proof of payment
    paymentDate: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    paymentMethod: { 
        type: String, 
        enum: ['stripe', 'paypal', 'bank_transfer', 'cash', 'chapa', 'telebirr', 'cbe_birr'],
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: { type: String },
    receiptImage: { type: String },
    paymentDate: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

PaymentSchema.pre('save', function() {
    this.updatedAt = new Date();
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
