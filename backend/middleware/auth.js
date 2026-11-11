import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/constants.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please sign in to continue' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Account not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
}

export async function optionalAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.userId);
      if (user) req.user = user;
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
    }
    next();
  };
}
