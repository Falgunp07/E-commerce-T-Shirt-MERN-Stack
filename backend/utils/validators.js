const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
const PHONE_RE = /^\d{10,15}$/;
const ADDRESS_RE = /^[A-Za-z0-9\s,./#()\-]{3,120}$/;
const LABEL_RE = /^[A-Za-z][A-Za-z\s-]{1,24}$/;
const PLACE_RE = /^[A-Za-z][A-Za-z\s.-]{1,39}$/;
const POSTAL_RE = /^\d{4,10}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

export function isValidName(value) {
  return NAME_RE.test(String(value || '').trim());
}

export function isValidPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

export function isValidAddressText(value) {
  return ADDRESS_RE.test(String(value || '').trim());
}

export function isValidLabel(value) {
  return LABEL_RE.test(String(value || '').trim());
}

export function isValidPlace(value) {
  return PLACE_RE.test(String(value || '').trim());
}

export function isValidPostalCode(value) {
  return POSTAL_RE.test(String(value || '').trim());
}
