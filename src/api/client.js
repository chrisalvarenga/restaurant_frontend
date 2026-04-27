const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
export const SOCKET_BASE_URL =
  (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')).replace(/\/+$/, '');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function getBearerHeaders(tokenKey) {
  const token = localStorage.getItem(tokenKey);
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

export const getMenu = () => request('/menu');

export const createOrder = (order) =>
  request('/orders', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(order),
  });

export const getOrders = () => request('/orders');

export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, {
    method: 'PUT',
    headers: getBearerHeaders('kitchenToken'),
    body: JSON.stringify({ status }),
  });

export const getKitchenOrders = () =>
  request('/orders', {
    headers: getBearerHeaders('kitchenToken'),
  });

export const createMenuItem = (item) =>
  request('/menu', {
    method: 'POST',
    headers: getBearerHeaders('adminToken'),
    body: JSON.stringify(item),
  });

export const updateMenuItem = (id, item) =>
  request(`/menu/${id}`, {
    method: 'PUT',
    headers: getBearerHeaders('adminToken'),
    body: JSON.stringify(item),
  });

export const deleteMenuItem = (id) =>
  request(`/menu/${id}`, {
    method: 'DELETE',
    headers: getBearerHeaders('adminToken'),
  });
