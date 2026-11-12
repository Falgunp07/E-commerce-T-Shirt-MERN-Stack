import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { normalizeProduct } from '../utils/helpers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().lean();
    return res.json({ success: true, products: products.map(normalizeProduct) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    let prod = null;

    if (mongoose.isValidObjectId(rawId)) {
      prod = await Product.findById(rawId).lean();
    }

    if (!prod) {
      const decoded = decodeURIComponent(rawId).trim();
      prod = await Product.findOne({
        $or: [
          { title: new RegExp(`^${decoded.replace(/[-_]/g, ' ')}$`, 'i') },
          { title: new RegExp(`^${decoded}$`, 'i') },
          { title: new RegExp(decoded, 'i') },
        ],
      }).lean();
    }

    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, product: normalizeProduct(prod) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const p = new Product(payload);
    await p.save();
    return res.status(201).json({ success: true, product: normalizeProduct(p.toObject()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
