import express from 'express';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
