import { useEffect, useState } from 'react';
import { getTables, createTable, deleteTable } from '../api/client';
import Icon from '../components/Icon';

const EMPTY_FORM = { number: '', zone: 'Salón', capacity: '4' };

export default function TablesAdminPage() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTables()
      .then(setTables)
      .catch(() => setError('No se pudieron cargar las mesas.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const table = await createTable(form);
      setTables((prev) => [...prev, table].sort((a, b) => a.number - b.number));
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || 'Error al crear la mesa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table) => {
    if (!window.confirm(`¿Eliminar la Mesa ${table.number}?`)) return;

    const previous = tables;
    setTables((prev) => prev.filter((t) => t.id !== table.id));
    try {
      await deleteTable(table.id);
    } catch (err) {
      setTables(previous);
      setError(err.message || 'No se pudo eliminar la mesa.');
    }
  };

  if (loading) return <div className="loading">Cargando mesas...</div>;

  return (
    <div className="admin-page">
      <section className="admin-form-section">
        <h2><Icon name="plus" size={18} /> Nueva Mesa</h2>
        {error && <p className="error-msg">{error}</p>}
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Número *
              <input
                name="number"
                type="number"
                min="1"
                value={form.number}
                onChange={handleChange}
                placeholder="Ej: 9"
                required
              />
            </label>
            <label>
              Zona
              <input name="zone" value={form.zone} onChange={handleChange} placeholder="Ej: Terraza" />
            </label>
          </div>
          <label>
            Capacidad
            <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Mesa'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-menu-section">
        <h2>Mesas ({tables.length})</h2>
        {tables.length === 0 ? (
          <p className="empty-state">No hay mesas. Crea la primera arriba.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Zona</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td><strong>Mesa {t.number}</strong></td>
                  <td>{t.zone || '—'}</td>
                  <td>{t.capacity}</td>
                  <td>
                    <span className={`status-chip ${t.status === 'LIBRE' ? 'chip-active' : 'chip-inactive'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(t)}
                      disabled={t.status !== 'LIBRE'}
                      title={t.status !== 'LIBRE' ? 'Solo se puede eliminar una mesa libre' : ''}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
