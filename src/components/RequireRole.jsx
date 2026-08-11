import { useSession } from '../context/SessionContext';
import StaffLoginGate from './StaffLoginGate';

/**
 * Exige sesión activa antes de renderizar `children`. Si `roles` se indica,
 * además exige que el rol de la sesión esté en esa lista (defensa en
 * profundidad — la navegación ya oculta lo que no corresponde, esto evita
 * que alguien llegue a una ruta admin tecleando la URL a mano).
 */
export default function RequireRole({ roles, children }) {
  const { session, loading } = useSession();

  if (loading) return <div className="loading">Cargando sesión...</div>;
  if (!session) return <StaffLoginGate />;
  if (roles && !roles.includes(session.role)) {
    return <div className="empty-state">No tienes permisos para ver esta sección.</div>;
  }
  return children;
}
