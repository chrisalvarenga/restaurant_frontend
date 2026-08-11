import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL, getKitchenOrders, updateOrderStatus } from '../api/client';
import OrderCard from '../components/OrderCard';
import { playNewOrderPing } from '../lib/sound';
import { useTick } from '../hooks/useTick';
import Icon from '../components/Icon';

const DELIVERED_VISIBLE_WINDOW_MS = 60 * 60 * 1000;

// El acceso a esta página ya está controlado por RequireRole en App.jsx
// (cocina, admin o super admin) — aquí solo se usa la sesión ya activa.
export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('activos');
  const [error, setError] = useState('');
  useTick();

  const deliveredCutoff = Date.now() - DELIVERED_VISIBLE_WINDOW_MS;

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const socket = io(SOCKET_BASE_URL, { auth: { token } });

    getKitchenOrders()
      .then(setOrders)
      .catch(() => setError('No se pudo conectar al backend.'));

    socket.on('new-order', (order) => {
      playNewOrderPing();
      setOrders((prev) => [order, ...prev]);
    });

    socket.on('order-updated', (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
      socket.disconnect();
    };
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
    } catch {
      alert('Error al actualizar el estado');
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'entregado');
  const deliveredOrders = orders.filter((o) => {
    if (o.status !== 'entregado') return false;

    const deliveredAt = new Date(o.updatedAt).getTime();
    return Number.isFinite(deliveredAt) && deliveredAt >= deliveredCutoff;
  });
  const displayed = filter === 'activos' ? activeOrders : deliveredOrders;

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <h2><Icon name="flame" size={20} /> Panel de Cocina</h2>
        <div className="filter-tabs">
          <button
            className={`tab ${filter === 'activos' ? 'active' : ''}`}
            onClick={() => setFilter('activos')}
          >
            Activos ({activeOrders.length})
          </button>
          <button
            className={`tab ${filter === 'entregados' ? 'active' : ''}`}
            onClick={() => setFilter('entregados')}
          >
            Entregados 1h ({deliveredOrders.length})
          </button>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {displayed.length === 0 ? (
        <div className="empty-state">
          {filter === 'activos' ? 'No hay pedidos activos' : 'No hay pedidos entregados'}
        </div>
      ) : (
        <div className="orders-grid">
          {displayed.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
