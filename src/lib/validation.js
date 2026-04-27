function sanitizeText(value, maxLength = 120) {
  const text = String(value || '').trim().replace(/[<>]/g, '');
  if (!text) return '';
  return text.slice(0, maxLength);
}

function sanitizeMultilineText(value, maxLength = 500) {
  const text = String(value || '').trim().replace(/[<>]/g, '');
  if (!text) return '';
  return text.slice(0, maxLength);
}

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonNegativeNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

module.exports = {
  sanitizeText,
  sanitizeMultilineText,
  parsePositiveInt,
  parseNonNegativeNumber,
};