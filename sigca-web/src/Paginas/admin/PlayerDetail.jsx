import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  ArrowLeft, User, Mail, Phone, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, Euro, Gift, Star,
  Calendar, Stamp, X
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Logo from '../../Componentes/Logo';
import NotificationBell from '../../Componentes/NotificationBell';

const STATUS_CONFIG = {
  active:  { label: 'Activo',     badge: 'bg-green-100 border-green-300 text-green-800' },
  warned:  { label: 'Advertido',  badge: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  blocked: { label: 'Bloqueado',  badge: 'bg-red-100 border-red-300 text-red-800' },
};

const RESERVATION_STATUS = {
  pending:   { label: 'Pendiente',       cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  confirmed: { label: 'Confirmada',      cls: 'bg-green-100 text-green-800 border-green-300' },
  attended:  { label: 'Asistió',         cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  no_show:   { label: 'No se presentó',  cls: 'bg-red-100 text-red-800 border-red-300' },
  cancelled: { label: 'Cancelada',       cls: 'bg-gray-100 text-gray-600 border-gray-300' },
};

const PAYMENT_METHOD = { bizum: 'Bizum', cash: 'Efectivo', transfer: 'Transferencia', free: 'Bono gratis' };

export default function AdminPlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [player, setPlayer]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [statusForm, setStatusForm] = useState('');

  useEffect(() => { loadPlayer(); }, [id]);

  const loadPlayer = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/players/${id}`);
      const p = res.data.player ?? res.data;
      setPlayer(normalize(p));
      setStatusForm(p.status || 'active');
    } catch {
      navigate('/admin/players');
    } finally {
      setLoading(false);
    }
  };

  const normalize = (p) => ({
    ...p,
    name:  p.user?.name  || p.name  || 'Sin nombre',
    email: p.user?.email || p.email || 'Sin email',
  });

  const handleStatusSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/players/${id}`, { status: statusForm });
      setPlayer(prev => ({ ...prev, status: statusForm }));
      setModal(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredit = async () => {
    try {
      const res = await api.post(`/admin/players/${id}/credits`);
      setPlayer(prev => ({
        ...prev,
        loyalty_card: { ...prev.loyalty_card, available_credits: res.data.available_credits },
      }));
    } catch (e) {
      alert(e.response?.data?.message || 'Error al añadir bono');
    }
  };

  const handleRemoveCredit = async () => {
    try {
      const res = await api.delete(`/admin/players/${id}/credits`);
      setPlayer(prev => ({
        ...prev,
        loyalty_card: { ...prev.loyalty_card, available_credits: res.data.available_credits },
      }));
    } catch (e) {
      alert(e.response?.data?.message || 'Error al quitar bono');
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 font-tactical uppercase tracking-wider">Cargando jugador...</p>
      </div>
    );
  }

  const reservations    = player.reservations || [];
  const loyaltyCard     = player.loyalty_card  || player.loyaltyCard || {};
  const stampsCount     = loyaltyCard.stamps_count || 0;
  const availableCredits = loyaltyCard.available_credits ?? loyaltyCard.freeGameCredits?.filter(c => c.status === 'available').length ?? 0;
  const totalCredits    = loyaltyCard.total_credits_earned || 0;

  const activeReservations  = reservations.filter(r => r.status !== 'cancelled');
  const totalPaid = reservations
    .filter(r => r.payment?.status === 'paid' && r.payment?.method !== 'free')
    .reduce((sum, r) => sum + parseFloat(r.payment?.amount || 0), 0);
  const pendingCount = reservations.filter(r => r.payment?.status === 'pending').length;

  const statusCfg = STATUS_CONFIG[player.status] || STATUS_CONFIG.active;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <div>
                  <div className="text-gray-900 font-black text-lg font-tactical">CLUB SIGCA</div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider">Panel Admin</div>
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
                <span>/</span>
                <Link to="/admin/players" className="text-gray-500 hover:text-accion transition-colors font-tactical uppercase">Jugadores</Link>
                <span>/</span>
                <span className="text-gray-700 font-tactical uppercase">{player.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/admin/players"
                className="hidden lg:flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition-colors font-tactical uppercase text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Link>
              <NotificationBell />
              <MobileMenu user={user} logout={logout} dark={false} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        {/* Cabecera del jugador */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar / Iniciales */}
            <div className="w-16 h-16 rounded-full bg-accion/20 border-2 border-accion/40 flex items-center justify-center flex-shrink-0">
              {player.avatar
                ? <img src={`/storage/${player.avatar}`} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                : <span className="text-accion text-2xl font-black font-tactical">
                    {player.name?.charAt(0)?.toUpperCase()}
                  </span>
              }
            </div>

            {/* Datos */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-gray-900 font-tactical">{player.name}</h1>
                <span className={`px-2 py-0.5 border rounded text-xs font-bold uppercase ${statusCfg.badge}`}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{player.email}</span>
                {player.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{player.phone}</span>}
                {player.alias && <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />"{player.alias}"</span>}
              </div>
              {player.notes && (
                <p className="mt-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
                  Nota: {player.notes}
                </p>
              )}
            </div>

            {/* Botón cambiar estado */}
            <button
              onClick={() => setModal('status')}
              className="flex-shrink-0 flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition-colors font-tactical uppercase text-sm"
            >
              <Shield className="w-4 h-4" />
              Cambiar estado
            </button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Reservas</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">{activeReservations.length}</p>
            <p className="text-gray-400 text-xs mt-1">{reservations.length} en total</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total pagado</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">{totalPaid.toFixed(2)}€</p>
            {pendingCount > 0 && (
              <p className="text-yellow-600 text-xs mt-1 font-semibold">{pendingCount} pago(s) pendiente(s)</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Sellos</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">{stampsCount}<span className="text-gray-400 text-lg">/5</span></p>
            <p className="text-gray-400 text-xs mt-1">{loyaltyCard.total_stamps_earned || 0} acumulados</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Bonos</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveCredit}
                disabled={availableCredits === 0}
                className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >-</button>
              <p className={`text-3xl font-black font-tactical ${availableCredits > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {availableCredits}
              </p>
              <button
                onClick={handleAddCredit}
                className="w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded font-bold transition-colors"
              >+</button>
            </div>
            <p className="text-gray-400 text-xs mt-1">{totalCredits} generados en total</p>
          </div>
        </div>

        {/* Cartilla de sellos visual */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 font-tactical uppercase mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Cartilla de fidelización
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  i < stampsCount
                    ? 'bg-yellow-400 border-yellow-500 shadow-md'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Star className={`w-6 h-6 ${i < stampsCount ? 'text-white' : 'text-gray-300'}`} />
              </div>
            ))}
            <div className="ml-4 text-sm text-gray-500">
              {stampsCount >= 5
                ? <span className="text-green-600 font-bold">¡Cartilla completa! Bono generado.</span>
                : <span>{5 - stampsCount} sello{5 - stampsCount !== 1 ? 's' : ''} para el próximo bono</span>
              }
            </div>
          </div>
        </div>

        {/* Historial de reservas */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900 font-tactical uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accion" />
              Historial de partidas
            </h2>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 font-tactical uppercase text-sm">Sin reservas registradas</p>
            </div>
          ) : (
            <>
              {/* Cabecera */}
              <div className="hidden md:grid grid-cols-[1fr_140px_110px_110px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Partida</span>
                <span>Fecha</span>
                <span>Estado reserva</span>
                <span>Pago</span>
                <span>Método</span>
              </div>

              <div className="divide-y divide-gray-100">
                {reservations
                  .slice()
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(r => {
                    const resCfg = RESERVATION_STATUS[r.status] || RESERVATION_STATUS.pending;
                    const isFree = r.payment?.method === 'free';
                    return (
                      <div
                        key={r.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_140px_110px_110px_100px] gap-2 md:gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Partida */}
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{r.game?.title || '—'}</p>
                          <p className="text-gray-400 text-xs">{formatDate(r.game?.starts_at)}</p>
                        </div>

                        {/* Fecha reserva */}
                        <div className="text-gray-500 text-xs">{formatDate(r.created_at)}</div>

                        {/* Estado */}
                        <div>
                          <span className={`px-2 py-0.5 border rounded text-xs font-bold uppercase ${resCfg.cls}`}>
                            {resCfg.label}
                          </span>
                        </div>

                        {/* Importe */}
                        <div className="text-sm font-bold">
                          {isFree
                            ? <span className="text-green-600">Gratis</span>
                            : r.payment?.status === 'paid'
                              ? <span className="text-green-700">{r.payment.amount}€ ✓</span>
                              : r.payment?.status === 'pending'
                                ? <span className="text-yellow-600">{r.payment.amount}€ ⏳</span>
                                : r.payment?.status === 'refunded'
                                  ? <span className="text-gray-500">Reembolsado</span>
                                  : <span className="text-gray-400">—</span>
                          }
                        </div>

                        {/* Método */}
                        <div className="text-gray-500 text-xs">
                          {PAYMENT_METHOD[r.payment?.method] || '—'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal cambiar estado */}
      {modal === 'status' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-black font-tactical uppercase">Estado del jugador</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    statusForm === key ? 'border-accion bg-accion/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={key}
                    checked={statusForm === key}
                    onChange={() => setStatusForm(key)}
                    className="accent-accion"
                  />
                  <span className={`px-2 py-0.5 border rounded text-xs font-bold uppercase ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </label>
              ))}
              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleStatusSave}
                disabled={saving}
                className="flex-1 bg-accion hover:bg-accion-600 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
