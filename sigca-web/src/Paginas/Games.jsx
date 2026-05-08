import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../Servicios/api';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Euro,
  ArrowRight,
  LogOut,
  User
} from 'lucide-react';
import Logo from '../Componentes/Logo';
import WhatsAppButton from '../Componentes/WhatsAppButton';
import { GameCardSkeleton } from '../Componentes/SkeletonLoaders';

export default function Games() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await api.get('/games');
      let gamesData = response.data?.games || response.data || [];
      setGames(Array.isArray(gamesData) ? gamesData : []);
    } catch (error) {
      console.error('Error cargando partidas:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (gameId) => {
    if (!user) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'player') {
      alert('Solo los jugadores pueden hacer reservas');
      return;
    }

    setReserving(gameId);
    try {
      await api.post('/player/reservations', { game_id: gameId });
      alert('¡Reserva realizada con éxito! Revisa tu panel para ver los detalles.');
      window.location.href = '/player/reservations';
    } catch (error) {
      alert(error.response?.data?.message || 'Error al hacer la reserva');
      setReserving(null);
    }
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-white text-xl font-tactical">CARGANDO MISIONES...</div>
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
                <div className="text-comando-200 text-xs uppercase tracking-wider">Calendario de misiones</div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/player'}
                    className="hidden sm:flex items-center gap-2 text-accion hover:text-accion-400 font-tactical uppercase text-sm transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mi panel
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
                  >
                    Acceso
                  </Link>
                  <Link
                    to="/register"
                    className="bg-accion hover:bg-accion-600 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
                  >
                    Registro
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero mini */}
      <section className="bg-gradient-to-b from-comando-900 to-carbon py-12 border-b border-comando-800">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-3 py-1 mb-4">
            <div className="w-2 h-2 bg-accion rounded-full animate-pulse"></div>
            <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
              Misiones disponibles
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-tactical mb-3">
            CALENDARIO DE PARTIDAS
          </h1>
          <p className="text-comando-200 text-lg">
            Reserva tu plaza en las próximas operaciones tácticas
          </p>
        </div>
      </section>

      {/* Lista de partidas */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="bg-comando-900 border border-comando-700 p-12 text-center">
              <Calendar className="w-16 h-16 text-comando-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white font-tactical mb-2">
                NO HAY PARTIDAS PROGRAMADAS
              </h3>
              <p className="text-comando-200 mb-6">
                Vuelve pronto para ver las próximas misiones
              </p>
              <Link
                to="/"
                className="inline-block bg-accion hover:bg-accion-600 text-white font-bold py-3 px-6 transition-colors font-tactical uppercase"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => {
                const dateInfo = formatDateShort(game.starts_at);
                const isFull = game.available_slots === 0;
                const isAlmostFull = game.available_slots > 0 && game.available_slots <= 5;
                const isLastSpots = game.available_slots > 0 && game.available_slots <= 2;
                
                return (
                  <div
                    key={game.id}
                    className={`bg-comando-900 border-2 hover:border-accion transition-all group relative slide-up ${
                      isLastSpots ? 'border-emergencia' : isAlmostFull ? 'border-alerta' : 'border-comando-700'
                    }`}
                  >
                    {/* Badge de popularidad */}
                    {isLastSpots && (
                      <div className="absolute top-4 right-4 z-10 bg-emergencia text-white px-3 py-1 text-xs font-black uppercase tracking-wider animate-pulse">
                        ⚠️ ÚLTIMAS PLAZAS
                      </div>
                    )}
                    {isAlmostFull && !isLastSpots && (
                      <div className="absolute top-4 right-4 z-10 bg-alerta text-carbon px-3 py-1 text-xs font-black uppercase tracking-wider">
                        🔥 CASI LLENA
                      </div>
                    )}
                    
                    {/* Fecha destacada */}
                    <div className="bg-accion p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-3xl font-black text-white font-tactical leading-none">
                            {dateInfo.day}
                          </div>
                          <div className="text-xs text-accion-100 font-bold mt-1">
                            {dateInfo.month}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-white/30"></div>
                        <div>
                          <div className="text-white font-bold text-sm">
                            {new Date(game.starts_at).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="text-accion-100 text-xs">
                            Hora de inicio
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                      <h3 className="text-xl font-black text-white font-tactical mb-3">
                        {game.title}
                      </h3>

                      {game.description && (
                        <p className="text-comando-200 text-sm mb-4 line-clamp-2">
                          {game.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-comando-200 text-sm">
                          <MapPin className="w-4 h-4 text-accion" />
                          <span>{game.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-comando-200 text-sm">
                          <Users className="w-4 h-4 text-accion" />
                          <span>
                            {game.available_slots} / {game.max_slots} plazas disponibles
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-comando-200 text-sm">
                          <Euro className="w-4 h-4 text-accion" />
                          <span className="text-2xl font-black text-white font-tactical">
                            {game.price}€
                          </span>
                        </div>
                      </div>

                      {/* Barra de ocupación */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-comando-300 mb-1">
                          <span>Ocupación</span>
                          <span>
                            {Math.round(((game.max_slots - game.available_slots) / game.max_slots) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-carbon">
                          <div
                            className={`h-full transition-all ${
                              isFull ? 'bg-emergencia' : 'bg-operativo'
                            }`}
                            style={{
                              width: `${((game.max_slots - game.available_slots) / game.max_slots) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Botón de reserva */}
                      {user?.role === 'player' ? (
                        <button
                          onClick={() => handleReserve(game.id)}
                          disabled={isFull || reserving === game.id}
                          className="w-full group relative overflow-hidden bg-accion text-white font-bold py-3 font-tactical uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accion-600 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          <span className="relative flex items-center justify-center gap-2">
                            {reserving === game.id ? 'PROCESANDO...' : isFull ? 'SIN PLAZAS' : 'RESERVAR PLAZA'}
                            {!isFull && reserving !== game.id && <ArrowRight className="w-4 h-4" />}
                          </span>
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className="block w-full text-center bg-accion hover:bg-accion-600 text-white font-bold py-3 transition-colors font-tactical uppercase text-sm"
                        >
                          Inicia sesión para reservar
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {!user && games.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-carbon to-comando-900 border-t border-comando-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white font-tactical mb-4">
              ¿AÚN NO ERES MIEMBRO?
            </h2>
            <p className="text-comando-200 text-lg mb-8 max-w-2xl mx-auto">
              Regístrate en el Club SIGCA y reserva tu plaza en las próximas misiones tácticas
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-accion hover:bg-accion-600 text-white font-bold py-4 px-8 transition-colors font-tactical uppercase text-lg"
            >
              Registrarse ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-carbon border-t-2 border-comando-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <div className="text-white font-black text-lg font-tactical">CLUB SIGCA</div>
                <div className="text-comando-300 text-xs uppercase tracking-wider">La Palma del Condado · Huelva</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-comando-200 font-tactical uppercase tracking-wider">
              <Link to="/" className="hover:text-accion transition-colors">Inicio</Link>
              <Link to="/games" className="hover:text-accion transition-colors">Partidas</Link>
              {!user && <Link to="/register" className="hover:text-accion transition-colors">Registro</Link>}
            </div>
            <p className="text-comando-400 text-xs">
              © 2026 CLUB SIGCA
            </p>
          </div>
        </div>
      </footer>
      
      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton />
    </div>
  );
}