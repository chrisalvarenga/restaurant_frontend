import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import RequireRole from './components/RequireRole';
import Icon from './components/Icon';
import FloorPlanPage from './pages/FloorPlanPage';
import MyOrdersPage from './pages/MyOrdersPage';
import KitchenPage from './pages/KitchenPage';
import MenuAdminPage from './pages/MenuAdminPage';
import WaitersAdminPage from './pages/WaitersAdminPage';
import CooksAdminPage from './pages/CooksAdminPage';
import AdminsAdminPage from './pages/AdminsAdminPage';
import TablesAdminPage from './pages/TablesAdminPage';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

function NavForRole({ role }) {
  if (role === 'AGENT') {
    return (
      <>
        <NavLink to="/" end>Mesas</NavLink>
        <NavLink to="/mis-pedidos">Mis Pedidos</NavLink>
      </>
    );
  }
  if (role === 'COCINERO') {
    return <NavLink to="/kitchen" end>Cocina</NavLink>;
  }
  if (ADMIN_ROLES.includes(role)) {
    return (
      <>
        <NavLink to="/admin">Admin Menú</NavLink>
        <NavLink to="/admin/mesas">Admin Mesas</NavLink>
        <NavLink to="/admin/meseros">Meseros</NavLink>
        <NavLink to="/admin/cocineros">Cocineros</NavLink>
        {role === 'SUPER_ADMIN' && <NavLink to="/admin/administradores">Administradores</NavLink>}
        <NavLink to="/kitchen">Cocina</NavLink>
      </>
    );
  }
  return null;
}

/** A dónde mandar a cada rol al entrar, según lo que realmente puede ver. */
function homeRouteFor(role) {
  if (role === 'COCINERO') return '/kitchen';
  if (ADMIN_ROLES.includes(role)) return '/admin';
  return '/';
}

function AppShell() {
  const { session, logout } = useSession();

  return (
    <BrowserRouter>
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-mark">R</span>
            <span className="brand-name">Restaurante</span>
          </div>
          {session && (
            <nav className="header-nav">
              <NavForRole role={session.role} />
              <span className="nav-session">
                <span className="nav-session-name">{session.name}</span>
                <button className="btn-link" onClick={logout}>
                  <Icon name="logOut" size={14} />
                  Salir
                </button>
              </span>
            </nav>
          )}
        </div>
      </header>
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole roles={['AGENT']}>
                <FloorPlanPage />
              </RequireRole>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <RequireRole roles={['AGENT']}>
                <MyOrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen"
            element={
              <RequireRole roles={['COCINERO', ...ADMIN_ROLES]}>
                <KitchenPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <MenuAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/mesas"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <TablesAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/meseros"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <WaitersAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/cocineros"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <CooksAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/administradores"
            element={
              <RequireRole roles={['SUPER_ADMIN']}>
                <AdminsAdminPage />
              </RequireRole>
            }
          />
          {/* Ruta desconocida: si hay sesión, va a su home real; si no, a la puerta de entrada. */}
          <Route path="*" element={<Navigate to={session ? homeRouteFor(session.role) : '/'} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
