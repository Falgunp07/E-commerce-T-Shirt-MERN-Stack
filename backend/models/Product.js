import mongoose from 'mongoose';

const ProductVariantSchema = new mongoose.Schema(
  {
    sku: String,
    size: String,
    color: String,
    stock: { type: Number, default: 0 },
    safetyThreshold: { type: Number, default: 5 },
    costPrice: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Tees' },
  subCategory: { type: String, default: '' },
  taxSlab: { type: Number, default: 12 },
  color: { type: String, default: 'Black' },
  description: { type: String },
  img: { type: String },
  images: { type: [String], default: [] },
  variants: { type: [ProductVariantSchema], default: [] },
  isFlashSale: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
