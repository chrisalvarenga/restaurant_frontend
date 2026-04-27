require('dotenv').config();

const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { getDefaultBusinessId } = require('../src/lib/business');

async function main() {
  const email = String(process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const name = String(process.env.SUPER_ADMIN_NAME || 'Super Admin').trim();
  const password = String(process.env.SUPER_ADMIN_PASSWORD || '');

  if (!email) {
    throw new Error('SUPER_ADMIN_EMAIL es requerido para crear el super admin');
  }

  if (!password) {
    throw new Error('SUPER_ADMIN_PASSWORD es requerido para crear el super admin');
  }

  const businessId = await getDefaultBusinessId();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: {
      businessId_email: {
        businessId,
        email,
      },
    },
    update: {
      name,
      role: 'SUPER_ADMIN',
      active: true,
      passwordHash,
    },
    create: {
      businessId,
      name,
      email,
      role: 'SUPER_ADMIN',
      active: true,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`Super admin listo: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error('Error creando super admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });