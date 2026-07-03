import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  action: { type: String, required: true },
  clientIp: String,
  payload: mongoose.Schema.Types.Mixed
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
