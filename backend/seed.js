import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/Product.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tshirt-ecommerce';

const products = [
  {
    title: 'Midnight Manga Oversized Tee',
    price: 1299,
    category: 'T-Shirts',
    color: 'Black',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975919074-6c3b1a4c9a1b?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Soft cotton oversized tee with a bold manga-inspired front print and relaxed everyday fit.',
  },
  {
    title: 'Neon Couple Print Set',
    price: 2199,
    category: 'T-Shirts',
    color: 'Neon Green',
    img: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Matching couple set with neon accent graphics for gifting, photos, and casual outings.',
  },
  {
    title: 'Street Script Tee',
    price: 2399,
    category: 'T-Shirts',
    color: 'White',
    img: 'https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Heavyweight tee with a soft feel and a clean script-style streetwear look.',
  },
  {
    title: 'Graphite Logo Tee',
    price: 999,
    category: 'T-Shirts',
    color: 'Grey',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Minimal logo tee with a clean finish for everyday styling and brand-ready custom prints.',
  },
  {
    title: 'Pastel Panel Oversized Tee',
    price: 1199,
    category: 'T-Shirts',
    color: 'Pink',
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Relaxed oversized tee with soft pastel panels and a street-pop colorway.',
  },
  {
    title: 'Monochrome Essentials Tee',
    price: 2499,
    category: 'T-Shirts',
    color: 'Black',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Solid-color tee designed for layering, lounging, and clean everyday wear.',
  },
  {
    title: 'Sketchline Crop Tee',
    price: 899,
    category: 'T-Shirts',
    color: 'Lavender',
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342452485-86ff0a0d0f9f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Shorter fit tee with a hand-drawn sketch style that works well with high-rise bottoms.',
  },
  {
    title: 'Weekend Wash T-Shirt',
    price: 1099,
    category: 'T-Shirts',
    color: 'Blue',
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Soft tee with a vintage wash and a laid-back fit for daily rotation.',
  },
  {
    title: 'Campus Crew Tee',
    price: 2299,
    category: 'T-Shirts',
    color: 'Maroon',
    img: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'A college favorite tee with an easy-fit silhouette and bold campus energy.',
  },
  {
    title: 'Bold Ink Statement Tee',
    price: 1349,
    category: 'T-Shirts',
    color: 'Red',
    img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Statement graphic tee with a crisp front print and premium cotton feel.',
  },
  {
    title: 'Retro Tone Tee',
    price: 2599,
    category: 'T-Shirts',
    color: 'Brown',
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Vintage-inspired tee with muted tones and a cozy brushed inner feel.',
  },
  {
    title: 'Heritage Pocket Tee',
    price: 1049,
    category: 'T-Shirts',
    color: 'White',
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Classic pocket tee with a clean chest detail and soft all-day comfort.',
  },
  {
    title: 'Metro Layer Tee',
    price: 2399,
    category: 'T-Shirts',
    color: 'Charcoal',
    img: 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Layer-friendly tee with a clean silhouette and durable construction.',
  },
  {
    title: 'Sunrise Graphic Tee',
    price: 1149,
    category: 'T-Shirts',
    color: 'Yellow',
    img: 'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Bright graphic tee with a fresh color story and soft breathable fabric.',
  },
  {
    title: 'Signature Street Tee',
    price: 2699,
    category: 'T-Shirts',
    color: 'Black',
    img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Premium tee built for streetwear drops with a bold signature finish.',
  },
  {
    title: 'Pop Art Box Tee',
    price: 1399,
    category: 'T-Shirts',
    color: 'Orange',
    img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Boxy tee with pop-art styling and a bold everyday streetwear vibe.',
  },
  {
    title: 'Essential Zip Tee',
    price: 2799,
    category: 'T-Shirts',
    color: 'Navy',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Zip-up tee with easy layering and a polished finish for everyday use.',
  },
  {
    title: 'Coastal Oversized Tee',
    price: 1249,
    category: 'T-Shirts',
    color: 'Sky Blue',
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975919074-6c3b1a4c9a1b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Breathable oversized tee with a relaxed coastal-inspired palette.',
  },
];

async function seed() {
  await mongoose.connect(uri);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});