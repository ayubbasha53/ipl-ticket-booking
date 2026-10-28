import { Schema, model, Types } from 'mongoose';

const sessionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    sid: { type: String, required: true, unique: true },
    userAgent: { type: String, maxlength: 300 },
    ip: String,
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 }); // purge a day after expiry

export const Session = model('Session', sessionSchema);
