import { useState } from 'react';
import { API_BASE_URL } from '../api/client';

/**
 * Modal reutilizable de PIN.
 * Props:
 *   - onSuccess: fn()  → llamada cuando el PIN es correcto
 *   - validateUrl: string  → endpoint POST para validar
 *   - verifyUrl: string    → endpoint GET para verificar token
 *   - storageKey: string   → clave en localStorage
 *   - title: string        → título del modal
 *   - description: string  → descripción del modal
 */
export default function AdminPinModal({
  onSuccess,
  validateUrl = `${API_BASE_URL}/admin/validate-pin`,
  verifyUrl = `${API_BASE_URL}/admin/verify-token`,
  storageKey = 'adminToken',
  title = '🔐 Acceso Admin',
  description = 'Ingresa el PIN para acceder al panel de administración',
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'PIN incorrecto');
        setLoading(false);
        return;
      }

      localStorage.setItem(storageKey, data.token);
      setPin('');
      onSuccess();
    } catch {
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-pin-modal">
        <h2>{title}</h2>
        <p>{description}</p>

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
              disabled={loading}
              autoFocus
            />
          </label>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !pin.trim()}
          >
            {loading ? 'Validando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}
