const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { getDefaultBusinessId } = require('../lib/business');
const { issueAuthToken, verifyAuthToken } = require('../middleware/auth');

const pinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
});

function safePinEquals(inputPin, expectedPin) {
  const a = Buffer.from(String(inputPin || ''));
  const b = Buffer.from(String(expectedPin || ''));
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

function isValidToken(token, expectedScope) {
  const decoded = verifyAuthToken(token);
  if (!decoded) return false;
  return decoded.scope === expectedScope;
}

/**
 * POST /api/admin/validate-pin
 * Body: { pin: string }
 */
router.post('/validate-pin', pinRateLimit, async (req, res) => {
  try {
    const businessId = await getDefaultBusinessId();
    const { pin } = req.body;
    if (!pin || pin.trim() === '') {
      return res.status(400).json({ success: false, error: 'PIN requerido' });
    }

    const correctPin = String(process.env.ADMIN_PIN || '').trim();
    if (!correctPin) {
      return res.status(503).json({ success: false, error: 'PIN de administracion no configurado' });
    }

    if (!safePinEquals(pin, correctPin)) {
      return res.status(401).json({ success: false, error: 'PIN incorrecto' });
    }

    const token = issueAuthToken({
      businessId,
      scope: 'admin',
      role: 'ADMIN',
      email: 'admin.pin@local.test',
      name: 'Admin PIN',
    });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error validando PIN admin:', error);
    res.status(500).json({ success: false, error: 'No se pudo validar el PIN' });
  }
});

/**
 * GET /api/admin/verify-token
 * Query: { token: string }
 */
router.get('/verify-token', (req, res) => {
  const { token } = req.query;
  if (!token) return res.json({ valid: false });
  res.json({ valid: isValidToken(token, 'admin') });
});

/**
 * POST /api/kitchen/validate-pin
 * Body: { pin: string }
 */
router.post('/kitchen/validate-pin', pinRateLimit, async (req, res) => {
  try {
    const businessId = await getDefaultBusinessId();
    const { pin } = req.body;
    if (!pin || pin.trim() === '') {
      return res.status(400).json({ success: false, error: 'PIN requerido' });
    }

    const correctPin = String(process.env.KITCHEN_PIN || '').trim();
    if (!correctPin) {
      return res.status(503).json({ success: false, error: 'PIN de cocina no configurado' });
    }

    if (!safePinEquals(pin, correctPin)) {
      return res.status(401).json({ success: false, error: 'PIN incorrecto' });
    }

    const token = issueAuthToken({
      businessId,
      scope: 'kitchen',
      role: 'AGENT',
      email: 'kitchen.pin@local.test',
      name: 'Kitchen PIN',
    });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error validando PIN cocina:', error);
    res.status(500).json({ success: false, error: 'No se pudo validar el PIN' });
  }
});

/**
 * GET /api/kitchen/verify-token
 * Query: { token: string }
 */
router.get('/kitchen/verify-token', (req, res) => {
  const { token } = req.query;
  if (!token) return res.json({ valid: false });
  res.json({ valid: isValidToken(token, 'kitchen') });
});

module.exports = router;
