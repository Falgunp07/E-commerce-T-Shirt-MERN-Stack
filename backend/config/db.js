import mongoose from 'mongoose';
import { mongoUri } from './constants.js';

let cachedConnection = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    cachedConnection = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then((m) => {
      console.log('Connected to MongoDB');
      return m.connection;
    });
    return await cachedConnection;
  } catch (err) {
    cachedConnection = null;
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
