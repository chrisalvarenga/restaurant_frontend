const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireRoles } = require('../middleware/auth');
const { sanitizeText, sanitizeMultilineText, parseNonNegativeNumber } = require('../lib/validation');

function serializeMenuItem(item) {
  return {
    ...item,
    price: Number(item.price),
  };
}

router.get('/', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        businessId: req.businessId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(serializeMenuItem));
  } catch (error) {
    console.error('Error listando menu:', error);
    res.status(500).json({ error: 'No se pudo listar el menu' });
  }
});

router.post('/', requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const parsedName = sanitizeText(name, 120);
    const parsedCategory = sanitizeText(category, 80);
    if (!parsedName || price === undefined || !parsedCategory) {
      return res.status(400).json({ error: 'name, price y category son requeridos' });
    }

    const parsedPrice = parseNonNegativeNumber(price);
    if (parsedPrice === null) {
      return res.status(400).json({ error: 'price debe ser un numero valido mayor o igual a 0' });
    }

    const item = await prisma.menuItem.create({
      data: {
        businessId: req.businessId,
        name: parsedName,
        description: sanitizeMultilineText(description, 280),
        price: parsedPrice,
        category: parsedCategory,
        available: true,
        createdById: req.user.id,
        updatedById: req.user.id,
      },
    });

    res.status(201).json(serializeMenuItem(item));
  } catch (error) {
    console.error('Error creando item de menu:', error);
    res.status(500).json({ error: 'No se pudo crear el item del menu' });
  }
});

router.put('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const existing = await prisma.menuItem.findFirst({
      where: {
        id: req.params.id,
        businessId: req.businessId,
        deletedAt: null,
      },
    });
    if (!existing) return res.status(404).json({ error: 'Item no encontrado' });

    const data = {};
    const { name, description, price, category, available } = req.body;

    if (name !== undefined) data.name = sanitizeText(name, 120);
    if (description !== undefined) data.description = sanitizeMultilineText(description, 280);
    if (category !== undefined) data.category = sanitizeText(category, 80);
    if (available !== undefined) data.available = Boolean(available);

    if (price !== undefined) {
      const parsedPrice = parseNonNegativeNumber(price);
      if (parsedPrice === null) {
        return res.status(400).json({ error: 'price debe ser un numero valido mayor o igual a 0' });
      }
      data.price = parsedPrice;
    }

    data.updatedById = req.user.id;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data,
    });

    res.json(serializeMenuItem(item));
  } catch (error) {
    console.error('Error actualizando item de menu:', error);
    res.status(500).json({ error: 'No se pudo actualizar el item del menu' });
  }
});

router.delete('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const existing = await prisma.menuItem.findFirst({
      where: {
        id: req.params.id,
        businessId: req.businessId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Item no encontrado' });

    await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        deletedById: req.user.id,
        updatedById: req.user.id,
      },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando item de menu:', error);
    res.status(500).json({ error: 'No se pudo eliminar el item del menu' });
  }
});

module.exports = router;
