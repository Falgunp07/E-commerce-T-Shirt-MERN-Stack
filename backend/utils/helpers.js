import AuditLog from '../models/AuditLog.js';
import {
  isValidLabel,
  isValidName,
  isValidPhone,
  isValidAddressText,
  isValidPlace,
  isValidPostalCode,
} from './validators.js';

export function publicUser(user) {
  const addresses = Array.isArray(user.addresses)
    ? user.addresses.map((address, index) => ({
        id: address._id || `${user._id}-address-${index + 1}`,
        label: address.label || 'Home',
        fullName: address.fullName || '',
        phone: address.phone || '',
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        isDefault: Boolean(address.isDefault),
      }))
    : [];

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    addresses,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function normalizeAddresses(addresses = []) {
  const nextAddresses = addresses
    .filter((address) => address && (address.line1 || address.city || address.state || address.postalCode))
    .map((address) => {
      const nextAddress = {
        label: String(address.label || 'Home').trim() || 'Home',
        fullName: String(address.fullName || '').trim(),
        phone: String(address.phone || '').trim(),
        line1: String(address.line1 || '').trim(),
        line2: String(address.line2 || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        postalCode: String(address.postalCode || '').trim(),
        country: String(address.country || 'India').trim() || 'India',
        isDefault: Boolean(address.isDefault),
      };

      if (!isValidLabel(nextAddress.label)) throw new Error('Address label contains invalid characters');
      if (!isValidName(nextAddress.fullName)) throw new Error('Address full name contains invalid characters');
      if (!isValidPhone(nextAddress.phone)) throw new Error('Address phone number must be 10 to 15 digits');
      if (!isValidAddressText(nextAddress.line1)) throw new Error('Address line 1 contains invalid characters');
      if (nextAddress.line2 && !isValidAddressText(nextAddress.line2)) throw new Error('Address line 2 contains invalid characters');
      if (!isValidPlace(nextAddress.city)) throw new Error('City contains invalid characters');
      if (!isValidPlace(nextAddress.state)) throw new Error('State contains invalid characters');
      if (!isValidPostalCode(nextAddress.postalCode)) throw new Error('Postal code must be 4 to 10 digits');
      if (!isValidPlace(nextAddress.country)) throw new Error('Country contains invalid characters');

      return nextAddress;
    });

  if (!nextAddresses.length) return [];
  if (!nextAddresses.some((address) => address.isDefault)) {
    nextAddresses[0].isDefault = true;
  } else {
    let foundDefault = false;
    nextAddresses.forEach((address) => {
      if (address.isDefault && !foundDefault) foundDefault = true;
      else address.isDefault = false;
    });
  }
  return nextAddresses;
}

export function formatAddress(address = {}) {
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

export function normalizeProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const fallbackVariant =
    variants.length > 0
      ? variants
      : [
          {
            sku: `TL-${String(product._id).slice(-6).toUpperCase()}`,
            size: 'M',
            color: product.color || 'Black',
            stock: 10,
            safetyThreshold: 5,
            costPrice: Math.max(0, Math.round((product.price || 0) * 0.55)),
            mrp: product.price || 0,
            price: product.price || 0,
            images: product.images?.length ? product.images : product.img ? [product.img] : [],
          },
        ];

  return {
    ...product,
    subCategory: product.subCategory || '',
    taxSlab: product.taxSlab ?? 12,
    variants: fallbackVariant,
    images: product.images?.length ? product.images : product.img ? [product.img] : [],
    img: product.img || product.images?.[0] || '',
  };
}

export function calculateCouponDiscount(coupon, total) {
  if (!coupon) return 0;
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (Number(total) * Number(coupon.discountValue)) / 100;
  } else {
    discountAmount = Number(coupon.discountValue);
  }
  if (coupon.maxDiscountLimit) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountLimit));
  }
  return Math.max(0, Math.round(discountAmount));
}

export async function writeAuditLog(req, action, payload = {}) {
  if (!req.user) return;
  try {
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action,
      clientIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      payload,
    });
  } catch {
    // Non-blocking log failures should not break admin actions.
  }
}
