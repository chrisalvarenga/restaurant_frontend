import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import MenuAdminPage from './pages/MenuAdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <div className="header-content">
          <h1>Restaurante</h1>
          <nav>
            <NavLink to="/" end>Menú y Pedidos</NavLink>
            <NavLink to="/kitchen">Cocina</NavLink>
            <NavLink to="/admin">Admin Menú</NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<OrderPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/admin" element={<MenuAdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
