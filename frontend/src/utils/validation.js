const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
const PHONE_RE = /^\d{10,15}$/;
const ADDRESS_RE = /^[A-Za-z0-9\s,./#()\-]{3,120}$/;
const LABEL_RE = /^[A-Za-z][A-Za-z\s-]{1,24}$/;
const PLACE_RE = /^[A-Za-z][A-Za-z\s.-]{1,39}$/;
const POSTAL_RE = /^\d{4,10}$/;

export function validateEmail(value) {
  if (!String(value || '').trim()) return 'Email is required';
  if (!EMAIL_RE.test(String(value).trim())) return 'Enter a valid email address';
  return '';
}

export function validateName(value, label = 'Name') {
  if (!String(value || '').trim()) return `${label} is required`;
  if (!NAME_RE.test(String(value).trim())) return `${label} can contain only letters, spaces, apostrophes, periods, and hyphens`;
  return '';
}

export function validatePhone(value, label = 'Phone number') {
  if (!String(value || '').trim()) return `${label} is required`;
  if (!PHONE_RE.test(String(value).trim())) return `${label} must be 10 to 15 digits`;
  return '';
}

export function validatePassword(value, label = 'Password') {
  if (!String(value || '')) return `${label} is required`;
  if (String(value).length < 6) return `${label} must be at least 6 characters`;
  if (/[`]/.test(String(value))) return `${label} contains invalid characters`;
  return '';
}

export function validateAddressText(value, label) {
  if (!String(value || '').trim()) return `${label} is required`;
  if (!ADDRESS_RE.test(String(value).trim())) return `${label} contains invalid characters`;
  return '';
}

export function validateOptionalAddressText(value, label) {
  if (!String(value || '').trim()) return '';
  if (!ADDRESS_RE.test(String(value).trim())) return `${label} contains invalid characters`;
  return '';
}

export function validateLabel(value) {
  if (!String(value || '').trim()) return 'Label is required';
  if (!LABEL_RE.test(String(value).trim())) return 'Label can contain only letters, spaces, and hyphens';
  return '';
}

export function validatePlace(value, label) {
  if (!String(value || '').trim()) return `${label} is required`;
  if (!PLACE_RE.test(String(value).trim())) return `${label} can contain only letters, spaces, periods, and hyphens`;
  return '';
}

export function validatePostalCode(value) {
  if (!String(value || '').trim()) return 'Postal code is required';
  if (!POSTAL_RE.test(String(value).trim())) return 'Postal code must be 4 to 10 digits';
  return '';
}

export function validateAddress(address) {
  return {
    label: validateLabel(address.label),
    fullName: validateName(address.fullName, 'Full name'),
    phone: validatePhone(address.phone),
    line1: validateAddressText(address.line1, 'Address line 1'),
    line2: validateOptionalAddressText(address.line2, 'Address line 2'),
    city: validatePlace(address.city, 'City'),
    state: validatePlace(address.state, 'State'),
    postalCode: validatePostalCode(address.postalCode),
    country: validatePlace(address.country, 'Country'),
  };
}
