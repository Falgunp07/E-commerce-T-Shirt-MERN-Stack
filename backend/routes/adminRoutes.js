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
    const [products, orders] = await Promise.all([Product.find().lean(), Order.find().lean()]);
    const normalizedProducts = products.map(normalizeProduct);
    const grossSales = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalTax = normalizedProducts.reduce((sum, product) => {
      const price = Number(product.price || 0);
      const taxSlab = Number(product.taxSlab || 12);
      return sum + price - price / (1 + taxSlab / 100);
    }, 0);
    const totalCostBasis = normalizedProducts.reduce((sum, product) => {
      const firstVariant = product.variants?.[0];
      return sum + Number(firstVariant?.costPrice || 0);
    }, 0);
    const lowStockCount = normalizedProducts.reduce(
      (sum, product) =>
        sum +
        product.variants.filter((variant) => Number(variant.stock || 0) <= Number(variant.safetyThreshold || 5)).length,
      0
    );

    const now = new Date();
    const weeklySales = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
      const totalSales = orders
        .filter((order) => {
          const createdAt = new Date(order.createdAt);
          return createdAt >= start && createdAt < end && order.status !== 'cancelled';
        })
        .reduce((sum, order) => sum + Number(order.amount || 0), 0);

      return {
        _id: start.toISOString().slice(0, 10),
        totalSales,
      };
    });

    return res.json({
      success: true,
      stats: {
        ordersCount: orders.length,
        productsCount: normalizedProducts.length,
        lowStockCount,
        grossSales,
        totalTax: Math.round(totalTax),
        netProfit: Math.max(0, Math.round(grossSales - totalCostBasis - totalTax)),
        weeklySales,
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

router.get('/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1, activeFrom: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body || {});
    await writeAuditLog(req, 'Created coupon', { couponId: coupon._id, code: coupon.code });
    return res.status(201).json({ success: true, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/coupons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true }).lean();
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

export default router;
