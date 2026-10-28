import { Schema, model } from 'mongoose';

/** Seat-level inventory for one match. */
const seatSchema = new Schema(
  {
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'TicketCategory', required: true },
    section: { type: Schema.Types.ObjectId, ref: 'SeatingSection', required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    status: { type: String, enum: ['available', 'held', 'sold', 'unavailable'], default: 'available' },
    hold: { type: Schema.Types.ObjectId, ref: 'SeatHold' },
    holdExpiresAt: Date,
  },
  { timestamps: true },
);
seatSchema.index({ match: 1, section: 1, row: 1, number: 1 }, { unique: true });
seatSchema.index({ match: 1, category: 1, status: 1 });
seatSchema.index({ status: 1, holdExpiresAt: 1 });
export const Seat = model('Seat', seatSchema);
