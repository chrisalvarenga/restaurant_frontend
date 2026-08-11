import { useEffect, useState } from 'react';
import { waitersClient, cooksClient, adminsClient } from '../api/client';
import { useSession } from '../context/SessionContext';
import Icon from './Icon';

const ROLE_OPTIONS = [
  { key: 'mesero', label: 'Mesero', icon: 'user', client: waitersClient, loginKey: 'loginWaiter' },
  { key: 'cocina', label: 'Cocina', icon: 'flame', client: cooksClient, loginKey: 'loginCook' },
  { key: 'admin', label: 'Administrador', icon: 'sliders', client: adminsClient, loginKey: 'loginAdmin' },
];

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function PinStaffLogin({ roleOption, onBack }) {
  const session = useSession();
  const [staff, setStaff] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    roleOption.client
      .getPublic()
      .then(setStaff)
      .catch(() => setListError('No se pudo cargar el personal. Verifica el backend.'))
      .finally(() => setLoadingList(false));
  }, [roleOption]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await session[roleOption.loginKey](selected.id, pin);
    } catch (err) {
      setError(err.message || 'PIN incorrecto');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selected) {
    return (
      <>
        <div className="gate-icon"><Icon name={roleOption.icon} size={22} /></div>
        <h2>{roleOption.label}</h2>
        <p>Selecciona tu nombre para empezar</p>
        {loadingList && <p className="loading">Cargando personal...</p>}
        {listError && <p className="error-msg">{listError}</p>}
        {!loadingList && !listError && staff.length === 0 && (
          <p className="empty-state">
            Aún no hay {roleOption.label.toLowerCase()}s registrados. Pide a un administrador que te agregue.
          </p>
        )}
        <div className="waiter-grid">
          {staff.map((s) => (
            <button key={s.id} className="waiter-avatar-btn" onClick={() => setSelected(s)}>
              <span className="waiter-avatar">{initials(s.name)}</span>
              <span className="waiter-avatar-name">{s.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-link btn-link-dark" onClick={onBack}>
          <Icon name="chevronLeft" size={14} />
          Cambiar tipo de usuario
        </button>
      </>
    );
  }

  return (
    <>
      <div className="gate-icon"><Icon name="user" size={22} /></div>
      <h2>Hola, {selected.name}</h2>
      <p>Ingresa tu PIN personal</p>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          PIN
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            maxLength="6"
            disabled={submitting}
            autoFocus
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting || !pin.trim()}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSelected(null);
              setPin('');
              setError('');
            }}
            disabled={submitting}
          >
            No soy yo
          </button>
        </div>
      </form>
    </>
  );
}

function SuperAdminLogin({ onBack }) {
  const { loginSuperAdmin } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginSuperAdmin(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="gate-icon"><Icon name="shield" size={22} /></div>
      <h2>Acceso Super Admin</h2>
      <p>Cuenta maestra del sistema — email y contraseña</p>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit} className="super-admin-form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" className="btn-secondary" onClick={onBack} disabled={submitting}>
            Volver
          </button>
        </div>
      </form>
    </>
  );
}

/**
 * Puerta de entrada única de la app: primero se elige el tipo de usuario,
 * luego se autentica (PIN individual para mesero/cocina/admin, email+
 * contraseña para super admin). El rol resultante decide qué ve cada uno
 * (ver App.jsx).
 */
export default function StaffLoginGate() {
  const [roleKey, setRoleKey] = useState(null);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  const roleOption = ROLE_OPTIONS.find((r) => r.key === roleKey);

  return (
    <div className="modal-overlay">
      <div className="modal-content login-gate">
        {showSuperAdmin ? (
          <SuperAdminLogin onBack={() => setShowSuperAdmin(false)} />
        ) : roleOption ? (
          <PinStaffLogin roleOption={roleOption} onBack={() => setRoleKey(null)} />
        ) : (
          <>
            <h2>Iniciar sesión</h2>
            <p>Selecciona tu tipo de usuario para continuar</p>
            <div className="role-picker">
              {ROLE_OPTIONS.map((r) => (
                <button key={r.key} className="role-picker-btn" onClick={() => setRoleKey(r.key)}>
                  <span className="role-picker-icon"><Icon name={r.icon} size={18} /></span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn-link btn-link-dark" onClick={() => setShowSuperAdmin(true)}>
              Acceso proveedor del sistema
            </button>
          </>
        )}
      </div>
    </div>
  );
}
