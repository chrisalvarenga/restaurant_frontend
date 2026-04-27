import { useState, useEffect } from 'react';
import { getMenu, createOrder } from '../api/client';
import MenuItem from '../components/MenuItem';
import Cart from '../components/Cart';

export default function OrderPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch(() => setError('No se pudo cargar el menú. Verifica que el backend esté corriendo.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Todos', ...new Set(menu.map((i) => i.category))];
  const filteredMenu = activeCategory === 'Todos' ? menu : menu.filter((i) => i.category === activeCategory);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.id !== id));

  const updateQuantity = (id, quantity) => {
    if (quantity === 0) return removeFromCart(id);
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity } : c)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createOrder({ items: cart, tableNumber, customerName, notes });
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError('Error al enviar el pedido. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Cargando menú...</div>;

  return (
    <div className="order-page">
      <div className="menu-section">
        <h2>Nuestro Menú</h2>
        {error && <p className="error-msg">{error}</p>}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {filteredMenu.map((item) => (
            <MenuItem key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      </div>

      <div className="sidebar">
        <Cart cart={cart} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
        <form className="order-form" onSubmit={handleSubmit}>
          <h3>Datos del Pedido</h3>
          <input
            type="number"
            placeholder="Número de mesa *"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            min="1"
            required
          />
          <input
            type="text"
            placeholder="Nombre del cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <textarea
            placeholder="Notas especiales (alergias, términos, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">Pedido enviado a cocina!</p>}
          <button type="submit" className="btn-primary" disabled={submitting || cart.length === 0}>
            {submitting ? 'Enviando...' : 'Enviar Pedido a Cocina'}
          </button>
        </form>
      </div>
    </div>
  );
}
