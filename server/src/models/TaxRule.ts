import { Schema, model } from 'mongoose';

/** Rates live here and only here. Every confirmed booking stores a snapshot of the rule it used. */
const taxRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    appliesTo: { type: String, enum: ['all', 'categories'], default: 'all' },
    categoryCodes: [String],
    basis: { type: String, enum: ['ticket_price', 'ticket_price_plus_fees'], default: 'ticket_price' },
    treatment: { type: String, enum: ['intra_state', 'inter_state'], default: 'intra_state' },
    // Rates in basis points (1800 = 18%). Components must sum to the total rate.
    totalRateBps: { type: Number, required: true, min: 0, max: 10000 },
    components: [{ name: { type: String, required: true }, rateBps: { type: Number, required: true, min: 0 }, _id: false }],
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true },
);
taxRuleSchema.index({ active: 1, effectiveFrom: 1, effectiveTo: 1 });
taxRuleSchema.pre('validate', function (next) {
  if (this.components?.length) {
    const sum = this.components.reduce((s, c) => s + c.rateBps, 0);
    if (sum !== this.totalRateBps) return next(new Error('Tax components must sum to totalRateBps'));
  }
  next();
});
export const TaxRule = model('TaxRule', taxRuleSchema);
