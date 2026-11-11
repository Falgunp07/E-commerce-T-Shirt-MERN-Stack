import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { port } from './config/constants.js';

import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure Database is connected for Serverless / Cloud Functions
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection error: ' + err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ThreadLab backend is running',
    timestamp: new Date(),
  });
});

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/products', productRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);

// Start standalone server locally (Vercel automatically exports and manages the app)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err.message);
    });
}

export default app;
