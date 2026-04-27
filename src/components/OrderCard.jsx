const STATUS = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b' },
  preparando: { label: 'Preparando', color: '#3b82f6' },
  listo:      { label: 'Listo',      color: '#10b981' },
  entregado:  { label: 'Entregado',  color: '#6b7280' },
};

const NEXT = {
  pendiente:  { status: 'preparando', label: 'Iniciar Preparación' },
  preparando: { status: 'listo',      label: 'Marcar Listo' },
  listo:      { status: 'entregado',  label: 'Marcar Entregado' },
};

export default function OrderCard({ order, onStatusChange }) {
  const current = STATUS[order.status];
  const next = NEXT[order.status];

  const time = new Date(order.createdAt).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="order-card" style={{ borderLeft: `4px solid ${current.color}` }}>
      <div className="order-card-header">
        <div>
          <span className="table-badge">Mesa {order.tableNumber}</span>
          {order.customerName && <span className="customer-name">{order.customerName}</span>}
        </div>
        <div className="order-card-meta">
          <span className="order-time">{time}</span>
          <span className="status-badge" style={{ background: current.color }}>
            {current.label}
          </span>
        </div>
      </div>

      <ul className="order-items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span className="item-qty">{item.quantity}x</span> {item.name}
          </li>
        ))}
      </ul>

      {order.notes && <p className="order-notes">{order.notes}</p>}

      {next && (
        <button
          className="btn-status"
          style={{ background: STATUS[next.status].color }}
          onClick={() => onStatusChange(order.id, next.status)}
        >
          {next.label}
        </button>
      )}
    </div>
  );
}
