import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  LogOut,
  ArrowLeft,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Logo from '../../Componentes/Logo';
import MobileMenu from '../../Componentes/MobileMenu';

export default function PlayerReservations() {
  const { user, logout } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'cancelled'

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await api.get('/player/reservations');
      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    setCancelling(reservationId);
    try {
      await api.delete(`/player/reservations/${reservationId}`);
      alert('Reserva cancelada correctamente');
      loadReservations(); // Recargar la lista
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cancelar la reserva');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        text: 'Pendiente pago', 
        class: 'bg-alerta/10 text-alerta border-alerta/30',
        icon: AlertCircle 
      },
      confirmed: { 
        text: 'Confirmada', 
        class: 'bg-operativo/10 text-operativo border-operativo/30',
        icon: CheckCircle 
      },
      cancelled: { 
        text: 'Cancelada', 
        class: 'bg-emergencia/10 text-emergencia border-emergencia/30',
        icon: XCircle 
      },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (payment) => {
    if (!payment) return null;
    
    const badges = {
      pending: { text: 'Pago pendiente', class: 'bg-alerta/10 text-alerta border-alerta/30' },
      paid: { text: 'Pagado', class: 'bg-operativo/10 text-operativo border-operativo/30' },
      refunded: { text: 'Reembolsado', class: 'bg-comando-700/50 text-comando-200 border-comando-600' },
    };
    
    const badge = badges[payment.status] || badges.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wider border ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const canCancel = (reservation) => {
    if (reservation.status === 'cancelled') return false;
    const gameDate = new Date(reservation.game?.starts_at);
    const now = new Date();
    return gameDate > now;
  };

  const getFilteredReservations = () => {
    switch (filter) {
      case 'active':
        return reservations.filter(r => r.status !== 'cancelled');
      case 'cancelled':
        return reservations.filter(r => r.status === 'cancelled');
      default:
        return reservations;
    }
  };

  const filteredReservations = getFilteredReservations();

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-white text-xl font-tactical">CARGANDO RESERVAS...</div>
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
                <div className="text-comando-200 text-xs uppercase tracking-wider">Mis reservas</div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/player/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                <div className="text-white font-semibold">{user?.name}</div>
                <div className="text-comando-200 text-sm">{user?.email}</div>
              </Link>
              <button
                onClick={logout}
                className="hidden lg:flex items-center gap-2 bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
              <MobileMenu user={user} logout={logout} />
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
              Historial completo
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-tactical mb-2">
            MIS RESERVAS
          </h1>
          <p className="text-comando-200 text-lg">
            Gestiona tus partidas reservadas
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-comando-900 border border-comando-700 p-4">
            <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">Total reservas</div>
            <div className="text-3xl font-black text-white font-tactical">
              {reservations.length}
            </div>
          </div>
          <div className="bg-comando-900 border border-comando-700 p-4">
            <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">Activas</div>
            <div className="text-3xl font-black text-operativo font-tactical">
              {reservations.filter(r => r.status !== 'cancelled').length}
            </div>
          </div>
          <div className="bg-comando-900 border border-comando-700 p-4">
            <div className="text-comando-200 text-sm uppercase tracking-wide mb-1">Canceladas</div>
            <div className="text-3xl font-black text-emergencia font-tactical">
              {reservations.filter(r => r.status === 'cancelled').length}
            </div>
          </div>
        </div>

        {/* Filtros en pestañas */}
        <div className="flex gap-2 mb-8 border-b border-comando-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 font-tactical uppercase text-sm transition-all ${
              filter === 'all'
                ? 'bg-accion text-white border-b-2 border-accion'
                : 'text-comando-200 hover:text-white hover:bg-comando-800'
            }`}
          >
            Todas ({reservations.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-3 font-tactical uppercase text-sm transition-all ${
              filter === 'active'
                ? 'bg-accion text-white border-b-2 border-accion'
                : 'text-comando-200 hover:text-white hover:bg-comando-800'
            }`}
          >
            Activas ({reservations.filter(r => r.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-6 py-3 font-tactical uppercase text-sm transition-all ${
              filter === 'cancelled'
                ? 'bg-accion text-white border-b-2 border-accion'
                : 'text-comando-200 hover:text-white hover:bg-comando-800'
            }`}
          >
            Canceladas ({reservations.filter(r => r.status === 'cancelled').length})
          </button>
        </div>

        {/* Lista de reservas */}
        {filteredReservations.length === 0 ? (
          <div className="bg-comando-900 border border-comando-700 p-12 text-center">
            <Calendar className="w-16 h-16 text-comando-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white font-tactical mb-2">
              {filter === 'all' && 'NO TIENES RESERVAS'}
              {filter === 'active' && 'NO TIENES RESERVAS ACTIVAS'}
              {filter === 'cancelled' && 'NO TIENES RESERVAS CANCELADAS'}
            </h3>
            <p className="text-comando-200 mb-6">
              {filter === 'all' && 'Reserva tu plaza en una partida para empezar'}
              {filter === 'active' && 'Todas tus reservas han sido canceladas'}
              {filter === 'cancelled' && 'No has cancelado ninguna reserva'}
            </p>
            {filter !== 'cancelled' && (
              <Link
                to="/games"
                className="inline-block bg-accion hover:bg-accion-600 text-white font-bold py-3 px-6 transition-colors font-tactical uppercase"
              >
                Ver partidas disponibles
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-comando-900 border-2 border-comando-700 hover:border-accion transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Info de la partida */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-accion p-3">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-white font-tactical mb-2">
                            {reservation.game?.title}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-comando-200 text-sm">
                              <Clock className="w-4 h-4 text-accion" />
                              <span>{formatDate(reservation.game?.starts_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-comando-200 text-sm">
                              <MapPin className="w-4 h-4 text-accion" />
                              <span>{reservation.game?.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Estados */}
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(reservation.status)}
                        {getPaymentStatusBadge(reservation.payment)}
                        {reservation.free_credit_id && (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider border bg-alerta/10 text-alerta border-alerta/30">
                            Partida gratis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precio y acciones */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-black text-white font-tactical">
                          {reservation.payment?.amount || 0}€
                        </div>
                        <div className="text-comando-200 text-xs uppercase">
                          {reservation.payment?.method === 'free' ? 'Gratis' : reservation.payment?.method || 'Efectivo'}
                        </div>
                      </div>

                      {canCancel(reservation) && (
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          disabled={cancelling === reservation.id}
                          className="flex items-center gap-2 bg-emergencia/10 hover:bg-emergencia hover:text-white text-emergencia border border-emergencia px-4 py-2 transition-all font-tactical uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling === reservation.id ? (
                            'Cancelando...'
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Cancelar reserva
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nota si está cancelada */}
                  {reservation.status === 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-comando-800">
                      <p className="text-comando-300 text-sm">
                        Esta reserva fue cancelada. {reservation.payment?.status === 'refunded' && 'El crédito gratuito ha sido devuelto a tu cuenta.'}
                      </p>
                    </div>
                  )}

                  {/* Nota si está pendiente de pago */}
                  {reservation.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-comando-800">
                      <div className="bg-alerta/10 border border-alerta/30 p-3">
                        <p className="text-alerta text-sm">
                          <strong>Pendiente de confirmación:</strong> Realiza el pago de {reservation.payment?.amount}€ en efectivo o Bizum al llegar al campo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {reservations.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/games"
              className="inline-block bg-accion hover:bg-accion-600 text-white font-bold py-3 px-6 transition-colors font-tactical uppercase"
            >
              Reservar otra partida
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}