import StaffAdminPage from '../components/StaffAdminPage';
import { waitersClient } from '../api/client';

export default function WaitersAdminPage() {
  return (
    <StaffAdminPage
      client={waitersClient}
      singularLabel="Mesero"
      pluralLabel="Meseros"
      emptyHint="No hay meseros. Crea el primero arriba."
    />
  );
}
