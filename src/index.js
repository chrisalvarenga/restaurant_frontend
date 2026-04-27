const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const { resolveRequestUser, verifyAuthToken } = require('./middleware/auth');
const { getDefaultBusinessId } = require('./lib/business');

const requiredSecrets = ['JWT_SECRET', 'ADMIN_PIN', 'KITCHEN_PIN'];
const missingSecrets = requiredSecrets.filter((key) => !String(process.env[key] || '').trim());
if (missingSecrets.length) {
  console.error(`Faltan variables requeridas: ${missingSecrets.join(', ')}`);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: frontendOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use(resolveRequestUser);
app.set('io', io);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'restaurant-backend' });
});

app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

io.use(async (socket, next) => {
  try {
    const businessId = await getDefaultBusinessId();
    const token = socket.handshake.auth?.token;
    const decoded = token ? verifyAuthToken(token) : null;
    if (!decoded || decoded.businessId !== businessId) {
      return next(new Error('No autorizado'));
    }

    if (!['kitchen', 'admin'].includes(decoded.scope)) {
      return next(new Error('Sin permisos para socket'));
    }

    socket.data.auth = decoded;
    next();
  } catch (error) {
    next(new Error('No autorizado'));
  }
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Cliente desconectado: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
