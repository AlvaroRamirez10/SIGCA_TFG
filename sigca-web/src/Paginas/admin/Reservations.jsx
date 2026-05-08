import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  Activity, ArrowLeft, Search, Filter,
  CheckCircle, XCircle, AlertTriangle, X, Clock
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Pagination from '../../Componentes/Pagination';
import NotificationBell from '../../Componentes/NotificationBell';
import Logo from '../../Componentes/Logo';

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',        badge: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  confirmed: { label: 'Confirmada',       badge: 'bg-green-100 border-green-300 text-green-800' },
  attended:  { label: 'Asistió',          badge: 'bg-green-200 border-green-400 text-green-900' },
  no_show:   { label: 'No se presentó',   badge: 'bg-red-100 border-red-300 text-red-800' },
  cancelled: { label: 'Cancelada',        badge: 'bg-gray-100 border-gray-300 text-gray-600' },
};

const ACTION_CONFIG = {
  confirm: { label: 'Confirmar reserva',     btn: 'Confirmar',        btnClass: 'bg-green-600 hover:bg-green-700' },
  attend:  { label: 'Marcar asistencia',     btn: 'Marcar asistido',  btnClass: 'bg-green-600 hover:bg-green-700' },
  noshow:  { label: 'Marcar no presentado',  btn: 'Marcar no-show',   btnClass: 'bg-yellow-500 hover:bg-yellow-600' },
  cancel:  { label: 'Cancelar reserva',      btn: 'Cancelar reserva', btnClass: 'bg-red-600 hover:bg-red-700' },
};

export default function AdminReservations() {
  const { user, logout } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(page); }, [page]);

  const loadData = async (p = 1) => {
    setLoading(true);
    try {
      const [resRes, gamesRes] = await Promise.all([
        api.get('/admin/reservations', { params: { page: p } }),
        api.get('/admin/games', { params: { page: 1, per_page: 100 } }),
      ]);

      let reservationsData = resRes.data?.data || resRes.data?.reservations || resRes.data || [];
      let gamesData = gamesRes.data?.data || gamesRes.data?.games || gamesRes.data || [];

      if (Array.isArray(reservationsData)) {
        reservationsData = reservationsData.map(res => ({
          ...res,
          player: res.player ? {
            ...res.player,
            name: res.player?.user?.name || res.player?.name || 'Sin nombre',
            email: res.player?.user?.email || res.player?.email || 'Sin email'
          } : res.player
        }));
      }

      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      setLastPage(resRes.data?.last_page || 1);
      setTotal(resRes.data?.total || reservationsData.length);
      setGames(Array.isArray(gamesData) ? gamesData : []);
    } catch (e) {
      console.error('Error cargando reservas:', e);
      setReservations([]);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const openAction = (reservation, action) => {
    setSelected({ ...reservation, action });
    setError('');
    setModal('action');
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const normalizeReservation = (raw) => ({
    ...raw,
    player: raw.player ? {
      ...raw.player,
      name:  raw.player?.user?.name  || raw.player?.name  || 'Sin nombre',
      email: raw.player?.user?.email || raw.player?.email || 'Sin email',
    } : raw.player,
  });

  const handleAction = async () => {
    setSaving(true);
    const { action, id } = selected;
    try {
      if (action === 'confirm') {
        const res = await api.patch(`/admin/reservations/${id}/confirm`, {});
        const updated = normalizeReservation(res.data.reservation);
        setReservations(prev => prev.map(r => r.id === id ? updated : r));
      } else if (action === 'attend' || action === 'noshow') {
        const res = await api.patch(`/admin/reservations/${id}/attendance`, { attended: action === 'attend' });
        const updated = normalizeReservation(res.data.reservation);
        setReservations(prev => prev.map(r => r.id === id ? updated : r));
      } else if (action === 'cancel') {
        await api.delete(`/admin/reservations/${id}`);
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      }
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al actualizar reserva');
    } finally {
      setSaving(false);
    }
  };

  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.player?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.player?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.game?.title?.toLowerCase().includes(search.toLowerCase());
    const matchGame   = !filterGame   || String(r.game_id) === filterGame;
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchGame && matchStatus;
  });

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

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
              <div className="hidden md:flex items-center gap-2 text-gray-400">
                <span>/</span>
                <span className="text-gray-700 font-tactical uppercase text-sm">Reservas</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 font-tactical flex items-center gap-3">
            <Activity className="w-8 h-8 text-accion" />
            RESERVAS
          </h1>
          <p className="text-gray-500 text-sm mt-1">{reservations.length} reservas en total</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar jugador o partida..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterGame}
              onChange={e => setFilterGame(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors text-sm"
            >
              <option value="">Todas las partidas</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors text-sm"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 font-tactical uppercase tracking-wider">
            Cargando reservas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-tactical uppercase">No se encontraron reservas</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Cabecera tabla */}
            <div className="hidden lg:grid grid-cols-[1fr_1fr_130px_80px_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <span>Jugador</span>
              <span>Partida</span>
              <span>Estado</span>
              <span>Pago</span>
              <span>Acciones</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map(reservation => {
                const cfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={reservation.id}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_130px_80px_auto] gap-2 lg:gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Jugador */}
                    <div>
                      <div className="text-gray-900 font-semibold">{reservation.player?.name || '—'}</div>
                      <div className="text-gray-400 text-xs">{reservation.player?.email}</div>
                    </div>

                    {/* Partida */}
                    <div>
                      <div className="text-gray-800 text-sm font-medium">{reservation.game?.title || '—'}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(reservation.game?.starts_at)}
                      </div>
                    </div>

                    {/* Estado */}
                    <div>
                      <span className={`px-2 py-1 border rounded text-xs font-bold uppercase ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Pago */}
                    <div className="text-gray-800 font-bold text-sm">
                      {reservation.payment?.amount ? `${reservation.payment.amount}€` : '—'}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {reservation.status === 'pending' && (
                        <button
                          onClick={() => openAction(reservation, 'confirm')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
                          title="Confirmar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}
                      {(reservation.status === 'confirmed' || reservation.status === 'pending') && reservation.attended == null && (
                        <>
                          <button
                            onClick={() => openAction(reservation, 'attend')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                            title="Marcar asistido"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Asistió
                          </button>
                          <button
                            onClick={() => openAction(reservation, 'noshow')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-bold transition-colors"
                            title="No-show"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            No-show
                          </button>
                        </>
                      )}
                      {reservation.status !== 'cancelled' && (
                        <button
                          onClick={() => openAction(reservation, 'cancel')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                          title="Cancelar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} lastPage={lastPage} total={total} onPage={setPage} />
          </div>
        )}
      </main>

      {/* Modal acción */}
      {modal === 'action' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-black font-tactical uppercase">
                {ACTION_CONFIG[selected.action]?.label}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-600 text-sm mb-1">
                Jugador: <span className="text-gray-900 font-semibold">{selected.player?.name}</span>
              </p>
              <p className="text-gray-600 text-sm">
                Partida: <span className="text-gray-900 font-semibold">{selected.game?.title}</span>
              </p>
              {error && (
                <div className="mt-3 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleAction}
                disabled={saving}
                className={`flex-1 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm ${ACTION_CONFIG[selected.action]?.btnClass}`}
              >
                {saving ? 'Guardando...' : ACTION_CONFIG[selected.action]?.btn}
              </button>
              <button
                onClick={closeModal}
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
