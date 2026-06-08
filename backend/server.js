import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import Product from './models/Product.js';
import Order from './models/Order.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id).lean();
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: prod });
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
app.post('/api/checkout', async (req, res) => {
  const { cart, total, customer = {}, paymentMethod = 'COD' } = req.body || {};
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  try {
    const amount = total || cart.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0);
    const order = new Order({ cart, amount, customer, paymentMethod, status: paymentMethod === 'COD' ? 'pending' : 'unpaid' });
    await order.save();
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

// Start server after DB connect
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
