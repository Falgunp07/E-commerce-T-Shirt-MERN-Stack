import dotenv from 'dotenv';
dotenv.config();

export const port = process.env.PORT || 5000;
export const jwtSecret = process.env.JWT_SECRET || 'threadlab-development-secret';
export const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tshirt-ecommerce';
