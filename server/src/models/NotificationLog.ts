import { Schema, model } from 'mongoose';

/** Delivery log. Never stores message bodies, OTPs, tokens or payment data. */
const notificationLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    template: { type: String, required: true },
    toMasked: String,
    provider: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'not_sent_demo_mode'], required: true },
    providerMessageId: String,
    error: String,
    dedupeKey: String,
  },
  { timestamps: true },
);
notificationLogSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' }, status: 'sent' } });
export const NotificationLog = model('NotificationLog', notificationLogSchema);
