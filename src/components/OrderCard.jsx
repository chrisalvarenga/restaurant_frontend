import Icon from './Icon';

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

const URGENCY_THRESHOLDS = { WARN: 10, DANGER: 15 }; // minutos

function getElapsedMinutes(dateString) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
}

export default function OrderCard({ order, onStatusChange }) {
  const current = STATUS[order.status];
  const next = NEXT[order.status];
  const isActive = order.status !== 'entregado';

  const time = new Date(order.createdAt).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const elapsed = getElapsedMinutes(order.createdAt);
  const urgency = !isActive
    ? 'none'
    : elapsed >= URGENCY_THRESHOLDS.DANGER
      ? 'danger'
      : elapsed >= URGENCY_THRESHOLDS.WARN
        ? 'warn'
        : 'ok';

  return (
    <div className={`order-card urgency-${urgency}`} style={{ borderLeft: `4px solid ${current.color}` }}>
      <div className="order-card-header">
        <div>
          <span className="table-badge">Mesa {order.tableNumber}</span>
          {order.customerName && <span className="customer-name">{order.customerName}</span>}
        </div>
        <div className="order-card-meta">
          <span className="order-time">{time}</span>
          {isActive && (
            <span className={`elapsed-badge urgency-${urgency}`}>
              <Icon name="clock" size={12} />
              {elapsed} min
            </span>
          )}
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
