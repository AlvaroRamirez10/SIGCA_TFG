import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';

// Páginas públicas
import Home from './Paginas/Home';
import Login from './Paginas/Login';
import Register from './Paginas/Register';
import Games from './Paginas/Games';

// Páginas de jugador
import PlayerDashboard from './Paginas/player/Dashboard';
import PlayerReservations from './Paginas/player/Reservations';
import PlayerLoyalty from './Paginas/player/Loyalty';
import PlayerProfile from './Paginas/player/profile';

// Páginas de admin
import AdminDashboard from './Paginas/admin/Dashboard';
import AdminPlayers from './Paginas/admin/Players';
import AdminGames from './Paginas/admin/Games';
import AdminReservations from './Paginas/admin/Reservations';
import AdminPayments from './Paginas/admin/Payments';

// Componente de ruta protegida
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-carbon">
        <div className="text-white text-xl font-semibold font-tactical">CARGANDO...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/player" />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Ruta principal - Home o dashboard según rol */}
      <Route path="/" element={
        user 
          ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/player" />)
          : <Home />
      } />

      {/* Rutas públicas */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/player" /> : <Register />} />
      <Route path="/games" element={<Games />} />

      {/* Rutas de jugador */}
      <Route path="/player" element={<ProtectedRoute><PlayerDashboard /></ProtectedRoute>} />
      <Route path="/player/reservations" element={<ProtectedRoute><PlayerReservations /></ProtectedRoute>} />
      <Route path="/player/loyalty" element={<ProtectedRoute><PlayerLoyalty /></ProtectedRoute>} />
      <Route path="/player/profile" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />

      {/* Rutas de admin */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/players" element={<ProtectedRoute requireAdmin><AdminPlayers /></ProtectedRoute>} />
      <Route path="/admin/games" element={<ProtectedRoute requireAdmin><AdminGames /></ProtectedRoute>} />
      <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><AdminReservations /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;