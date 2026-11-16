import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
