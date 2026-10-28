import { Schema, model } from 'mongoose';

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['razorpay', 'mock'], required: true },
    providerOrderId: { type: String },
    providerPaymentId: { type: String },
    amountPaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'pending', 'captured', 'failed', 'refunded'], default: 'created' },
    signatureVerified: { type: Boolean, default: false },
    processedEventIds: [String], // webhook idempotency
    failureReason: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
paymentSchema.index({ providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: 'string' } } });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, partialFilterExpression: { providerPaymentId: { $type: 'string' } } });
export const Payment = model('Payment', paymentSchema);
