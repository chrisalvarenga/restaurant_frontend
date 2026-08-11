import { useEffect, useMemo, useState } from 'react';
import { getTableBill, checkoutTable } from '../api/client';
import Icon from '../components/Icon';

const TIP_PRESETS = [0, 10, 15, 20];
const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'banknote' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'creditCard' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'repeat' },
];

/** Cierre de cuenta de una mesa: desglose, propina y método de pago. */
export default function CheckoutPage({ table, onClose, onCompleted }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tipPercent, setTipPercent] = useState(10);
  const [method, setMethod] = useState('EFECTIVO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTableBill(table.id)
      .then(setBill)
      .catch(() => setError('No se pudo cargar la cuenta.'))
      .finally(() => setLoading(false));
  }, [table.id]);

  const tip = useMemo(() => (bill ? Math.round(bill.subtotal * (tipPercent / 100) * 100) / 100 : 0), [bill, tipPercent]);
  const total = bill ? bill.subtotal + tip : 0;

  const handleCheckout = async () => {
    setError('');
    setSubmitting(true);
    try {
      await checkoutTable(table.id, { method, tip });
      onCompleted?.();
    } catch (err) {
      setError(err.message || 'No se pudo cerrar la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="composer-header">
        <h2>Cuenta — Mesa {table.number}</h2>
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>

      {loading && <div className="loading">Cargando cuenta...</div>}
      {error && <p className="error-msg">{error}</p>}

      {bill && (
        <div className="bill-card">
          <ul className="bill-items">
            {bill.items.map((item, i) => (
              <li key={`${item.orderId}-${i}`}>
                <span className="bill-item-qty">{item.quantity}×</span>
                <span className="bill-item-name">{item.name}</span>
                <span className="bill-item-price">${item.subtotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="bill-row">
            <span>Subtotal</span>
            <span>${bill.subtotal.toFixed(2)}</span>
          </div>

          <div className="tip-selector">
            <span>Propina</span>
            <div className="tip-options">
              {TIP_PRESETS.map((p) => (
                <button
                  key={p}
                  className={`tip-chip ${tipPercent === p ? 'active' : ''}`}
                  onClick={() => setTipPercent(p)}
                  type="button"
                >
                  {p === 0 ? 'Sin propina' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="bill-row">
            <span>Propina ({tipPercent}%)</span>
            <span>${tip.toFixed(2)}</span>
          </div>

          <div className="bill-row bill-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="payment-methods">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                className={`payment-method-btn ${method === m.value ? 'active' : ''}`}
                onClick={() => setMethod(m.value)}
                type="button"
              >
                <Icon name={m.icon} size={18} />
                {m.label}
              </button>
            ))}
          </div>

          <button className="btn-primary btn-checkout" onClick={handleCheckout} disabled={submitting}>
            {submitting ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
          </button>
        </div>
      )}
    </div>
  );
}
