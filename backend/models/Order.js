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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cart: [OrderItemSchema],
  amount: Number,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  paymentMethod: { type: String, default: 'COD' },
  status: { type: String, default: 'pending' },
  awbCode: String,
  shippingLabelUrl: String,
  trackingUrl: String,
  rma: {
    status: { type: String, default: 'none' },
    reason: String,
    qcStatus: String,
    refundTxnId: String,
    updatedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
