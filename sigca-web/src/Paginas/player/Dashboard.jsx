import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import { 
  Calendar, 
  Trophy, 
  LogOut, 
  Clock, 
  MapPin,
  ArrowRight,
  User,
  Crosshair
} from 'lucide-react';
import Logo from '../../Componentes/Logo';

export default function PlayerDashboard() {
  const { user, logout } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loyaltyCard, setLoyaltyCard] = useState(null);
  const [nextGames, setNextGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [reservationsRes, loyaltyRes, gamesRes] = await Promise.all([
        api.get('/player/reservations'),
        api.get('/player/loyalty'),
        api.get('/games'),
      ]);

      setReservations(reservationsRes.data.reservations || []);
      setLoyaltyCard(loyaltyRes.data);
      setNextGames(gamesRes.data.games?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', class: 'bg-alerta/10 text-alerta border-alerta/30' },
      confirmed: { text: 'Confirmada', class: 'bg-operativo/10 text-operativo border-operativo/30' },
      cancelled: { text: 'Cancelada', class: 'bg-emergencia/10 text-emergencia border-emergencia/30' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wider border ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-white text-xl font-tactical">CARGANDO OPERACIONES...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-comando-900 border-b-2 border-comando-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <div className="text-white font-black text-lg font-tactical">CLUB SIGCA</div>
                <div className="text-comando-200 text-xs uppercase tracking-wider">Panel de combatiente</div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-white font-semibold">{user?.name}</div>
                <div className="text-comando-200 text-sm">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-3 py-1 mb-3">
            <div className="w-2 h-2 bg-accion rounded-full animate-pulse"></div>
            <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
              Operativo
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-tactical mb-2">
            BIENVENIDO, {user?.name?.split(' ')[0]?.toUpperCase()}
          </h1>
          <p className="text-comando-200 text-lg">
            Tu centro de operaciones tácticas
          </p>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Cartilla + Stats */}
          <div className="space-y-6">
            {/* Cartilla de fidelización */}
            <div className="bg-gradient-to-br from-accion-900 to-accion-800 border-2 border-accion-600 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-alerta" />
                <h2 className="text-xl font-black text-white font-tactical">CARTILLA DE SELLOS</h2>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-black text-white font-tactical mb-1">
                  {loyaltyCard?.stamps_count || 0} / 5
                </div>
                <div className="text-accion-100 text-sm">
                  {loyaltyCard?.stamps_remaining || 5} sellos para partida gratis
                </div>
              </div>

              {/* Visualización de sellos */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center border-2 ${
                      i < (loyaltyCard?.stamps_count || 0)
                        ? 'bg-alerta border-alerta'
                        : 'bg-accion-900/50 border-accion-700'
                    }`}
                  >
                    {i < (loyaltyCard?.stamps_count || 0) && (
                      <Crosshair className="w-6 h-6 text-accion-900" strokeWidth={3} />
                    )}
                  </div>
                ))}
              </div>

              {/* Créditos disponibles */}
              {loyaltyCard?.available_credits > 0 && (
                <div className="bg-alerta/20 border border-alerta px-4 py-3 mb-4">
                  <div className="text-alerta font-bold text-sm uppercase tracking-wide">
                    ¡Tienes {loyaltyCard.available_credits} partida{loyaltyCard.available_credits > 1 ? 's' : ''} gratis!
                  </div>
                </div>
              )}

              <Link
                to="/player/loyalty"
                className="block text-center bg-accion hover:bg-accion-600 text-white font-bold py-2 transition-colors font-tactical uppercase text-sm"
              >
                Ver detalles
              </Link>
            </div>

            {/* Stats rápidas */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <h2 className="text-lg font-black text-white font-tactical mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-accion" />
                TUS ESTADÍSTICAS
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-comando-200 text-sm">Partidas jugadas</span>
                  <span className="text-white font-bold font-tactical text-xl">
                    {loyaltyCard?.loyalty_card?.total_stamps_earned || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-comando-200 text-sm">Reservas activas</span>
                  <span className="text-white font-bold font-tactical text-xl">
                    {reservations.filter(r => r.status !== 'cancelled').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-comando-200 text-sm">Créditos gratis</span>
                  <span className="text-alerta font-bold font-tactical text-xl">
                    {loyaltyCard?.available_credits || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Próximas partidas + Mis reservas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Próximas partidas */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white font-tactical flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accion" />
                  PRÓXIMAS MISIONES
                </h2>
                <Link
                  to="/games"
                  className="text-accion hover:text-accion-400 font-tactical uppercase text-sm flex items-center gap-1"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {nextGames.length === 0 ? (
                <div className="text-center py-8 text-comando-300">
                  No hay partidas programadas próximamente
                </div>
              ) : (
                <div className="space-y-4">
                  {nextGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-carbon border border-comando-800 p-4 hover:border-accion transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white font-tactical mb-1">
                            {game.title}
                          </h3>
                          <div className="flex items-center gap-4 text-comando-200 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(game.starts_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {game.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-accion font-tactical">
                            {game.price}€
                          </div>
                          <div className="text-comando-200 text-xs">
                            {game.available_slots} plazas
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/games"
                        className="block text-center bg-accion hover:bg-accion-600 text-white font-bold py-2 transition-colors font-tactical uppercase text-sm"
                      >
                        Reservar plaza
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mis reservas recientes */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white font-tactical flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accion" />
                  MIS RESERVAS
                </h2>
                <Link
                  to="/player/reservations"
                  className="text-accion hover:text-accion-400 font-tactical uppercase text-sm flex items-center gap-1"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-comando-300 mb-4">
                    Aún no tienes reservas
                  </div>
                  <Link
                    to="/games"
                    className="inline-block bg-accion hover:bg-accion-600 text-white font-bold py-2 px-6 transition-colors font-tactical uppercase text-sm"
                  >
                    Reservar partida
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 5).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="bg-carbon border border-comando-800 p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="text-white font-semibold mb-1">
                          {reservation.game?.title}
                        </div>
                        <div className="text-comando-200 text-sm flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(reservation.game?.starts_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {reservation.game?.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(reservation.status)}
                        <div className="text-white font-bold mt-1">
                          {reservation.payment?.amount}€
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}