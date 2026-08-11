import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL, getTables, updateTableStatus } from '../api/client';
import OrderPage from './OrderPage';
import CheckoutPage from './CheckoutPage';
import Icon from '../components/Icon';

const STATUS_LABEL = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  POR_COBRAR: 'Por cobrar',
  LIMPIEZA: 'Limpieza',
};

export default function FloorPlanPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(null); // { type: 'order'|'checkout', table }

  const refresh = useCallback(() => {
    getTables()
      .then(setTables)
      .catch(() => setError('No se pudieron cargar las mesas.'));
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
    setLoading(false);

    const token = localStorage.getItem('staffToken');
    const socket = io(SOCKET_BASE_URL, { auth: { token } });

    socket.on('table-updated', refresh);
    socket.on('new-order', refresh);
    socket.on('order-updated', refresh);

    return () => {
      socket.off('table-updated', refresh);
      socket.off('new-order', refresh);
      socket.off('order-updated', refresh);
      socket.disconnect();
    };
  }, [refresh]);

  const handleTableClick = (table) => {
    if (table.status === 'LIBRE' || table.status === 'OCUPADA') {
      setView({ type: 'order', table });
    } else if (table.status === 'POR_COBRAR') {
      setView({ type: 'checkout', table });
    }
  };

  const requestBill = async (table, e) => {
    e.stopPropagation();
    try {
      await updateTableStatus(table.id, 'POR_COBRAR');
      refresh();
    } catch {
      setError('No se pudo pedir la cuenta.');
    }
  };

  const markClean = async (table, e) => {
    e.stopPropagation();
    try {
      await updateTableStatus(table.id, 'LIBRE');
      refresh();
    } catch {
      setError('No se pudo liberar la mesa.');
    }
  };

  const closeView = () => {
    setView(null);
    refresh();
  };

  if (view?.type === 'order') {
    return <OrderPage table={view.table} onClose={closeView} onSubmitted={closeView} />;
  }
  if (view?.type === 'checkout') {
    return <CheckoutPage table={view.table} onClose={closeView} onCompleted={closeView} />;
  }

  if (loading) return <div className="loading">Cargando mesas...</div>;

  return (
    <div className="floor-plan-page">
      <div className="floor-plan-header">
        <h2><Icon name="table" size={20} /> Mapa de Mesas</h2>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="table-grid">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`table-card status-${table.status}`}
            onClick={() => handleTableClick(table)}
          >
            <div className="table-card-number">Mesa {table.number}</div>
            {table.zone && <div className="table-card-zone">{table.zone}</div>}
            <div className="table-card-status-chip">{STATUS_LABEL[table.status]}</div>
            {table.currentWaiter && (
              <div className="table-card-waiter">
                <Icon name="user" size={13} />
                {table.currentWaiter.name}
              </div>
            )}
            {table.orders.length > 0 && (
              <div className="table-card-summary">
                {table.orders.length} pedido{table.orders.length > 1 ? 's' : ''} · ${table.total.toFixed(2)}
              </div>
            )}
            {table.status === 'OCUPADA' && (
              <button className="table-card-action" onClick={(e) => requestBill(table, e)}>
                Pedir cuenta
              </button>
            )}
            {table.status === 'LIMPIEZA' && (
              <button className="table-card-action" onClick={(e) => markClean(table, e)}>
                Mesa lista
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
