import { Schema, model } from 'mongoose';

const seatHoldSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    items: [
      {
        category: { type: Schema.Types.ObjectId, ref: 'TicketCategory', required: true },
        quantity: { type: Number, required: true, min: 1 },
        seats: [{ type: Schema.Types.ObjectId, ref: 'Seat' }],
        unitPricePaise: { type: Number, required: true },
        _id: false,
      },
    ],
    status: { type: String, enum: ['active', 'converted', 'released', 'expired'], default: 'active' },
    expiresAt: { type: Date, required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  },
  { timestamps: true },
);
seatHoldSchema.index({ status: 1, expiresAt: 1 });
export const SeatHold = model('SeatHold', seatHoldSchema);
