import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  Users, Calendar, DollarSign, TrendingUp, AlertCircle,
  Target, CheckCircle, XCircle, Gift, Activity, LogOut
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Logo from '../../Componentes/Logo';
import NotificationBell from '../../Componentes/NotificationBell';

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setAlerts(res.data.alerts || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-xl font-tactical">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Logo className="w-10 h-10" />
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-accion" />
                <div>
                  <h1 className="text-xl font-black text-gray-900 font-tactical">Panel de Administrador</h1>
                  <p className="text-sm text-gray-500">Bienvenido, {user?.name}</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors font-tactical uppercase text-sm"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
            <NotificationBell />
            <div className="lg:hidden">
              <MobileMenu user={user} logout={logout} dark={false} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              Alertas y Notificaciones
            </h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
                    alert.type === 'error'   ? 'bg-red-50 border-red-300 text-red-800' :
                                              'bg-green-50 border-green-300 text-green-800'
                  }`}
                >
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm mt-0.5 opacity-80">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid — fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Jugadores</p>
                <p className="text-3xl font-black text-gray-900">{stats?.total_players || 0}</p>
                <p className="text-green-600 text-sm mt-2">+{stats?.new_players_month || 0} este mes</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Partidas Este Mes</p>
                <p className="text-3xl font-black text-gray-900">{stats?.games_this_month || 0}</p>
                <p className="text-yellow-600 text-sm mt-2">{stats?.upcoming_games || 0} próximas</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Ingresos Este Mes</p>
                <p className="text-3xl font-black text-gray-900">{stats?.monthly_revenue || '0'}€</p>
                <p className="text-green-600 text-sm mt-2">{stats?.revenue_growth || '0'}% vs anterior</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Ocupación Media</p>
                <p className="text-3xl font-black text-gray-900">{stats?.avg_occupancy || '0'}%</p>
                <p className="text-gray-400 text-sm mt-2">{stats?.total_reservations || 0} reservas</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid — fila 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold">Asistencias</h3>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stats?.total_attendances || 0}</p>
            <p className="text-gray-400 text-sm">Tasa: {stats?.attendance_rate || '0'}%</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold">No Presentados</h3>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stats?.total_no_shows || 0}</p>
            <p className="text-gray-400 text-sm">{stats?.players_warned || 0} jugadores avisados</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold">Bonos Activos</h3>
              <Gift className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stats?.active_credits || 0}</p>
            <p className="text-gray-400 text-sm">{stats?.credits_used_month || 0} canjeados este mes</p>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-xl font-black text-gray-900 font-tactical uppercase mb-6">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,      label: 'Gestionar Jugadores', desc: 'CRUD completo de jugadores', path: '/admin/players' },
              { icon: Calendar,   label: 'Gestionar Partidas',  desc: 'Crear y administrar eventos', path: '/admin/games' },
              { icon: Activity,   label: 'Ver Reservas',        desc: 'Control de inscripciones',  path: '/admin/reservations' },
              { icon: DollarSign, label: 'Gestionar Pagos',     desc: 'Validar y registrar cobros', path: '/admin/payments' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all text-left shadow-sm hover:shadow"
                >
                  <ItemIcon className="h-8 w-8 text-accion mb-3" />
                  <h3 className="text-gray-900 font-bold mb-1">{item.label}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Próximas partidas */}
        {stats?.upcoming_games_list && stats.upcoming_games_list.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 font-tactical uppercase mb-6">Próximas Partidas</h2>
            <div className="space-y-3">
              {stats.upcoming_games_list.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold mb-0.5">{game.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(game.date).toLocaleDateString('es-ES', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })} — {game.time}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-gray-900 font-bold">{game.occupied_slots}/{game.max_slots}</p>
                    <p className="text-gray-400 text-sm">plazas</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    game.occupied_slots >= game.max_slots              ? 'bg-red-100 text-red-700' :
                    game.occupied_slots >= game.max_slots * 0.8        ? 'bg-yellow-100 text-yellow-700' :
                                                                         'bg-green-100 text-green-700'
                  }`}>
                    {game.occupied_slots >= game.max_slots       ? 'COMPLETA' :
                     game.occupied_slots >= game.max_slots * 0.8 ? 'CASI LLENA' :
                                                                   'DISPONIBLE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
