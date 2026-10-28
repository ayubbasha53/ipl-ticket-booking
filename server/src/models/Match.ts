import { Schema, model } from 'mongoose';

export const MATCH_STATUS = ['upcoming', 'live', 'completed', 'postponed', 'cancelled'] as const;
export const SALE_STATUS = ['not_open', 'open', 'closed', 'sold_out'] as const;
export const STAGES = ['league', 'qualifier-1', 'eliminator', 'qualifier-2', 'final'] as const;

const matchSchema = new Schema(
  {
    season: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    matchNumber: { type: Number, required: true, min: 1 },
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    stadium: { type: Schema.Types.ObjectId, ref: 'Stadium', required: true },
    startsAt: { type: Date, required: true, index: true }, // stored UTC, displayed in Asia/Kolkata
    stage: { type: String, enum: STAGES, default: 'league' },
    status: { type: String, enum: MATCH_STATUS, default: 'upcoming', index: true },
    saleStatus: { type: String, enum: SALE_STATUS, default: 'not_open' },
    saleOpensAt: Date,
    saleClosesAt: Date,
    maxTicketsPerBooking: { type: Number, default: 6, min: 1, max: 20 },
    holdMinutes: { type: Number, default: 5, min: 1, max: 30 },
    cancellationPolicy: {
      allowed: { type: Boolean, default: false },
      cutoffHoursBeforeMatch: { type: Number, default: 48, min: 0 },
      deductionPercent: { type: Number, default: 10, min: 0, max: 100 },
      flatDeductionPaise: { type: Number, default: 0, min: 0 },
      notes: String,
    },
    result: { summary: String, verified: { type: Boolean, default: false } },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
matchSchema.index({ season: 1, matchNumber: 1 }, { unique: true });
matchSchema.index({ homeTeam: 1, startsAt: 1 });
matchSchema.index({ awayTeam: 1, startsAt: 1 });
matchSchema.pre('validate', function (next) {
  if (this.homeTeam && this.awayTeam && this.homeTeam.equals(this.awayTeam)) {
    return next(new Error('A team cannot play itself'));
  }
  next();
});
export const Match = model('Match', matchSchema);
