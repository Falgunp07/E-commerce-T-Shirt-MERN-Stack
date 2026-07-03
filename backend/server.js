import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

import Product from './models/Product.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Coupon from './models/Coupon.js';
import CMSConfig from './models/CMS.js';
import AuditLog from './models/AuditLog.js';

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'threadlab-development-secret';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
const PHONE_RE = /^\d{10,15}$/;
const ADDRESS_RE = /^[A-Za-z0-9\s,./#()\-]{3,120}$/;
const LABEL_RE = /^[A-Za-z][A-Za-z\s-]{1,24}$/;
const PLACE_RE = /^[A-Za-z][A-Za-z\s.-]{1,39}$/;
const POSTAL_RE = /^\d{4,10}$/;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ThreadLab backend is running',
  });
});

// Connect to MongoDB (local fallback)
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tshirt-ecommerce';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

function publicUser(user) {
  const addresses = Array.isArray(user.addresses)
    ? user.addresses.map((address, index) => ({
        id: address._id || `${user._id}-address-${index + 1}`,
        label: address.label || 'Home',
        fullName: address.fullName || '',
        phone: address.phone || '',
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        isDefault: Boolean(address.isDefault),
      }))
    : [];

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    addresses,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

function isValidName(value) {
  return NAME_RE.test(String(value || '').trim());
}

function isValidPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

function isValidAddressText(value) {
  return ADDRESS_RE.test(String(value || '').trim());
}

function isValidLabel(value) {
  return LABEL_RE.test(String(value || '').trim());
}

function isValidPlace(value) {
  return PLACE_RE.test(String(value || '').trim());
}

function isValidPostalCode(value) {
  return POSTAL_RE.test(String(value || '').trim());
}

function normalizeAddresses(addresses = []) {
  const nextAddresses = addresses
    .filter((address) => address && (address.line1 || address.city || address.state || address.postalCode))
    .map((address) => {
      const nextAddress = {
        label: String(address.label || 'Home').trim() || 'Home',
        fullName: String(address.fullName || '').trim(),
        phone: String(address.phone || '').trim(),
        line1: String(address.line1 || '').trim(),
        line2: String(address.line2 || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        postalCode: String(address.postalCode || '').trim(),
        country: String(address.country || 'India').trim() || 'India',
        isDefault: Boolean(address.isDefault),
      };

      if (!isValidLabel(nextAddress.label)) throw new Error('Address label contains invalid characters');
      if (!isValidName(nextAddress.fullName)) throw new Error('Address full name contains invalid characters');
      if (!isValidPhone(nextAddress.phone)) throw new Error('Address phone number must be 10 to 15 digits');
      if (!isValidAddressText(nextAddress.line1)) throw new Error('Address line 1 contains invalid characters');
      if (nextAddress.line2 && !isValidAddressText(nextAddress.line2)) throw new Error('Address line 2 contains invalid characters');
      if (!isValidPlace(nextAddress.city)) throw new Error('City contains invalid characters');
      if (!isValidPlace(nextAddress.state)) throw new Error('State contains invalid characters');
      if (!isValidPostalCode(nextAddress.postalCode)) throw new Error('Postal code must be 4 to 10 digits');
      if (!isValidPlace(nextAddress.country)) throw new Error('Country contains invalid characters');

      return nextAddress;
    });

  if (!nextAddresses.length) return [];
  if (!nextAddresses.some((address) => address.isDefault)) {
    nextAddresses[0].isDefault = true;
  } else {
    let foundDefault = false;
    nextAddresses.forEach((address) => {
      if (address.isDefault && !foundDefault) foundDefault = true;
      else address.isDefault = false;
    });
  }
  return nextAddresses;
}

function formatAddress(address = {}) {
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please sign in to continue' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Account not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
    }
    next();
  };
}

async function writeAuditLog(req, action, payload = {}) {
  if (!req.user) return;
  try {
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action,
      clientIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      payload,
    });
  } catch {
    // Non-blocking log failures should not break admin actions.
  }
}

function normalizeProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const fallbackVariant =
    variants.length > 0
      ? variants
      : [
          {
            sku: `TL-${String(product._id).slice(-6).toUpperCase()}`,
            size: 'M',
            color: product.color || 'Black',
            stock: 10,
            safetyThreshold: 5,
            costPrice: Math.max(0, Math.round((product.price || 0) * 0.55)),
            mrp: product.price || 0,
            price: product.price || 0,
            images: product.images?.length ? product.images : product.img ? [product.img] : [],
          },
        ];

  return {
    ...product,
    subCategory: product.subCategory || '',
    taxSlab: product.taxSlab ?? 12,
    variants: fallbackVariant,
    images: product.images?.length ? product.images : product.img ? [product.img] : [],
    img: product.img || product.images?.[0] || '',
  };
}

function calculateCouponDiscount(coupon, total) {
  if (!coupon) return 0;
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (Number(total) * Number(coupon.discountValue)) / 100;
  } else {
    discountAmount = Number(coupon.discountValue);
  }
  if (coupon.maxDiscountLimit) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountLimit));
  }
  return Math.max(0, Math.round(discountAmount));
}

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (!isValidName(name)) {
    return res.status(400).json({ success: false, message: 'Name contains invalid characters' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  if (password.includes('`')) {
    return res.status(400).json({ success: false, message: 'Password contains invalid characters' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'customer',
    });
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
    return res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address' });
  }
  if (!password || password.includes('`')) {
    return res.status(400).json({ success: false, message: 'Password contains invalid characters' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
    return res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').trim();

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!isValidName(name)) {
    return res.status(400).json({ success: false, message: 'Name contains invalid characters' });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: 'Phone number must be 10 to 15 digits' });
  }

  try {
    const addresses = normalizeAddresses(Array.isArray(req.body?.addresses) ? req.body.addresses : []);
    req.user.name = name;
    req.user.phone = phone;
    req.user.addresses = addresses;
    await req.user.save();
    return res.json({ success: true, user: publicUser(req.user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/auth/password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }
  if (currentPassword.includes('`') || newPassword.includes('`')) {
    return res.status(400).json({ success: false, message: 'Password contains invalid characters' });
  }

  try {
    const isValid = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    req.user.password = await bcrypt.hash(newPassword, 12);
    await req.user.save();
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/account/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/coupons', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      activeFrom: { $lte: now },
      activeTo: { $gte: now }
    }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
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

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ success: true, products: products.map(normalizeProduct) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id).lean();
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: normalizeProduct(prod) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const payload = req.body;
    const p = new Product(payload);
    await p.save();
    res.json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Checkout -> persist orders to MongoDB
app.post('/api/checkout', requireAuth, async (req, res) => {
  const { cart, total, customer = {}, paymentMethod = 'COD' } = req.body || {};
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  try {
    const defaultAddress =
      Array.isArray(req.user.addresses) && req.user.addresses.length
        ? req.user.addresses.find((address) => address.isDefault) || req.user.addresses[0]
        : null;
    const amount = total || cart.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0);
    const customerSnapshot = {
      name: String(customer.name || req.user.name || '').trim(),
      email: req.user.email,
      phone: String(customer.phone || req.user.phone || defaultAddress?.phone || '').trim(),
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
    const order = new Order({
      userId: req.user._id,
      cart,
      amount,
      customer: customerSnapshot,
      paymentMethod,
      status: paymentMethod === 'COD' ? 'pending' : 'unpaid',
    });
    await order.save();
    await writeAuditLog(req, 'Created order', { orderId: order._id, amount: order.amount });
    return res.json({ success: true, orderId: order._id, amount: order.amount, status: order.status });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// list orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/stats', requireAuth, requireRole(['admin', 'catalog_manager', 'logistics_manager']), async (req, res) => {
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

app.get('/api/admin/products', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, products: products.map(normalizeProduct) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/products', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const product = await Product.create(req.body || {});
    await writeAuditLog(req, 'Created product', { productId: product._id, title: product.title });
    return res.status(201).json({ success: true, product: normalizeProduct(product.toObject()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/products/:id', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true }).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await writeAuditLog(req, 'Updated product', { productId: req.params.id, title: product.title });
    return res.json({ success: true, product: normalizeProduct(product) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await writeAuditLog(req, 'Deleted product', { productId: req.params.id, title: product.title });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/orders', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/orders/:id/status', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
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

app.put('/api/admin/orders/:id/rma', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
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

app.get('/api/admin/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1, activeFrom: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/coupons', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body || {});
    await writeAuditLog(req, 'Created coupon', { couponId: coupon._id, code: coupon.code });
    return res.status(201).json({ success: true, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/coupons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await writeAuditLog(req, 'Updated coupon', { couponId: coupon._id, code: coupon.code });
    return res.json({ success: true, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/coupons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await writeAuditLog(req, 'Deleted coupon', { couponId: coupon._id, code: coupon.code });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/cms', requireAuth, requireRole(['admin']), async (req, res) => {
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

app.post('/api/admin/cms', requireAuth, requireRole(['admin']), async (req, res) => {
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

app.get('/api/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200).lean();
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/customers', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
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

app.get('/api/admin/export/orders', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
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

app.get('/api/admin/export/financials', requireAuth, requireRole(['admin', 'logistics_manager']), async (req, res) => {
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

// Start server after DB connect
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
