import { Schema, model } from 'mongoose';

const ticketCategorySchema = new Schema(
  {
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    section: { type: Schema.Types.ObjectId, ref: 'SeatingSection' },
    mode: { type: String, enum: ['seated', 'general'], default: 'general' },
    pricePaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
    capacity: { type: Number, required: true, min: 0 },
    // Counters for general-admission categories; seated categories track per-seat status instead.
    heldCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    maxPerBooking: { type: Number, min: 1 },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
ticketCategorySchema.index({ match: 1, code: 1 }, { unique: true });
ticketCategorySchema.pre('validate', function (next) {
  if (this.heldCount + this.soldCount > this.capacity) return next(new Error('Held + sold cannot exceed capacity'));
  next();
});
export const TicketCategory = model('TicketCategory', ticketCategorySchema);
