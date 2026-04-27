const prisma = require('./prisma');

let cachedBusinessId = null;

async function getDefaultBusinessId() {
  if (cachedBusinessId) return cachedBusinessId;

  const businessName = process.env.DEFAULT_BUSINESS_NAME || 'Negocio Demo';
  const business = await prisma.business.upsert({
    where: { name: businessName },
    update: {},
    create: { name: businessName },
    select: { id: true },
  });

  cachedBusinessId = business.id;
  return cachedBusinessId;
}

module.exports = { getDefaultBusinessId };
