import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL, getMyOrders } from '../api/client';
import { useSession } from '../context/SessionContext';
import { formatElapsed } from '../lib/time';
import { playReadyChime } from '../lib/sound';
import { useTick } from '../hooks/useTick';
import Icon from '../components/Icon';

const COLUMNS = [
  { status: 'pendiente', label: 'Pendiente' },
  { status: 'preparando', label: 'Preparando' },
  { status: 'listo', label: 'Listo' },
  { status: 'entregado', label: 'Entregado' },
];

export default function MyOrdersPage() {
  const { session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const statusRef = useRef(new Map());
  useTick();

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data);
        data.forEach((o) => statusRef.current.set(o.id, o.status));
      })
      .catch(() => setError('No se pudieron cargar tus pedidos.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const socket = io(SOCKET_BASE_URL, { auth: { token } });

    const upsert = (order) => {
      if (order.createdById !== session?.id) return;

      const previousStatus = statusRef.current.get(order.id);
      if (previousStatus && previousStatus !== 'listo' && order.status === 'listo') {
        playReadyChime();
        setToast(`Mesa ${order.tableNumber} — ¡pedido listo para servir!`);
        setTimeout(() => setToast(''), 5000);
      }
      statusRef.current.set(order.id, order.status);

      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev];
      });
    };

    socket.on('new-order', upsert);
    socket.on('order-updated', upsert);

    return () => {
      socket.off('new-order', upsert);
      socket.off('order-updated', upsert);
      socket.disconnect();
    };
  }, [session?.id]);

  if (loading) return <div className="loading">Cargando tus pedidos...</div>;

  return (
    <div className="my-orders-page">
      <h2><Icon name="receipt" size={20} /> Mis Pedidos</h2>
      {error && <p className="error-msg">{error}</p>}
      {toast && (
        <div className="toast toast-success">
          <Icon name="bell" size={16} />
          {toast}
        </div>
      )}

      <div className="my-orders-columns">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className={`my-orders-column column-${col.status}`}>
              <h3>{col.label} ({columnOrders.length})</h3>
              {columnOrders.length === 0 && <p className="empty-state">Sin pedidos</p>}
              {columnOrders.map((order) => (
                <div key={order.id} className={`my-order-card status-${order.status}`}>
                  <div className="my-order-card-header">
                    <strong>Mesa {order.tableNumber}</strong>
                    <span className="elapsed-badge">{formatElapsed(order.createdAt)}</span>
                  </div>
                  {order.customerName && <div className="my-order-customer">{order.customerName}</div>}
                  <ul className="my-order-items">
                    {order.items.map((item) => (
                      <li key={item.id}>{item.quantity}× {item.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
