import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  title: String,
  price: Number,
  size: String,
  qty: { type: Number, default: 1 },
  img: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
});

const OrderSchema = new mongoose.Schema({
  cart: [OrderItemSchema],
  amount: Number,
  customer: {
    name: String,
    phone: String,
    address: String,
  },
  paymentMethod: { type: String, default: 'COD' },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
