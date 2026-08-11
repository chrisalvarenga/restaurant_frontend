// ─── Importaciones ────────────────────────────────────────────────────────────
// useState y useEffect son los dos hooks más usados en React.
// useState guarda datos que, al cambiar, provocan que el componente se redibuje.
// useEffect ejecuta código con efectos secundarios (fetch, timers, etc.) fuera del render.
import { useState, useEffect } from 'react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api/client';
import Icon from '../components/Icon';

// ─── Estado inicial del formulario ────────────────────────────────────────────
// Lo definimos FUERA del componente para no recrearlo en cada render.
// Es un objeto con todos los campos: así usamos UN solo useState para el form.
const EMPTY_FORM = { name: '', description: '', price: '', category: '' };

export default function MenuAdminPage() {
  // ── Estado principal ─────────────────────────────────────────────────────
  // `menu`    → array de items que vienen del backend
  // `form`    → objeto con los valores del formulario (name, description, price, category)
  // `editing` → null si estamos creando, o el id del item que estamos editando
  // `loading` → true mientras cargamos el menú inicial
  // `saving`  → true mientras el formulario está enviando (evita doble click)
  // `error`   → string con mensaje de error, o '' si no hay error
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Cargar menú al montar ────────────────────────────────────────────────
  // El acceso a esta página ya está controlado por RequireRole en App.jsx.
  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch(() => setError('No se pudo cargar el menú.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived state: agrupar por categoría ────────────────────────────────
  // Este valor se calcula en cada render a partir de `menu`.
  // NO necesita useState propio porque se puede derivar del estado existente.
  // Regla: si puedes calcularlo desde otro estado, no lo pongas en useState.
  const byCategory = menu.reduce((acc, item) => {
    const cat = item.category || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // ── Handler de inputs ─────────────────────────────────────────────────────
  // Un solo handler para todos los inputs del form usando el atributo `name`.
  // e.target.name y e.target.value vienen del input que disparó el evento.
  // El spread `...prev` copia todos los campos anteriores, y luego sobreescribimos
  // solo el campo que cambió usando computed property: { [name]: value }.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Iniciar edición ────────────────────────────────────────────────────
  // Cuando el usuario hace click en "Editar", cargamos los datos del item en el form
  // y guardamos su id en `editing`. El formulario detecta esto y cambia su título.
  const startEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),  // los inputs siempre manejan strings
      category: item.category,
    });
    // Scroll al formulario para que sea obvio que está en modo edición
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Cancelar edición ───────────────────────────────────────────────────
  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  // ── Eliminar item ──────────────────────────────────────────────────────
  // Patrón "optimistic UI": actualizamos el estado local ANTES de esperar
  // la respuesta del servidor. Si el servidor falla, revertimos.
  // Esto hace la UI sentirse más rápida.
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este item del menú?')) return;

    // Guardamos el estado anterior por si necesitamos revertir
    const previous = menu;
    // Actualización optimista: quitamos el item inmediatamente de la UI
    setMenu((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteMenuItem(id);
    } catch {
      // Si falló, revertimos al estado anterior
      setMenu(previous);
      setError('Error al eliminar el item.');
    }
  };

  // ── Enviar formulario ─────────────────────────────────────────────────
  // Este handler maneja tanto CREAR como EDITAR dependiendo del valor de `editing`.
  // e.preventDefault() evita que el formulario recargue la página (comportamiento HTML nativo).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Preparamos el payload convirtiendo price a número
    const payload = {
      ...form,
      price: parseFloat(form.price),
    };

    try {
      if (editing) {
        // MODO EDICIÓN: PUT /api/menu/:id
        const updated = await updateMenuItem(editing, payload);
        // Actualizamos solo el item modificado en el array, el resto no cambia.
        // map() devuelve un nuevo array — nunca mutamos el estado directamente.
        setMenu((prev) => prev.map((item) => (item.id === editing ? updated : item)));
        setEditing(null);
      } else {
        // MODO CREACIÓN: POST /api/menu
        const newItem = await createMenuItem(payload);
        // Agregamos el nuevo item al final del array
        setMenu((prev) => [...prev, newItem]);
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || 'Error al guardar el item.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  // El JSX que retorna describe cómo se ve el componente.
  // React lo compara con el render anterior (Virtual DOM diff) y solo actualiza
  // los elementos del DOM real que cambiaron.
  if (loading) return <div className="loading">Cargando menú...</div>;

  return (
    <div className="admin-page">

      {/* ── FORMULARIO ── */}
      {/* La clase cambia dinámicamente según si estamos editando o creando.
          Esto es JSX: las expresiones JS van entre llaves {}. */}
      <section className={`admin-form-section ${editing ? 'editing' : ''}`}>
        <h2>
          <Icon name={editing ? 'pencil' : 'plus'} size={18} />
          {editing ? 'Editar Item' : 'Nuevo Item del Menú'}
        </h2>

        {error && <p className="error-msg">{error}</p>}

        {/* onSubmit va en el <form>, no en el botón, para soportar Enter + click */}
        <form className="admin-form" onSubmit={handleSubmit}>

          {/* Usamos el atributo `name` igual al key del objeto `form`
              para que handleChange funcione con un solo handler genérico */}
          <div className="form-row">
            <label>
              Nombre *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Tacos al Pastor"
                required
              />
            </label>
            <label>
              Categoría *
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ej: Tacos, Bebidas, Postres"
                required
              />
            </label>
          </div>

          <label>
            Descripción
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ingredientes o descripción breve"
            />
          </label>

          <label>
            Precio (MXN) *
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.50"
              required
            />
          </label>

          <div className="form-actions">
            {/* disabled evita doble envío mientras `saving` es true */}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Item'}
            </button>
            {/* Solo mostramos "Cancelar" si estamos en modo edición */}
            {editing && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── TABLA DEL MENÚ AGRUPADA POR CATEGORÍA ── */}
      <section className="admin-menu-section">
        <h2>Items del Menú ({menu.length})</h2>

        {menu.length === 0 ? (
          <p className="empty-state">No hay items. Crea el primero arriba.</p>
        ) : (
          // Object.entries convierte el objeto byCategory en pares [categoria, items[]]
          // para poder iterarlos con map()
          Object.entries(byCategory).map(([category, items]) => (
            // Cada elemento de un map() necesita un `key` único para que React
            // pueda rastrear qué elemento cambió sin re-renderizar todo el listado.
            <div key={category} className="admin-category-group">
              <h3 className="admin-category-title">{category}</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={editing === item.id ? 'row-editing' : ''}>
                      <td><strong>{item.name}</strong></td>
                      <td className="td-desc">{item.description || '—'}</td>
                      {/* toFixed(2) formatea el número a 2 decimales */}
                      <td>${parseFloat(item.price).toFixed(2)}</td>
                      <td className="td-actions">
                        <button
                          className="btn-edit"
                          onClick={() => startEdit(item)}
                          disabled={!!editing && editing !== item.id}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(item.id)}
                          disabled={!!editing}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
