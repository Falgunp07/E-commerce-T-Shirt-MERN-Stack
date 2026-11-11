import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Product from './models/Product.js';
import User from './models/User.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';
import CMSConfig from './models/CMS.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tshirt-ecommerce';

const demoProducts = [
  {
    title: 'Midnight Manga Oversized Tee',
    price: 1299,
    category: 'T-Shirts',
    subCategory: 'Anime',
    color: 'Black',
    taxSlab: 12,
    isFlashSale: true,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975919074-6c3b1a4c9a1b?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Soft 240 GSM combed cotton oversized tee with bold manga aesthetics, dropped shoulders, and ultra-durable screen print.',
    variants: [
      { sku: 'TL-MMO-BLK-S', size: 'S', color: 'Black', stock: 15, safetyThreshold: 5, costPrice: 520, mrp: 1999, price: 1299, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-MMO-BLK-M', size: 'M', color: 'Black', stock: 25, safetyThreshold: 5, costPrice: 520, mrp: 1999, price: 1299, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-MMO-BLK-L', size: 'L', color: 'Black', stock: 20, safetyThreshold: 5, costPrice: 520, mrp: 1999, price: 1299, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-MMO-BLK-XL', size: 'XL', color: 'Black', stock: 12, safetyThreshold: 5, costPrice: 520, mrp: 1999, price: 1299, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Neon Cyberpunk Street Tee',
    price: 1499,
    category: 'T-Shirts',
    subCategory: 'Streetwear',
    color: 'Neon Green',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Electric neon streetwear tee crafted with high-density pigment prints and bio-washed heavyweight fabric.',
    variants: [
      { sku: 'TL-NCS-GRN-S', size: 'S', color: 'Neon Green', stock: 8, safetyThreshold: 5, costPrice: 600, mrp: 2199, price: 1499, images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-NCS-GRN-M', size: 'M', color: 'Neon Green', stock: 18, safetyThreshold: 5, costPrice: 600, mrp: 2199, price: 1499, images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-NCS-GRN-L', size: 'L', color: 'Neon Green', stock: 14, safetyThreshold: 5, costPrice: 600, mrp: 2199, price: 1499, images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-NCS-GRN-XL', size: 'XL', color: 'Neon Green', stock: 4, safetyThreshold: 5, costPrice: 600, mrp: 2199, price: 1499, images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Street Script Heavyweight Tee',
    price: 1399,
    category: 'T-Shirts',
    subCategory: 'Streetwear',
    color: 'White',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Heavyweight 260 GSM French terry tee featuring minimal cursive street typography and rib-knit crewneck.',
    variants: [
      { sku: 'TL-SSH-WHT-S', size: 'S', color: 'White', stock: 20, safetyThreshold: 5, costPrice: 550, mrp: 2399, price: 1399, images: ['https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SSH-WHT-M', size: 'M', color: 'White', stock: 30, safetyThreshold: 5, costPrice: 550, mrp: 2399, price: 1399, images: ['https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SSH-WHT-L', size: 'L', color: 'White', stock: 22, safetyThreshold: 5, costPrice: 550, mrp: 2399, price: 1399, images: ['https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Graphite Minimalist Box Tee',
    price: 999,
    category: 'T-Shirts',
    subCategory: 'Minimalist',
    color: 'Grey',
    taxSlab: 12,
    isFlashSale: true,
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Clean monochrome aesthetic with architectural box fit and breathable organic cotton texture.',
    variants: [
      { sku: 'TL-GMB-GRY-M', size: 'M', color: 'Grey', stock: 25, safetyThreshold: 5, costPrice: 400, mrp: 1499, price: 999, images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-GMB-GRY-L', size: 'L', color: 'Grey', stock: 15, safetyThreshold: 5, costPrice: 400, mrp: 1499, price: 999, images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Pastel Panel Drop-Shoulder Tee',
    price: 1199,
    category: 'T-Shirts',
    subCategory: 'Oversized',
    color: 'Pink',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Subtle pastel pink tone crafted with twin-needle stitching and an ultra-relaxed drop shoulder drape.',
    variants: [
      { sku: 'TL-PPD-PNK-S', size: 'S', color: 'Pink', stock: 12, safetyThreshold: 5, costPrice: 480, mrp: 1899, price: 1199, images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-PPD-PNK-M', size: 'M', color: 'Pink', stock: 20, safetyThreshold: 5, costPrice: 480, mrp: 1899, price: 1199, images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-PPD-PNK-L', size: 'L', color: 'Pink', stock: 14, safetyThreshold: 5, costPrice: 480, mrp: 1899, price: 1199, images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Monochrome Stealth Oversized Tee',
    price: 1599,
    category: 'T-Shirts',
    subCategory: 'Oversized',
    color: 'Black',
    taxSlab: 12,
    isFlashSale: true,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Black-on-black matte silicone chest graphic, 280 GSM luxury heavyweight jersey with pre-shrunk finish.',
    variants: [
      { sku: 'TL-MSO-BLK-M', size: 'M', color: 'Black', stock: 35, safetyThreshold: 8, costPrice: 650, mrp: 2499, price: 1599, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-MSO-BLK-L', size: 'L', color: 'Black', stock: 28, safetyThreshold: 8, costPrice: 650, mrp: 2499, price: 1599, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-MSO-BLK-XL', size: 'XL', color: 'Black', stock: 15, safetyThreshold: 5, costPrice: 650, mrp: 2499, price: 1599, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Vintage Fade Indigo Tee',
    price: 1099,
    category: 'T-Shirts',
    subCategory: 'Vintage',
    color: 'Blue',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Mineral wash vintage fade effect with individual dye wash patterning and distressed hem accents.',
    variants: [
      { sku: 'TL-VFI-BLU-S', size: 'S', color: 'Blue', stock: 10, safetyThreshold: 5, costPrice: 450, mrp: 1699, price: 1099, images: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-VFI-BLU-M', size: 'M', color: 'Blue', stock: 22, safetyThreshold: 5, costPrice: 450, mrp: 1699, price: 1099, images: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-VFI-BLU-L', size: 'L', color: 'Blue', stock: 16, safetyThreshold: 5, costPrice: 450, mrp: 1699, price: 1099, images: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Crimson Graphic Edge Tee',
    price: 1349,
    category: 'T-Shirts',
    subCategory: 'Graphic Tees',
    color: 'Red',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Intense crimson red dye with striking back typography print and soft silicon wash finish.',
    variants: [
      { sku: 'TL-CGE-RED-M', size: 'M', color: 'Red', stock: 19, safetyThreshold: 5, costPrice: 530, mrp: 1999, price: 1349, images: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-CGE-RED-L', size: 'L', color: 'Red', stock: 11, safetyThreshold: 5, costPrice: 530, mrp: 1999, price: 1349, images: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-CGE-RED-XL', size: 'XL', color: 'Red', stock: 6, safetyThreshold: 5, costPrice: 530, mrp: 1999, price: 1349, images: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Earth Tones Raw Neck Tee',
    price: 1149,
    category: 'T-Shirts',
    subCategory: 'Vintage',
    color: 'Brown',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Raw-cut edge neckline, earthen mocha tint, tailored for easy styling under flannel overshirts.',
    variants: [
      { sku: 'TL-ETR-BRN-S', size: 'S', color: 'Brown', stock: 14, safetyThreshold: 5, costPrice: 460, mrp: 1799, price: 1149, images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-ETR-BRN-M', size: 'M', color: 'Brown', stock: 24, safetyThreshold: 5, costPrice: 460, mrp: 1799, price: 1149, images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-ETR-BRN-L', size: 'L', color: 'Brown', stock: 18, safetyThreshold: 5, costPrice: 460, mrp: 1799, price: 1149, images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Solar Flare Yellow Tee',
    price: 1149,
    category: 'T-Shirts',
    subCategory: 'Graphic Tees',
    color: 'Yellow',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Vibrant sunshine yellow tee featuring bold mid-century pop artwork and breathable combed cotton.',
    variants: [
      { sku: 'TL-SFY-YEL-M', size: 'M', color: 'Yellow', stock: 20, safetyThreshold: 5, costPrice: 460, mrp: 1699, price: 1149, images: ['https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SFY-YEL-L', size: 'L', color: 'Yellow', stock: 15, safetyThreshold: 5, costPrice: 460, mrp: 1699, price: 1149, images: ['https://images.unsplash.com/photo-1520975681919-3c9d4b3f8c3a?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Signature Kyoto Dragon Tee',
    price: 1699,
    category: 'T-Shirts',
    subCategory: 'Anime',
    color: 'Black',
    taxSlab: 12,
    isFlashSale: true,
    img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Exquisite multi-color Japanese dragon illustration screen printed with metallic gold accents.',
    variants: [
      { sku: 'TL-SKD-BLK-S', size: 'S', color: 'Black', stock: 10, safetyThreshold: 5, costPrice: 680, mrp: 2699, price: 1699, images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SKD-BLK-M', size: 'M', color: 'Black', stock: 26, safetyThreshold: 5, costPrice: 680, mrp: 2699, price: 1699, images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SKD-BLK-L', size: 'L', color: 'Black', stock: 22, safetyThreshold: 5, costPrice: 680, mrp: 2699, price: 1699, images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-SKD-BLK-XL', size: 'XL', color: 'Black', stock: 12, safetyThreshold: 5, costPrice: 680, mrp: 2699, price: 1699, images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
  {
    title: 'Azure Coast Relaxed Tee',
    price: 1249,
    category: 'T-Shirts',
    subCategory: 'Oversized',
    color: 'Sky Blue',
    taxSlab: 12,
    isFlashSale: false,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975919074-6c3b1a4c9a1b?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Refreshing coastal sky blue oversized cut with anti-pilling bio-polish treatment.',
    variants: [
      { sku: 'TL-ACR-BLU-S', size: 'S', color: 'Sky Blue', stock: 14, safetyThreshold: 5, costPrice: 500, mrp: 1899, price: 1249, images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-ACR-BLU-M', size: 'M', color: 'Sky Blue', stock: 24, safetyThreshold: 5, costPrice: 500, mrp: 1899, price: 1249, images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'] },
      { sku: 'TL-ACR-BLU-L', size: 'L', color: 'Sky Blue', stock: 18, safetyThreshold: 5, costPrice: 500, mrp: 1899, price: 1249, images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'] },
    ],
  },
];

async function seed() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding...');

  // 1. Seed Products
  await Product.deleteMany({});
  const insertedProducts = await Product.insertMany(demoProducts);
  console.log(`Successfully seeded ${insertedProducts.length} rich products with variants.`);

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const usersToSeed = [
    {
      name: 'Root Admin',
      email: 'admin@threadlab.com',
      password: passwordHash,
      role: 'admin',
      phone: '9876543210',
      addresses: [
        {
          label: 'HQ',
          fullName: 'ThreadLab HQ Admin',
          phone: '9876543210',
          line1: '402 Innovation Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          isDefault: true,
        },
      ],
    },
    {
      name: 'Logistics Head',
      email: 'logistics@threadlab.com',
      password: passwordHash,
      role: 'logistics_manager',
      phone: '9876543211',
      addresses: [],
    },
    {
      name: 'Catalog Manager',
      email: 'catalog@threadlab.com',
      password: passwordHash,
      role: 'catalog_manager',
      phone: '9876543212',
      addresses: [],
    },
    {
      name: 'Falgun Patel',
      email: 'user@gmail.com',
      password: userPasswordHash,
      role: 'customer',
      phone: '9988776655',
      addresses: [
        {
          label: 'Home',
          fullName: 'Falgun Patel',
          phone: '9988776655',
          line1: 'B-404 Skyline Towers, Satellite',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '380015',
          country: 'India',
          isDefault: true,
        },
      ],
    },
    {
      name: 'James Miller',
      email: 'james.miller@gmail.com',
      password: userPasswordHash,
      role: 'customer',
      phone: '9820012345',
      addresses: [
        {
          label: 'Apartment',
          fullName: 'James Miller',
          phone: '9820012345',
          line1: '12 Greenview Enclave, Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true,
        },
      ],
    },
  ];

  await User.deleteMany({});
  const insertedUsers = await User.insertMany(usersToSeed);
  console.log(`Successfully seeded ${insertedUsers.length} system and demo users.`);

  const adminUser = insertedUsers.find((u) => u.role === 'admin');
  const demoCustomer = insertedUsers.find((u) => u.email === 'user@gmail.com');
  const demoCustomer2 = insertedUsers.find((u) => u.email === 'james.miller@gmail.com');

  // 3. Seed Coupons
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  const couponsToSeed = [
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minimumCartValue: 799,
      maxDiscountLimit: 300,
      perUserLimit: 1,
      activeFrom: now,
      activeTo: nextYear,
      isActive: true,
    },
    {
      code: 'FLAT200',
      discountType: 'flat',
      discountValue: 200,
      minimumCartValue: 1499,
      maxDiscountLimit: 200,
      perUserLimit: 2,
      activeFrom: now,
      activeTo: nextYear,
      isActive: true,
    },
    {
      code: 'FLASH50',
      discountType: 'percentage',
      discountValue: 20,
      minimumCartValue: 1999,
      maxDiscountLimit: 500,
      perUserLimit: 1,
      activeFrom: now,
      activeTo: nextYear,
      isActive: true,
    },
  ];

  await Coupon.deleteMany({});
  const insertedCoupons = await Coupon.insertMany(couponsToSeed);
  console.log(`Successfully seeded ${insertedCoupons.length} promotional coupons.`);

  // 4. Seed CMS Configurations
  await CMSConfig.deleteMany({});
  await CMSConfig.create({
    key: 'home_banners',
    banners: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '/shop',
        isActive: true,
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '/custom-print',
        isActive: true,
      },
    ],
  });

  await CMSConfig.create({
    key: 'bento_grid_priority',
    bentoGridOrder: insertedProducts.slice(0, 6).map((p) => String(p._id)),
  });
  console.log('Successfully seeded CMS configuration and banners.');

  // 5. Seed Realistic Orders
  const prod1 = insertedProducts[0];
  const prod2 = insertedProducts[1];
  const prod3 = insertedProducts[2];
  const prod4 = insertedProducts[3];

  const ordersToSeed = [
    {
      userId: demoCustomer._id,
      customer: {
        name: demoCustomer.name,
        email: demoCustomer.email,
        phone: demoCustomer.phone,
        address: 'B-404 Skyline Towers, Satellite, Ahmedabad, Gujarat 380015',
      },
      cart: [
        {
          id: String(prod1._id),
          title: prod1.title,
          price: prod1.price,
          qty: 1,
          size: 'L',
          color: prod1.color,
          img: prod1.img,
        },
        {
          id: String(prod2._id),
          title: prod2.title,
          price: prod2.price,
          qty: 1,
          size: 'M',
          color: prod2.color,
          img: prod2.img,
        },
      ],
      amount: 2518,
      baseAmount: 2248,
      taxAmount: 270,
      totalCostBasis: 1120,
      couponUsed: 'WELCOME10',
      couponDiscount: 280,
      paymentMethod: 'COD',
      status: 'delivered',
      awbCode: 'AWB98471201',
      shippingLabelUrl: 'https://threadlab.local/labels/sample-1.pdf',
      rma: { status: 'none', reason: '', qcStatus: 'pending', refundTxnId: '' },
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      userId: demoCustomer._id,
      customer: {
        name: demoCustomer.name,
        email: demoCustomer.email,
        phone: demoCustomer.phone,
        address: 'B-404 Skyline Towers, Satellite, Ahmedabad, Gujarat 380015',
      },
      cart: [
        {
          id: String(prod3._id),
          title: prod3.title,
          price: prod3.price,
          qty: 2,
          size: 'M',
          color: prod3.color,
          img: prod3.img,
        },
      ],
      amount: 2798,
      baseAmount: 2498,
      taxAmount: 300,
      totalCostBasis: 1100,
      couponUsed: '',
      couponDiscount: 0,
      paymentMethod: 'COD',
      status: 'shipped',
      awbCode: 'AWB98471202',
      shippingLabelUrl: 'https://threadlab.local/labels/sample-2.pdf',
      rma: { status: 'none', reason: '', qcStatus: 'pending', refundTxnId: '' },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: demoCustomer2._id,
      customer: {
        name: demoCustomer2.name,
        email: demoCustomer2.email,
        phone: demoCustomer2.phone,
        address: '12 Greenview Enclave, Indiranagar, Bangalore, Karnataka 560038',
      },
      cart: [
        {
          id: String(prod4._id),
          title: prod4.title,
          price: prod4.price,
          qty: 1,
          size: 'M',
          color: prod4.color,
          img: prod4.img,
        },
      ],
      amount: 999,
      baseAmount: 892,
      taxAmount: 107,
      totalCostBasis: 400,
      couponUsed: '',
      couponDiscount: 0,
      paymentMethod: 'COD',
      status: 'manifested',
      awbCode: 'AWB98471203',
      shippingLabelUrl: 'https://threadlab.local/labels/sample-3.pdf',
      rma: { status: 'none', reason: '', qcStatus: 'pending', refundTxnId: '' },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: demoCustomer2._id,
      customer: {
        name: demoCustomer2.name,
        email: demoCustomer2.email,
        phone: demoCustomer2.phone,
        address: '12 Greenview Enclave, Indiranagar, Bangalore, Karnataka 560038',
      },
      cart: [
        {
          id: String(prod1._id),
          title: prod1.title,
          price: prod1.price,
          qty: 1,
          size: 'XL',
          color: prod1.color,
          img: prod1.img,
        },
      ],
      amount: 1099,
      baseAmount: 981,
      taxAmount: 118,
      totalCostBasis: 520,
      couponUsed: 'FLAT200',
      couponDiscount: 200,
      paymentMethod: 'COD',
      status: 'pending',
      awbCode: '',
      shippingLabelUrl: '',
      rma: { status: 'none', reason: '', qcStatus: 'pending', refundTxnId: '' },
      createdAt: new Date(),
    },
    {
      userId: demoCustomer._id,
      customer: {
        name: demoCustomer.name,
        email: demoCustomer.email,
        phone: demoCustomer.phone,
        address: 'B-404 Skyline Towers, Satellite, Ahmedabad, Gujarat 380015',
      },
      cart: [
        {
          id: String(prod2._id),
          title: prod2.title,
          price: prod2.price,
          qty: 1,
          size: 'XL',
          color: prod2.color,
          img: prod2.img,
        },
      ],
      amount: 1499,
      baseAmount: 1338,
      taxAmount: 161,
      totalCostBasis: 600,
      couponUsed: '',
      couponDiscount: 0,
      paymentMethod: 'COD',
      status: 'delivered',
      awbCode: 'AWB98471205',
      shippingLabelUrl: 'https://threadlab.local/labels/sample-5.pdf',
      rma: {
        status: 'return_requested',
        reason: 'Size is slightly looser than expected, requesting exchange or return.',
        qcStatus: 'pending',
        refundTxnId: '',
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  await Order.deleteMany({});
  const insertedOrders = await Order.insertMany(ordersToSeed);
  console.log(`Successfully seeded ${insertedOrders.length} realistic orders across fulfillment workflows.`);

  // 6. Seed Initial Audit Logs
  await AuditLog.deleteMany({});
  await AuditLog.create({
    userId: adminUser._id,
    userName: adminUser.name,
    userRole: adminUser.role,
    action: 'System Database Seeded with Production-grade Demo Data',
    clientIp: '127.0.0.1',
    payload: {
      productsCount: insertedProducts.length,
      usersCount: insertedUsers.length,
      couponsCount: insertedCoupons.length,
      ordersCount: insertedOrders.length,
    },
  });
  console.log('Seeded initial admin audit log.');

  await mongoose.disconnect();
  console.log('Database seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
