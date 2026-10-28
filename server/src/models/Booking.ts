import { Schema, model } from 'mongoose';

export const BOOKING_STATUS = ['pending_payment', 'confirmed', 'cancelled', 'expired', 'failed'] as const;
export const PAYMENT_STATUS = ['unpaid', 'pending', 'paid', 'failed', 'refund_pending', 'partially_refunded', 'refunded'] as const;

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true }, // e.g. IPLD-7K3M9Q
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    hold: { type: Schema.Types.ObjectId, ref: 'SeatHold' },
    status: { type: String, enum: BOOKING_STATUS, default: 'pending_payment', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'unpaid' },
    idempotencyKey: { type: String },

    contact: { name: String, email: String, phone: String },

    // Snapshots: later admin edits must never rewrite a completed purchase.
    matchSnapshot: { type: Schema.Types.Mixed, required: true },
    items: [
      {
        categoryCode: String,
        categoryName: String,
        quantity: Number,
        unitPricePaise: Number,
        seats: [{ section: String, row: String, number: Number, _id: false }],
        _id: false,
      },
    ],
    pricing: {
      subtotalPaise: Number,
      discountPaise: Number,
      feesPaise: Number,
      taxablePaise: Number,
      taxPaise: Number,
      taxBreakdown: [{ name: String, rateBps: Number, amountPaise: Number, _id: false }],
      totalPaise: Number,
    },
    couponCode: String,
    taxSnapshot: Schema.Types.Mixed,
    policySnapshot: Schema.Types.Mixed,

    confirmedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
bookingSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
export const Booking = model('Booking', bookingSchema);
