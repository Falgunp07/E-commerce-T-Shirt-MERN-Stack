import express from 'express';
import Inquiry from '../models/Inquiry.js';
import Review from '../models/Review.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { isValidEmail, isValidName } from '../utils/validators.js';

const router = express.Router();

const INITIAL_SEED_REVIEWS = [
  {
    name: 'Aarav Sharma',
    rating: 5,
    quote: 'Print quality was clean and the size fit exactly how I expected. Heavyweight cotton feels like true streetwear.',
    productTitle: 'Solar Flare Yellow Tee',
    verifiedPurchase: true,
  },
  {
    name: 'Ishita Patel',
    rating: 5,
    quote: 'The COD checkout made it easy to place the order quickly. Arrived in 3 days with neat branded packaging.',
    productTitle: 'Signature Kyoto Dragon Tee',
    verifiedPurchase: true,
  },
  {
    name: 'Kabir Verma',
    rating: 5,
    quote: 'Loved the oversized tee and the material feels premium. Washed twice inside out and colors remained vivid.',
    productTitle: 'Neon Cyberpunk Street Tee',
    verifiedPurchase: true,
  },
  {
    name: 'Rohan Deshmukh',
    rating: 5,
    quote: 'Ordered the custom printed tees for our startup team. DTG print resolution is razor sharp!',
    productTitle: 'Custom Print Tee',
    verifiedPurchase: true,
  },
];

// --- CONTACT & INQUIRIES ---

router.post('/contact', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || 'Bulk Custom Quote').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const referenceId = `RE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const inquiry = await Inquiry.create({
      referenceId,
      name,
      email,
      phone,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      referenceId: inquiry.referenceId,
      message: 'Inquiry received successfully! We will get in touch shortly.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/inquiries', requireAuth, requireRole(['admin', 'catalog_manager']), async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, inquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- REVIEWS ---

router.get('/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};
    let reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();

    // If no reviews exist yet, seed initial verified reviews
    if (reviews.length === 0 && !productId) {
      await Review.insertMany(INITIAL_SEED_REVIEWS);
      reviews = await Review.find().sort({ createdAt: -1 }).lean();
    }

    return res.json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reviews', optionalAuth, async (req, res) => {
  try {
    const name = String(req.body?.name || req.user?.name || '').trim();
    const rating = Number(req.body?.rating) || 5;
    const quote = String(req.body?.quote || req.body?.comment || '').trim();
    const productId = req.body?.productId || null;
    const productTitle = String(req.body?.productTitle || '').trim();

    if (!name || !quote) {
      return res.status(400).json({ success: false, message: 'Name and review text are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    const review = await Review.create({
      name,
      rating,
      quote,
      productId,
      productTitle,
      verifiedPurchase: Boolean(req.user),
    });

    return res.status(201).json({ success: true, review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
