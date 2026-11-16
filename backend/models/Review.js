import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  quote: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productTitle: { type: String, default: '' },
  verifiedPurchase: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
