import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import { 
  Trophy, 
  LogOut,
  ArrowLeft,
  Crosshair,
  Calendar,
  CheckCircle,
  Gift
} from 'lucide-react';
import Logo from '../../Componentes/Logo';

export default function PlayerLoyalty() {
  const { user, logout } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const response = await api.get('/player/loyalty');
      setLoyaltyData(response.data);
    } catch (error) {
      console.error('Error cargando datos de fidelización:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-white text-xl font-tactical">CARGANDO CARTILLA...</div>
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
                <div className="text-comando-200 text-xs uppercase tracking-wider">Mi cartilla</div>
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/player" 
            className="inline-flex items-center gap-2 text-accion hover:text-accion-400 font-tactical uppercase text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Link>
        </div>

        {/* Header de sección */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-3 py-1 mb-3">
            <div className="w-2 h-2 bg-accion rounded-full animate-pulse"></div>
            <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
              Programa de fidelización
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-tactical mb-2">
            MI CARTILLA DE SELLOS
          </h1>
          <p className="text-comando-200 text-lg">
            Cada 5 partidas jugadas, ganas 1 partida gratis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Cartilla actual */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cartilla visual */}
            <div className="bg-gradient-to-br from-accion-900 to-accion-800 border-2 border-accion-600 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-alerta" />
                <h2 className="text-2xl font-black text-white font-tactical">CARTILLA ACTUAL</h2>
              </div>

              {/* Progreso */}
              <div className="mb-8">
                <div className="flex items-baseline gap-3 mb-2">
                  <div className="text-5xl font-black text-white font-tactical">
                    {loyaltyData?.stamps_count || 0}
                  </div>
                  <div className="text-2xl text-accion-100 font-tactical">/ 5 sellos</div>
                </div>
                <div className="text-accion-100 text-sm mb-4">
                  {loyaltyData?.stamps_remaining === 0 
                    ? '¡Cartilla completa! Ya puedes canjear tu partida gratis' 
                    : `Te ${loyaltyData?.stamps_remaining === 1 ? 'falta' : 'faltan'} ${loyaltyData?.stamps_remaining} ${loyaltyData?.stamps_remaining === 1 ? 'sello' : 'sellos'} para tu próxima partida gratis`
                  }
                </div>

                {/* Barra de progreso */}
                <div className="h-3 bg-accion-900/50 mb-2">
                  <div
                    className="h-full bg-alerta transition-all duration-500"
                    style={{
                      width: `${((loyaltyData?.stamps_count || 0) / 5) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Visualización de sellos 5x2 */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center border-2 transition-all ${
                      i < (loyaltyData?.stamps_count || 0)
                        ? 'bg-alerta border-alerta shadow-lg'
                        : 'bg-accion-900/50 border-accion-700'
                    }`}
                  >
                    {i < (loyaltyData?.stamps_count || 0) && (
                      <Crosshair className="w-8 h-8 text-accion-900" strokeWidth={3} />
                    )}
                  </div>
                ))}
              </div>

              {/* Créditos disponibles */}
              {loyaltyData?.available_credits > 0 && (
                <div className="bg-alerta/20 border-2 border-alerta px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-alerta" />
                    <div>
                      <div className="text-alerta font-black text-lg uppercase tracking-wide font-tactical">
                        ¡Tienes {loyaltyData.available_credits} {loyaltyData.available_credits === 1 ? 'partida gratis' : 'partidas gratis'} disponible{loyaltyData.available_credits > 1 ? 's' : ''}!
                      </div>
                      <div className="text-alerta/80 text-sm">
                        Se aplicarán automáticamente en tu próxima reserva
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de sellos ganados */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <h2 className="text-xl font-black text-white font-tactical mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accion" />
                HISTORIAL DE SELLOS
              </h2>

              {!loyaltyData?.loyalty_card?.stamps || loyaltyData.loyalty_card.stamps.length === 0 ? (
                <div className="text-center py-8 text-comando-300">
                  Aún no has ganado ningún sello. ¡Juega tu primera partida!
                </div>
              ) : (
                <div className="space-y-3">
                  {loyaltyData.loyalty_card.stamps.map((stamp) => (
                    <div
                      key={stamp.id}
                      className="bg-carbon border border-comando-800 p-4 flex items-center justify-between hover:border-accion transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-alerta flex items-center justify-center">
                          <Crosshair className="w-6 h-6 text-carbon" strokeWidth={3} />
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            Sello #{stamp.stamp_number}
                          </div>
                          <div className="text-comando-200 text-sm">
                            {stamp.reservation?.game?.title || 'Partida'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-comando-200 text-xs uppercase tracking-wide">
                          Ganado el
                        </div>
                        <div className="text-white font-semibold">
                          {formatDate(stamp.earned_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Stats y créditos usados */}
          <div className="space-y-6">
            {/* Estadísticas generales */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <h2 className="text-lg font-black text-white font-tactical mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accion" />
                ESTADÍSTICAS
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">
                    Total sellos ganados
                  </div>
                  <div className="text-3xl font-black text-white font-tactical">
                    {loyaltyData?.loyalty_card?.total_stamps_earned || 0}
                  </div>
                </div>
                <div>
                  <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">
                    Cartillas completadas
                  </div>
                  <div className="text-3xl font-black text-operativo font-tactical">
                    {Math.floor((loyaltyData?.loyalty_card?.total_stamps_earned || 0) / 5)}
                  </div>
                </div>
                <div>
                  <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">
                    Créditos disponibles
                  </div>
                  <div className="text-3xl font-black text-alerta font-tactical">
                    {loyaltyData?.available_credits || 0}
                  </div>
                </div>
                <div>
                  <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">
                    Créditos usados
                  </div>
                  <div className="text-3xl font-black text-comando-400 font-tactical">
                    {loyaltyData?.used_credits || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Cómo funciona */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <h2 className="text-lg font-black text-white font-tactical mb-4">
                ¿CÓMO FUNCIONA?
              </h2>
              <div className="space-y-3 text-sm text-comando-200">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accion flex items-center justify-center text-white font-bold text-xs">
                    1
                  </div>
                  <p>Asiste a una partida y gana 1 sello</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accion flex items-center justify-center text-white font-bold text-xs">
                    2
                  </div>
                  <p>Completa 5 sellos para obtener 1 crédito gratis</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accion flex items-center justify-center text-white font-bold text-xs">
                    3
                  </div>
                  <p>El crédito se aplica automáticamente en tu próxima reserva</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accion flex items-center justify-center text-white font-bold text-xs">
                    4
                  </div>
                  <p>Los sellos se ganan tras confirmar asistencia</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/games"
              className="block text-center bg-accion hover:bg-accion-600 text-white font-bold py-3 transition-colors font-tactical uppercase"
            >
              Ver partidas disponibles
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}