import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import CMSConfig from '../models/CMS.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { normalizeProduct, publicUser, writeAuditLog } from '../utils/helpers.js';

const router = express.Router();

router.get('/stats', requireAuth, requireRole(['admin', 'catalog_manager', 'logistics_manager']), async (req, res) => {
  try {
    const timeRange = String(req.query.timeRange || '7d');
    const [products, orders, customersCount] = await Promise.all([
      Product.find().lean(),
      Order.find().sort({ createdAt: -1 }).lean(),
      User.countDocuments({ role: 'customer' }),
    ]);
    const normalizedProducts = products.map(normalizeProduct);

    const now = new Date();
    let startDate = new Date();
    let dayCount = 7;
    if (timeRange === '30d') {
      dayCount = 30;
      startDate.setDate(now.getDate() - 29);
    } else if (timeRange === 'all') {
      dayCount = 30;
      startDate.setDate(now.getDate() - 29);
    } else {
      dayCount = 7;
      startDate.setDate(now.getDate() - 6);
    }
    startDate.setHours(0, 0, 0, 0);

    const periodOrders = orders.filter((o) => {
      if (timeRange === 'all') return true;
      return new Date(o.createdAt) >= startDate;
    });

    const nonCancelledOrders = periodOrders.filter((order) => order.status !== 'cancelled');
    const grossSales = nonCancelledOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const deliveredCount = periodOrders.filter((order) => order.status === 'delivered').length;
    const cancelledCount = periodOrders.filter((order) => order.status === 'cancelled').length;

    const totalTax = nonCancelledOrders.reduce((sum, o) => sum + Number(o.taxAmount || Math.round((o.amount || 0) * 0.12)), 0);
    const totalCostBasis = nonCancelledOrders.reduce((sum, o) => sum + Number(o.totalCostBasis || Math.round((o.amount || 0) * 0.5)), 0);
    const netProfit = Math.max(0, Math.round(grossSales - totalCostBasis - totalTax));
    const aov = nonCancelledOrders.length > 0 ? Math.round(grossSales / nonCancelledOrders.length) : 0;

    const lowStockCount = normalizedProducts.reduce(
      (sum, product) =>
        sum +
        product.variants.filter((variant) => Number(variant.stock || 0) <= Number(variant.safetyThreshold || 5)).length,
      0
    );

    const salesTrend = Array.from({ length: dayCount }, (_, index) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + index);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

      const dayOrders = orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= start && createdAt < end && order.status !== 'cancelled';
      });

      const daySales = dayOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

      return {
        _id: start.toISOString().slice(0, 10),
        label: start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        totalSales: daySales,
        ordersCount: dayOrders.length,
        aov: dayOrders.length > 0 ? Math.round(daySales / dayOrders.length) : 0,
      };
    });

    const orderStatusBreakdown = {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      returned: orders.filter((o) => ['returned', 'rma'].includes(o.status)).length,
    };

    const productSalesMap = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.cart || []).forEach((item) => {
        const id = String(item.id || item._id || item.title);
        if (!productSalesMap[id]) {
          productSalesMap[id] = {
            id,
            title: item.title,
            img: item.img || '',
            qty: 0,
            revenue: 0,
          };
        }
        productSalesMap[id].qty += Number(item.qty || 1);
        productSalesMap[id].revenue += Number(item.price || 0) * Number(item.qty || 1);
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o._id,
      customerName: o.customer?.name || 'Customer',
      amount: o.amount,
      status: o.status,
      paymentMethod: o.paymentMethod || 'COD',
      itemsCount: Array.isArray(o.cart) ? o.cart.reduce((s, i) => s + (i.qty || 1), 0) : 0,
      createdAt: o.createdAt,
    }));

    return res.json({
      success: true,
      stats: {
        timeRange,
        ordersCount: periodOrders.length,
        deliveredCount,
        cancelledCount,
        customersCount,
        productsCount: normalizedProducts.length,
        lowStockCount,
        grossSales,
        totalTax: Math.round(totalTax),
        totalCostBasis: Math.round(totalCostBasis),
        netProfit,
        aov,
        weeklySales: salesTrend,
        salesTrend,
        orderStatusBreakdown,
        topProducts,
        recentOrders,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/products', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, products: products.map(normalizeProduct) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/products', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const product = await Product.create(req.body || {});
    await writeAuditLog(req, 'Created product', { productId: product._id, title: product.title });
    return res.status(201).json({ success: true, product: normalizeProduct(product.toObject()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/products/:id', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true }).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await writeAuditLog(req, 'Updated product', { productId: req.params.id, title: product.title });
    return res.json({ success: true, product: normalizeProduct(product) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/products/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await writeAuditLog(req, 'Deleted product', { productId: req.params.id, title: product.title });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orders', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/status', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim();
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status || order.status;
    if (status === 'manifested') {
      order.awbCode = order.awbCode || `AWB${String(order._id).slice(-8).toUpperCase()}`;
      order.shippingLabelUrl = order.shippingLabelUrl || `https://threadlab.local/labels/${order._id}.pdf`;
    }
    if (status === 'shipped') {
      order.trackingUrl = order.trackingUrl || `https://threadlab.local/track/${order._id}`;
    }
    await order.save();
    await writeAuditLog(req, 'Updated order status', { orderId: order._id, status: order.status });
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/rma', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const rmaStatus = String(req.body?.rmaStatus || order.rma?.status || 'none');
    order.rma = {
      ...(order.rma?.toObject ? order.rma.toObject() : order.rma),
      status: rmaStatus,
      reason: req.body?.reason || order.rma?.reason || '',
      qcStatus: req.body?.qcStatus || order.rma?.qcStatus || '',
      updatedAt: new Date(),
      refundTxnId:
        rmaStatus === 'refunded'
          ? order.rma?.refundTxnId || `RFND${String(order._id).slice(-6).toUpperCase()}`
          : order.rma?.refundTxnId,
    };
    if (rmaStatus === 'refunded') {
      order.status = 'returned';
    }
    await order.save();
    await writeAuditLog(req, 'Updated order RMA', { orderId: order._id, rmaStatus, qcStatus: req.body?.qcStatus || '' });
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

function validateCouponPayload(payload) {
  const code = String(payload.code || '').trim().toUpperCase();
  if (!code || !/^[A-Z0-9_-]{3,20}$/.test(code)) {
    return 'Coupon code must be 3-20 uppercase alphanumeric characters (no spaces).';
  }
  const discountType = payload.discountType;
  if (!['percentage', 'flat'].includes(discountType)) {
    return 'Discount type must be either "percentage" or "flat".';
  }
  const discountValue = Number(payload.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    return 'Discount value must be a positive number.';
  }
  if (discountType === 'percentage' && discountValue > 90) {
    return 'Percentage discount cannot exceed 90%.';
  }
  const minCart = Number(payload.minimumCartValue || 0);
  if (minCart < 0) {
    return 'Minimum cart value cannot be negative.';
  }
  if (discountType === 'flat' && minCart <= discountValue) {
    return `Minimum cart value (₹${minCart}) must be strictly greater than flat discount (₹${discountValue}).`;
  }
  if (payload.activeFrom && payload.activeTo) {
    const from = new Date(payload.activeFrom);
    const to = new Date(payload.activeTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return 'Valid start and expiry dates are required.';
    }
    if (to <= from) {
      return 'Expiry date must be strictly after the start date.';
    }
  }
  return null;
}

router.get('/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1, activeFrom: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  const validationError = validateCouponPayload(req.body || {});
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${code}" already exists.` });
    }
    const coupon = await Coupon.create({
      ...req.body,
      code,
      discountValue: Number(req.body.discountValue),
      minimumCartValue: Number(req.body.minimumCartValue || 0),
      maxDiscountLimit: req.body.maxDiscountLimit ? Number(req.body.maxDiscountLimit) : undefined,
      perUserLimit: Number(req.body.perUserLimit || 1),
    });
    await writeAuditLog(req, 'Created coupon', { couponId: coupon._id, code: coupon.code });
    return res.status(201).json({ success: true, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/coupons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const validationError = validateCouponPayload(req.body || {});
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const existing = await Coupon.findOne({ code, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Another coupon with code "${code}" already exists.` });
    }
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        code,
        discountValue: Number(req.body.discountValue),
        minimumCartValue: Number(req.body.minimumCartValue || 0),
        maxDiscountLimit: req.body.maxDiscountLimit ? Number(req.body.maxDiscountLimit) : undefined,
        perUserLimit: Number(req.body.perUserLimit || 1),
      },
      { new: true, runValidators: true }
    ).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await writeAuditLog(req, 'Updated coupon', { couponId: coupon._id, code: coupon.code });
    return res.json({ success: true, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/coupons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await writeAuditLog(req, 'Deleted coupon', { couponId: coupon._id, code: coupon.code });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/cms', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const [bannersConfig, bentoConfig] = await Promise.all([
      CMSConfig.findOne({ key: 'home_banners' }).lean(),
      CMSConfig.findOne({ key: 'bento_grid_priority' }).lean(),
    ]);
    return res.json({
      success: true,
      cms: {
        banners: bannersConfig?.banners || [],
        bentoGridOrder: bentoConfig?.bentoGridOrder || [],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/cms', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const key = String(req.body?.key || '').trim();
    if (!key) return res.status(400).json({ success: false, message: 'CMS key is required' });
    const update = {
      updatedAt: new Date(),
    };
    if (Array.isArray(req.body?.banners)) update.banners = req.body.banners;
    if (Array.isArray(req.body?.bentoGridOrder)) update.bentoGridOrder = req.body.bentoGridOrder;

    const config = await CMSConfig.findOneAndUpdate({ key }, update, { new: true, upsert: true, setDefaultsOnInsert: true });
    await writeAuditLog(req, 'Updated CMS config', { key });
    return res.json({ success: true, config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/logs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200).lean();
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const [users, orders] = await Promise.all([
      User.find({ role: 'customer' }).sort({ createdAt: -1 }).lean(),
      Order.find().lean(),
    ]);

    const customers = users.map((user) => {
      const customerOrders = orders.filter((order) => String(order.userId || '') === String(user._id));
      const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
      return {
        ...publicUser(user),
        ordersCount: customerOrders.length,
        totalSpent,
        lastOrderAt: customerOrders[0]?.createdAt || null,
      };
    });

    return res.json({ success: true, customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/orders', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const rows = [
      ['orderId', 'createdAt', 'customerName', 'phone', 'amount', 'status'].join(','),
      ...orders.map((order) =>
        [
          order._id,
          new Date(order.createdAt).toISOString(),
          JSON.stringify(order.customer?.name || ''),
          JSON.stringify(order.customer?.phone || ''),
          Number(order.amount || 0),
          order.status || '',
        ].join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(rows.join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/financials', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const rows = [
      ['orderId', 'amount', 'status', 'paymentMethod'].join(','),
      ...orders.map((order) => [order._id, Number(order.amount || 0), order.status || '', order.paymentMethod || ''].join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(rows.join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/logs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000).lean();
    const rows = [
      ['logId', 'timestamp', 'userName', 'userRole', 'action', 'clientIp', 'payload'].join(','),
      ...logs.map((log) => [
        log._id,
        new Date(log.timestamp).toISOString(),
        JSON.stringify(log.userName || ''),
        log.userRole || '',
        JSON.stringify(log.action || ''),
        log.clientIp || '',
        JSON.stringify(JSON.stringify(log.payload || {}))
      ].join(','))
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="security-audit-logs.csv"');
    return res.send(rows.join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
