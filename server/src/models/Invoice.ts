import { Schema, model } from 'mongoose';

const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    type: { type: String, enum: ['invoice', 'credit_note'], default: 'invoice' },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    relatedInvoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lines: [{ description: String, quantity: Number, unitPricePaise: Number, amountPaise: Number, _id: false }],
    subtotalPaise: Number,
    discountPaise: Number,
    feesPaise: Number,
    taxBreakdown: [{ name: String, rateBps: Number, amountPaise: Number, _id: false }],
    totalPaise: Number,
    taxSnapshot: Schema.Types.Mixed,
    issuedAt: { type: Date, default: Date.now },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Invoice = model('Invoice', invoiceSchema);
