import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entityType: String,
    entityId: String,
    ip: String,
    userAgent: String,
    meta: Schema.Types.Mixed, // never put secrets here
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditLogSchema.index({ createdAt: -1 });
export const AuditLog = model('AuditLog', auditLogSchema);
