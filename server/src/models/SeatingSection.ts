import { Schema, model } from 'mongoose';

const seatingSectionSchema = new Schema(
  {
    stadium: { type: Schema.Types.ObjectId, ref: 'Stadium', required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    mode: { type: String, enum: ['seated', 'general'], default: 'general' },
    rows: [{ label: { type: String, required: true }, seatCount: { type: Number, required: true, min: 1 }, _id: false }],
    capacity: { type: Number, min: 0, default: 0 },
    layout: { x: Number, y: Number, w: Number, h: Number }, // position hint for the seating map
  },
  { timestamps: true },
);
seatingSectionSchema.index({ stadium: 1, code: 1 }, { unique: true });
export const SeatingSection = model('SeatingSection', seatingSectionSchema);
