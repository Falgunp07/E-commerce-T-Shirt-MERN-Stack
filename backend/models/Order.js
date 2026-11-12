import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  id: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: String,
  price: Number,
  size: String,
  color: String,
  qty: { type: Number, default: 1 },
  img: String,
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cart: [OrderItemSchema],
  amount: Number,
  baseAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalCostBasis: { type: Number, default: 0 },
  couponUsed: { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },
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
