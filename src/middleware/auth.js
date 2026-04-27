const prisma = require('../lib/prisma');
const { getDefaultBusinessId } = require('../lib/business');
const jwt = require('jsonwebtoken');

const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'AGENT']);
const FALLBACK_DEV_JWT_SECRET = 'dev-only-please-change-this-secret';

function normalizeEmail(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function normalizeName(value, fallback) {
  const text = value ? String(value).trim() : '';
  return text || fallback;
}

function roleFromHeader(value) {
  const parsed = String(value || '').trim().toUpperCase();
  if (!VALID_ROLES.has(parsed)) return null;
  return parsed;
}

function getJwtSecret() {
  return String(process.env.JWT_SECRET || FALLBACK_DEV_JWT_SECRET);
}

function extractBearerToken(req) {
  const header = String(req.headers.authorization || '');
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function issueAuthToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

function verifyAuthToken(token) {
  try {
    return jwt.verify(String(token || ''), getJwtSecret());
  } catch {
    return null;
  }
}

async function resolveRequestUser(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  try {
    const businessId = await getDefaultBusinessId();
    req.businessId = businessId;

    const token = extractBearerToken(req);
    const decoded = token ? verifyAuthToken(token) : null;
    if (!decoded || decoded.businessId !== businessId) {
      req.user = null;
      req.auth = null;
      return next();
    }

    const superAdminEmail = normalizeEmail(process.env.SUPER_ADMIN_EMAIL);
    const tokenEmail = normalizeEmail(decoded.email);
    const email = tokenEmail || superAdminEmail || 'unknown@local.test';
    const isSuperAdmin = superAdminEmail && email === superAdminEmail;
    const role = isSuperAdmin ? 'SUPER_ADMIN' : (roleFromHeader(decoded.role) || 'AGENT');

    const user = await prisma.user.upsert({
      where: {
        businessId_email: {
          businessId,
          email,
        },
      },
      update: {
        name: normalizeName(decoded.name, isSuperAdmin ? 'Super Admin' : 'Usuario App'),
        role,
        active: true,
      },
      create: {
        businessId,
        email,
        name: normalizeName(decoded.name, isSuperAdmin ? 'Super Admin' : 'Usuario App'),
        role,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    req.user = user;
    req.auth = {
      scope: decoded.scope || 'app',
      email,
      role,
    };
    next();
  } catch (error) {
    console.error('Error resolviendo usuario de request:', error);
    res.status(500).json({ error: 'No se pudo resolver el usuario de la solicitud' });
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Token invalido o ausente' });
  }
  next();
}

function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }
    next();
  };
}

module.exports = {
  resolveRequestUser,
  requireAuth,
  requireRoles,
  issueAuthToken,
  verifyAuthToken,
};
