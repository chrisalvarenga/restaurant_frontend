const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireRoles } = require('../middleware/auth');
const {
  sanitizeText,
  sanitizeMultilineText,
  parsePositiveInt,
  parseNonNegativeNumber,
} = require('../lib/validation');

const VALID_STATUSES = ['pendiente', 'preparando', 'listo', 'entregado'];
const STATUS_TO_DB = {
  pendiente: 'PENDING',
  preparando: 'PREPARING',
  listo: 'READY',
  entregado: 'DELIVERED',
};
const DB_TO_STATUS = {
  PENDING: 'pendiente',
  PREPARING: 'preparando',
  READY: 'listo',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
};

function serializeOrder(order) {
  return {
    id: order.id,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      notes: item.notes,
      createdAt: item.createdAt,
    })),
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    notes: order.notes,
    status: DB_TO_STATUS[order.status] || 'pendiente',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get('/', requireRoles(['SUPER_ADMIN', 'ADMIN', 'AGENT']), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        businessId: req.businessId,
        deletedAt: null,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Error listando ordenes:', error);
    res.status(500).json({ error: 'No se pudieron listar las ordenes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { items, tableNumber, customerName, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !tableNumber || !String(customerName || '').trim()) {
      return res.status(400).json({ error: 'items, tableNumber y customerName son requeridos' });
    }

    const parsedTableNumber = parsePositiveInt(tableNumber);
    if (!parsedTableNumber) {
      return res.status(400).json({ error: 'tableNumber debe ser un numero valido mayor a 0' });
    }

    const hasInvalidItem = items.some((item) => {
      const parsedPrice = parseNonNegativeNumber(item?.price);
      const parsedQuantity = parsePositiveInt(item?.quantity);
      return !sanitizeText(item?.name, 120) || parsedPrice === null || parsedQuantity === null;
    });
    if (hasInvalidItem) {
      return res.status(400).json({ error: 'Cada item requiere name, price y quantity validos' });
    }

    const order = await prisma.order.create({
      data: {
        businessId: req.businessId,
        tableNumber: parsedTableNumber,
        customerName: sanitizeText(customerName, 120),
        notes: sanitizeMultilineText(notes, 500),
        status: 'PENDING',
        createdById: req.user?.id || null,
        updatedById: req.user?.id || null,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId || null,
            name: sanitizeText(item.name, 120),
            price: parseNonNegativeNumber(item.price),
            quantity: parsePositiveInt(item.quantity),
            notes: sanitizeMultilineText(item.notes, 300),
          })),
        },
      },
      include: { items: true },
    });

    const serializedOrder = serializeOrder(order);
    req.app.get('io').emit('new-order', serializedOrder);
    res.status(201).json(serializedOrder);
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ error: 'No se pudo crear la orden' });
  }
});

router.put('/:id/status', requireRoles(['SUPER_ADMIN', 'ADMIN', 'AGENT']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        businessId: req.businessId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Orden no encontrada' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: STATUS_TO_DB[status],
        updatedById: req.user?.id || null,
      },
      include: { items: true },
    });

    const serializedOrder = serializeOrder(order);
    req.app.get('io').emit('order-updated', serializedOrder);
    res.json(serializedOrder);
  } catch (error) {
    console.error('Error actualizando estado de orden:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado de la orden' });
  }
});

router.put('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { items, tableNumber, customerName, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !tableNumber || !String(customerName || '').trim()) {
      return res.status(400).json({ error: 'items, tableNumber y customerName son requeridos' });
    }

    const parsedTableNumber = parsePositiveInt(tableNumber);
    if (!parsedTableNumber) {
      return res.status(400).json({ error: 'tableNumber debe ser un numero valido mayor a 0' });
    }

    const hasInvalidItem = items.some((item) => {
      const parsedPrice = parseNonNegativeNumber(item?.price);
      const parsedQuantity = parsePositiveInt(item?.quantity);
      return !sanitizeText(item?.name, 120) || parsedPrice === null || parsedQuantity === null;
    });
    if (hasInvalidItem) {
      return res.status(400).json({ error: 'Cada item requiere name, price y quantity validos' });
    }

    const existing = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        businessId: req.businessId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Orden no encontrada' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        tableNumber: parsedTableNumber,
        customerName: sanitizeText(customerName, 120),
        notes: sanitizeMultilineText(notes, 500),
        updatedById: req.user?.id || null,
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            menuItemId: item.menuItemId || null,
            name: sanitizeText(item.name, 120),
            price: parseNonNegativeNumber(item.price),
            quantity: parsePositiveInt(item.quantity),
            notes: sanitizeMultilineText(item.notes, 300),
          })),
        },
      },
      include: { items: true },
    });

    const serializedOrder = serializeOrder(order);
    req.app.get('io').emit('order-updated', serializedOrder);
    res.json(serializedOrder);
  } catch (error) {
    console.error('Error editando orden:', error);
    res.status(500).json({ error: 'No se pudo editar la orden' });
  }
});

router.delete('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const existing = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        businessId: req.businessId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Orden no encontrada' });

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        deletedById: req.user?.id || null,
        updatedById: req.user?.id || null,
      },
    });

    req.app.get('io').emit('order-deleted', { id: req.params.id });
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando orden:', error);
    res.status(500).json({ error: 'No se pudo eliminar la orden' });
  }
});

module.exports = router;
