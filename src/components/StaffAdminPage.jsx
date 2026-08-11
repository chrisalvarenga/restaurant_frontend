import { useEffect, useState } from 'react';
import Icon from './Icon';

const EMPTY_FORM = { name: '', pin: '' };

/**
 * CRUD genérico para una cuenta de staff con PIN (mesero, cocinero, admin).
 * El control de "quién puede ver esta página" ya lo hace RequireRole en
 * App.jsx — aquí solo se asume que el usuario tiene permiso.
 */
export default function StaffAdminPage({ client, singularLabel, pluralLabel, emptyHint }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .list()
      .then(setStaff)
      .catch(() => setError(`No se pudo cargar la lista de ${pluralLabel.toLowerCase()}.`))
      .finally(() => setLoading(false));
  }, [client, pluralLabel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await client.create(form);
      setStaff((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || `Error al crear ${singularLabel.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (person) => {
    try {
      const updated = await client.update(person.id, { active: !person.active });
      setStaff((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
    } catch {
      setError(`No se pudo actualizar a ${person.name}.`);
    }
  };

  const resetPin = async (person) => {
    const pin = window.prompt(`Nuevo PIN para ${person.name} (4-6 dígitos):`);
    if (!pin) return;
    try {
      const updated = await client.update(person.id, { pin });
      setStaff((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el PIN.');
    }
  };

  if (loading) return <div className="loading">Cargando {pluralLabel.toLowerCase()}...</div>;

  return (
    <div className="admin-page">
      <section className="admin-form-section">
        <h2><Icon name="plus" size={18} /> Nuevo {singularLabel}</h2>
        {error && <p className="error-msg">{error}</p>}
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Nombre *
              <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Ana Pérez" required />
            </label>
            <label>
              PIN inicial (4-6 dígitos) *
              <input
                name="pin"
                inputMode="numeric"
                pattern="\d{4,6}"
                value={form.pin}
                onChange={handleChange}
                placeholder="1234"
                maxLength={6}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : `Crear ${singularLabel}`}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-menu-section">
        <h2>{pluralLabel} ({staff.length})</h2>
        {staff.length === 0 ? (
          <p className="empty-state">{emptyHint}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    <span className={`status-chip ${p.active ? 'chip-active' : 'chip-inactive'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="btn-edit" onClick={() => resetPin(p)}>Cambiar PIN</button>
                    <button className="btn-delete" onClick={() => toggleActive(p)}>
                      {p.active ? 'Desactivar' : 'Activar'}
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
