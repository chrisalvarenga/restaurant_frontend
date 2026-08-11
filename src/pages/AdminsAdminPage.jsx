import StaffAdminPage from '../components/StaffAdminPage';
import { adminsClient } from '../api/client';

// Solo el Super Admin llega a esta página (ver RequireRole en App.jsx) — es
// intencional: solo la cuenta maestra decide quién tiene acceso de admin.
export default function AdminsAdminPage() {
  return (
    <StaffAdminPage
      client={adminsClient}
      singularLabel="Administrador"
      pluralLabel="Administradores"
      emptyHint="No hay administradores. Crea el primero arriba."
    />
  );
}
