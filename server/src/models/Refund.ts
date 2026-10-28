import { Schema, model } from 'mongoose';

const refundSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    amountPaise: { type: Number, required: true, min: 0 },
    deductionPaise: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['requested', 'processing', 'processed', 'failed', 'rejected'], default: 'requested' },
    providerRefundId: String,
    reason: String,
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    history: [{ status: String, at: { type: Date, default: Date.now }, note: String, _id: false }],
  },
  { timestamps: true },
);
// At most one non-failed refund per booking prevents duplicate refund requests.
refundSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['requested', 'processing', 'processed'] } } });
export const Refund = model('Refund', refundSchema);
