import { Schema, model, type InferSchemaType } from 'mongoose';

export const ROLES = ['customer', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true }, // E.164, e.g. +919876543210
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },

    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    phoneVerified: { type: Boolean, default: false },

    // Only SHA-256 hashes of one-time tokens are stored.
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    emailVerifySentAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    passwordChangedAt: Date,
    lastLoginAt: Date,

    consent: {
      termsAcceptedAt: { type: Date, required: true },
      privacyAcceptedAt: { type: Date, required: true },
      transactionalNotifications: { type: Boolean, default: true },
      marketingNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

userSchema.index({ resetTokenHash: 1 }, { sparse: true });
userSchema.index({ emailVerifyTokenHash: 1 }, { sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
