import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { optionalAuth } from '../middleware/auth.js';
import { formatAddress, calculateCouponDiscount, writeAuditLog } from '../utils/helpers.js';
import { isValidName, isValidPhone, isValidAddressText } from '../utils/validators.js';

const router = express.Router();

router.post('/checkout', optionalAuth, async (req, res) => {
  const { cart, total, customer = {}, paymentMethod = 'COD', couponCode } = req.body || {};
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  try {
    const defaultAddress =
      req.user && Array.isArray(req.user.addresses) && req.user.addresses.length
        ? req.user.addresses.find((address) => address.isDefault) || req.user.addresses[0]
        : null;

    const rawSubtotal = cart.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0);

    let couponDiscount = 0;
    let couponUsed = '';
    if (couponCode) {
      const codeStr = String(couponCode).trim().toUpperCase();
      const foundCoupon = await Coupon.findOne({ code: codeStr, isActive: true });
      if (foundCoupon) {
        const now = new Date();
        const validDates = (!foundCoupon.activeFrom || new Date(foundCoupon.activeFrom) <= now) &&
                           (!foundCoupon.activeTo || new Date(foundCoupon.activeTo) >= now);
        const validMin = !foundCoupon.minimumCartValue || rawSubtotal >= foundCoupon.minimumCartValue;
        if (validDates && validMin) {
          couponDiscount = calculateCouponDiscount(foundCoupon, rawSubtotal);
          couponUsed = foundCoupon.code;
          foundCoupon.usageCount = (foundCoupon.usageCount || 0) + 1;
          await foundCoupon.save();
        }
      }
    }

    const calculatedTotal = Math.max(0, rawSubtotal - couponDiscount);
    const amount = calculatedTotal;
    const baseAmount = Math.round(amount / 1.12);
    const taxAmount = Math.max(0, amount - baseAmount);

    const customerSnapshot = {
      name: String(customer.name || req.user?.name || '').trim(),
      email: String(customer.email || req.user?.email || 'guest@threadlab.com').trim().toLowerCase(),
      phone: String(customer.phone || req.user?.phone || defaultAddress?.phone || '9999999999').trim(),
      address: String(customer.address || formatAddress(defaultAddress) || '').trim(),
    };

    if (!isValidName(customerSnapshot.name)) {
      return res.status(400).json({ success: false, message: 'Customer name contains invalid characters' });
    }
    if (!isValidPhone(customerSnapshot.phone)) {
      return res.status(400).json({ success: false, message: 'Customer phone number must be 10 to 15 digits' });
    }
    if (!isValidAddressText(customerSnapshot.address)) {
      return res.status(400).json({ success: false, message: 'Customer address contains invalid characters' });
    }

    // Calculate total cost basis & decrement stock inventory
    let totalCostBasis = 0;
    const preparedCart = [];

    for (const item of cart) {
      let prod = null;
      const prodId = item.productId || item.id;
      if (prodId && mongoose.isValidObjectId(prodId)) {
        prod = await Product.findById(prodId);
      }
      if (!prod && item.title) {
        prod = await Product.findOne({ title: new RegExp(`^${item.title.trim()}$`, 'i') });
      }

      const resolvedProductId = prod ? prod._id : (mongoose.isValidObjectId(prodId) ? prodId : null);

      if (prod) {
        if (Array.isArray(prod.variants) && prod.variants.length > 0) {
          let matchedVariant = prod.variants.find((v) => v.size === item.size && (!item.color || v.color === item.color));
          if (!matchedVariant) matchedVariant = prod.variants[0];
          if (matchedVariant) {
            totalCostBasis += (matchedVariant.costPrice || Math.round((prod.price || 0) * 0.5)) * (Number(item.qty) || 1);
            matchedVariant.stock = Math.max(0, (matchedVariant.stock || 0) - (Number(item.qty) || 1));
            await prod.save();
          }
        } else {
          totalCostBasis += Math.round((prod.price || 0) * 0.5) * (Number(item.qty) || 1);
        }
      }

      preparedCart.push({
        id: String(item.id || item.productId || resolvedProductId || ''),
        productId: resolvedProductId,
        title: item.title,
        price: Number(item.price) || (prod?.price || 0),
        size: item.size || 'M',
        color: item.color || (prod?.color || 'Black'),
        qty: Number(item.qty) || 1,
        img: item.img || prod?.img || '',
      });
    }

    const order = new Order({
      userId: req.user ? req.user._id : null,
      cart: preparedCart,
      amount,
      baseAmount,
      taxAmount,
      totalCostBasis,
      couponUsed,
      couponDiscount,
      customer: customerSnapshot,
      paymentMethod,
      status: paymentMethod === 'COD' ? 'pending' : 'unpaid',
      awbCode: '',
      shippingLabelUrl: '',
      rma: { status: 'none', reason: '', qcStatus: 'pending', refundTxnId: '' },
    });
    await order.save();

    if (req.user) {
      await writeAuditLog(req, 'Created order', { orderId: order._id, amount: order.amount });
    }

    return res.json({
      success: true,
      orderId: order._id,
      amount: order.amount,
      baseAmount: order.baseAmount,
      taxAmount: order.taxAmount,
      couponDiscount: order.couponDiscount,
      status: order.status,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
