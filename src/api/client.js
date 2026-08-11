const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
export const SOCKET_BASE_URL =
  (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')).replace(/\/+$/, '');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Una sola sesión de staff activa por dispositivo — coincide con el uso real
// (una tablet, una persona logueada a la vez). Ver SessionContext.
function authHeaders() {
  const token = localStorage.getItem('staffToken');
  return {
    ...JSON_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.status === 204 ? null : res.json();
}

// ─── Sesión ─────────────────────────────────────────────────────────────────
export const getMe = () => request('/session/me', { headers: authHeaders() });

export const superAdminLogin = (email, password) =>
  request('/super-admin/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });

// ─── Cuentas de staff con PIN (mesero / cocinero / admin) ──────────────────
// Mismo contrato en las 3: lista pública, login, y CRUD (gateado por rol en
// el backend — ver routes/*.js + lib/staffAuth.js).
function createStaffClient(basePath) {
  return {
    getPublic: () => request(`${basePath}/public`),
    login: (userId, pin) =>
      request(`${basePath}/login`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ userId, pin }),
      }),
    list: () => request(basePath, { headers: authHeaders() }),
    create: (data) => request(basePath, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`${basePath}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  };
}

export const waitersClient = createStaffClient('/staff/waiters');
export const cooksClient = createStaffClient('/staff/cooks');
export const adminsClient = createStaffClient('/staff/admins');

// ─── Menú ──────────────────────────────────────────────────────────────────
export const getMenu = () => request('/menu');

export const createMenuItem = (item) =>
  request('/menu', { method: 'POST', headers: authHeaders(), body: JSON.stringify(item) });

export const updateMenuItem = (id, item) =>
  request(`/menu/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(item) });

export const deleteMenuItem = (id) =>
  request(`/menu/${id}`, { method: 'DELETE', headers: authHeaders() });

// ─── Pedidos ────────────────────────────────────────────────────────────────
export const createOrder = (order) =>
  request('/orders', { method: 'POST', headers: authHeaders(), body: JSON.stringify(order) });

export const getMyOrders = () => request('/orders?mine=1', { headers: authHeaders() });

export const getKitchenOrders = () => request('/orders', { headers: authHeaders() });

export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) });

// ─── Mesas ─────────────────────────────────────────────────────────────────
export const getTables = () => request('/tables', { headers: authHeaders() });

export const updateTableStatus = (id, status) =>
  request(`/tables/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) });

export const getTableBill = (id) => request(`/tables/${id}/bill`, { headers: authHeaders() });

export const checkoutTable = (id, payload) =>
  request(`/tables/${id}/checkout`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });

export const createTable = (table) =>
  request('/tables', { method: 'POST', headers: authHeaders(), body: JSON.stringify(table) });

export const updateTable = (id, table) =>
  request(`/tables/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(table) });

export const deleteTable = (id) => request(`/tables/${id}`, { method: 'DELETE', headers: authHeaders() });
