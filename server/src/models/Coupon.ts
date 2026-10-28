import { Schema, model } from 'mongoose';

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 }, // percent: 0-100, fixed: paise
    minOrderPaise: { type: Number, default: 0, min: 0 },
    maxDiscountPaise: { type: Number, min: 0 },
    startsAt: Date,
    expiresAt: Date,
    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }],
    categoryCodes: [String],
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
couponSchema.pre('validate', function (next) {
  if (this.type === 'percent' && this.value > 100) return next(new Error('Percent coupon cannot exceed 100'));
  next();
});

const redemptionSchema = new Schema(
  {
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    discountPaise: { type: Number, required: true },
  },
  { timestamps: true },
);
redemptionSchema.index({ coupon: 1, user: 1 });

export const Coupon = model('Coupon', couponSchema);
export const CouponRedemption = model('CouponRedemption', redemptionSchema);
