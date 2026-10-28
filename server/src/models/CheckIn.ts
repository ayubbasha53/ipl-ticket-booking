import { Schema, model } from 'mongoose';

const checkInSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    result: { type: String, enum: ['admitted', 'rejected'], required: true },
    rejectReason: String,
    gate: String,
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
// A ticket can be admitted only once, even under simultaneous scans.
checkInSchema.index({ ticket: 1 }, { unique: true, partialFilterExpression: { result: 'admitted' } });
export const CheckIn = model('CheckIn', checkInSchema);
