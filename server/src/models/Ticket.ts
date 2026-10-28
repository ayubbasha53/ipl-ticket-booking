import { Schema, model } from 'mongoose';

const ticketSchema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    categoryCode: String,
    seat: { section: String, row: String, number: Number },
    // QR carries an opaque token; only its hash is stored. No personal data in the QR.
    qrTokenHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['valid', 'used', 'revoked', 'cancelled'], default: 'valid' },
    usedAt: Date,
    isDemo: { type: Boolean, default: false }, // demo tickets are never valid for stadium entry
  },
  { timestamps: true },
);
export const Ticket = model('Ticket', ticketSchema);
