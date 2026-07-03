import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minimumCartValue: { type: Number, default: 0 },
  maxDiscountLimit: { type: Number }, // Absolute capping (e.g., max ₹500 discount)
  perUserLimit: { type: Number, default: 1 },
  activeFrom: { type: Date, required: true },
  activeTo: { type: Date, required: true },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
