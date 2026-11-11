import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/constants.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser, normalizeAddresses } from '../utils/helpers.js';
import { isValidEmail, isValidName, isValidPhone } from '../utils/validators.js';

const router = express.Router();

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

router.put('/profile', requireAuth, async (req, res) => {
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

router.put('/password', requireAuth, async (req, res) => {
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

export default router;
