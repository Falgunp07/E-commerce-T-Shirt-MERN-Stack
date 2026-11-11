import express from 'express';
import Coupon from '../models/Coupon.js';
import { calculateCouponDiscount } from '../utils/helpers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      activeFrom: { $lte: now },
      activeTo: { $gte: now },
    }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/validate', async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const total = Number(req.body?.total || 0);

  try {
    const coupon = await Coupon.findOne({ code, isActive: true }).lean();
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    const now = new Date();
    if ((coupon.activeFrom && new Date(coupon.activeFrom) > now) || (coupon.activeTo && new Date(coupon.activeTo) < now)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    }
    if (total < (coupon.minimumCartValue || 0)) {
      return res.status(400).json({ success: false, message: `Coupon requires minimum cart value of Rs.${coupon.minimumCartValue}` });
    }

    const discountAmount = calculateCouponDiscount(coupon, total);
    return res.json({
      success: true,
      coupon: {
        ...coupon,
        discountAmount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
