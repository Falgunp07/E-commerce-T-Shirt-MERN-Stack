import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAuditLog } from '../utils/helpers.js';

const router = express.Router();

router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order that has already shipped or been delivered. Please request an RMA return instead.'
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock back to inventory
    if (Array.isArray(order.cart)) {
      for (const item of order.cart) {
        if (!item.id) continue;
        const prod = await Product.findById(item.id);
        if (prod && Array.isArray(prod.variants)) {
          const variant = prod.variants.find((v) => v.size === item.size) || prod.variants[0];
          if (variant) {
            variant.stock = (variant.stock || 0) + (Number(item.qty) || 1);
            await prod.save();
          }
        }
      }
    }

    await writeAuditLog(req, 'Customer cancelled order', { orderId: order._id, amount: order.amount });
    return res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
