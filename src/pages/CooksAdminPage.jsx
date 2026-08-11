import StaffAdminPage from '../components/StaffAdminPage';
import { cooksClient } from '../api/client';

export default function CooksAdminPage() {
  return (
    <StaffAdminPage
      client={cooksClient}
      singularLabel="Cocinero"
      pluralLabel="Cocineros"
      emptyHint="No hay cocineros. Crea el primero arriba."
    />
  );
}
