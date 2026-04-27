import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_BASE_URL, getKitchenOrders, updateOrderStatus } from '../api/client';
import OrderCard from '../components/OrderCard';
import AdminPinModal from '../components/AdminPinModal';

const DELIVERED_VISIBLE_WINDOW_MS = 60 * 60 * 1000;

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('activos');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const deliveredCutoff = Date.now() - DELIVERED_VISIBLE_WINDOW_MS;

  // Verificar token de cocina al montar
  useEffect(() => {
    const token = localStorage.getItem('kitchenToken');
    if (token) {
      fetch(`${API_BASE_URL}/admin/kitchen/verify-token?token=${encodeURIComponent(token)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setAuthenticated(true);
          else localStorage.removeItem('kitchenToken');
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const token = localStorage.getItem('kitchenToken');
    const socket = io(SOCKET_BASE_URL, {
      auth: {
        token,
      },
    });

    getKitchenOrders()
      .then(setOrders)
      .catch(() => setError('No se pudo conectar al backend.'));

    socket.on('new-order', (order) => {
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
  }, [authenticated]);

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

  if (!authenticated) {
    return (
      <AdminPinModal
        onSuccess={() => setAuthenticated(true)}
        validateUrl={`${API_BASE_URL}/admin/kitchen/validate-pin`}
        verifyUrl={`${API_BASE_URL}/admin/kitchen/verify-token`}
        storageKey="kitchenToken"
        title="👨‍🍳 Acceso Cocina"
        description="Ingresa el PIN para acceder al panel de cocina"
      />
    );
  }

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <h2>Panel de Cocina</h2>
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
