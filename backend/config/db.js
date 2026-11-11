import mongoose from 'mongoose';
import { mongoUri } from './constants.js';

export async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}
