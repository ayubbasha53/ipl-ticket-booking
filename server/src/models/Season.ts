import { Schema, model } from 'mongoose';

const seasonSchema = new Schema(
  {
    name: { type: String, required: true },
    year: { type: Number, required: true, unique: true },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Season = model('Season', seasonSchema);
