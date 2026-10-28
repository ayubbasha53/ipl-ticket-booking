import { Schema, model } from 'mongoose';

const stadiumSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    capacity: { type: Number, min: 0 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    imageUrl: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
stadiumSchema.index({ name: 1, city: 1 }, { unique: true });
export const Stadium = model('Stadium', stadiumSchema);
