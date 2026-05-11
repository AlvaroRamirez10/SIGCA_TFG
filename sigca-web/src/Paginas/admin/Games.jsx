import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  Calendar, ArrowLeft, Plus, Edit2, Trash2, X,
  MapPin, Users, DollarSign, Clock, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Logo from '../../Componentes/Logo';
import NotificationBell from '../../Componentes/NotificationBell';
import Pagination from '../../Componentes/Pagination';

const EMPTY_FORM = {
  title: '', description: '', location: '',
  starts_at: '', ends_at: '', price: '', max_slots: '', status: 'published'
};

const STATUS_BADGE = {
  open:      'bg-green-100 border-green-300 text-green-800',
  published: 'bg-green-100 border-green-300 text-green-800',
  full:      'bg-yellow-100 border-yellow-300 text-yellow-800',
  cancelled: 'bg-red-100 border-red-300 text-red-800',
  finished:  'bg-gray-100 border-gray-300 text-gray-600',
  draft:     'bg-blue-100 border-blue-300 text-blue-800',
};

const STATUS_LABEL = {
  open: 'Abierta', published: 'Publicada', full: 'Completa',
  cancelled: 'Cancelada', finished: 'Finalizada', draft: 'Borrador'
};

export default function AdminGames() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedRosters, setExpandedRosters] = useState({});

  useEffect(() => { loadGames(page); }, [page]);

  const loadGames = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/games', { params: { page: p } });
      let gamesData = res.data?.data || res.data?.games || res.data || [];
      setGames(Array.isArray(gamesData) ? gamesData : []);
      setLastPage(res.data?.last_page || 1);
      setTotal(res.data?.total || gamesData.length);
    } catch (e) {
      console.error('Error cargando partidas:', e);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setModal('create');
  };

  const openEdit = (game) => {
    setSelected(game);
    setForm({
      title:       game.title || '',
      description: game.description || '',
      location:    game.location || '',
      starts_at:   toLocalDatetimeInput(game.starts_at),
      ends_at:     toLocalDatetimeInput(game.ends_at),
      price:       game.price || '',
      max_slots:   game.max_slots || '',
      status:      game.status || 'published',
    });
    setError('');
    setModal('edit');
  };

  const openDelete = (game) => {
    setSelected(game);
    setError('');
    setModal('delete');
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const validate = () => {
    if (!form.title || !form.location || !form.starts_at || !form.ends_at || !form.price || !form.max_slots) {
      setError('Todos los campos marcados con * son obligatorios');
      return false;
    }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return false;
    }
    return true;
  };

  const handleCleanup = async () => {
    if (!window.confirm('¿Eliminar todas las partidas cuya fecha de fin ya ha pasado? Esta acción no se puede deshacer.')) return;
    try {
      const res = await api.delete('/admin/games/cleanup');
      const deleted = res.data?.deleted ?? 0;
      if (deleted > 0) {
        await loadGames();
      }
      alert(res.data?.message || 'Limpieza completada');
    } catch (e) {
      alert(e.response?.data?.message || 'Error al limpiar partidas');
    }
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, starts_at: toUTCIso(form.starts_at), ends_at: toUTCIso(form.ends_at) };
      const res = await api.post('/admin/games', payload);
      setGames(prev => [...prev, res.data.game || res.data]);
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al crear partida');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, starts_at: toUTCIso(form.starts_at), ends_at: toUTCIso(form.ends_at) };
      const res = await api.put(`/admin/games/${selected.id}`, payload);
      setGames(prev => prev.map(g => {
        if (g.id !== selected.id) return g;
        const updated = res.data.game || res.data;
        return { ...updated, reservations: g.reservations || [] };
      }));
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al actualizar partida');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/games/${selected.id}`);
      setGames(prev => prev.filter(g => g.id !== selected.id));
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al eliminar partida');
    } finally {
      setSaving(false);
    }
  };

  const toggleRoster = (gameId) =>
    setExpandedRosters(prev => ({ ...prev, [gameId]: !prev[gameId] }));

  const toLocalDatetimeInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const toUTCIso = (localDt) => {
    if (!localDt) return '';
    return new Date(localDt).toISOString();
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
                <span className="text-gray-700 font-tactical uppercase text-sm">Partidas</span>
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
        {/* Título + acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-tactical flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accion" />
              PARTIDAS
            </h1>
            <p className="text-gray-500 text-sm mt-1">{games.length} partidas registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCleanup}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded transition-colors font-tactical uppercase text-sm"
              title="Eliminar todas las partidas cuya fecha de fin ya pasó"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar finalizadas
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-accion hover:bg-accion-600 text-white font-bold px-5 py-3 rounded transition-colors font-tactical uppercase text-sm shadow"
            >
              <Plus className="w-4 h-4" />
              Nueva Partida
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 font-tactical uppercase tracking-wider">
            Cargando partidas...
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-tactical uppercase">No hay partidas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map(game => {
              const status = game.status || 'open';
              const pct = game.max_slots ? Math.round((game.reserved_slots || 0) / game.max_slots * 100) : 0;
              const isPast = game.ends_at && new Date(game.ends_at) < new Date();
              const canDelete = status === 'draft' || status === 'cancelled' || status === 'finished' || isPast;
              return (
                <div
                  key={game.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Fila principal */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-xl font-black text-gray-900 font-tactical">{game.title}</h3>
                        <span className={`flex-shrink-0 px-2 py-0.5 border rounded text-xs font-tactical uppercase ${STATUS_BADGE[status] || STATUS_BADGE.open}`}>
                          {STATUS_LABEL[status] || status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(game.starts_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {game.location}
                        </span>
                        <span className="flex items-center gap-1 text-accion font-bold">
                          <DollarSign className="w-4 h-4" />
                          {game.price}€
                        </span>
                      </div>
                    </div>

                    {/* Plazas */}
                    <div className="flex-shrink-0 text-center min-w-[110px]">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-800 font-bold font-tactical">
                          {game.reserved_slots || 0}/{game.max_slots || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-2">
                        <div
                          className={`h-full rounded transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">{pct}% ocupado</span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(game)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors text-sm font-bold"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => openDelete(game)}
                        disabled={!canDelete}
                        className={`flex items-center gap-1 px-3 py-2 rounded transition-colors text-sm font-bold ${
                          canDelete
                            ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={canDelete ? 'Eliminar' : 'Solo se pueden eliminar partidas en borrador o canceladas'}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Inscritos — toggle */}
                  {(() => {
                    const roster = game.reservations || [];
                    const isOpen = expandedRosters[game.id];
                    return (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => toggleRoster(game.id)}
                          className="w-full flex items-center justify-between px-5 py-2.5 text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                        >
                          <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {roster.length === 0 ? 'Sin inscritos' : `${roster.length} inscrito${roster.length !== 1 ? 's' : ''}`}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4">
                            {roster.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center py-3">Nadie inscrito aún</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {roster.map(r => {
                                  const name = r.player?.user?.name || '—';
                                  const payCls = {
                                    pending:  'text-yellow-600',
                                    paid:     'text-green-600',
                                    rejected: 'text-red-500',
                                    refunded: 'text-gray-400',
                                  }[r.payment?.status] || 'text-gray-400';
                                  const payLabel = {
                                    pending:  'Pago pendiente',
                                    paid:     `Pagado ${r.payment?.amount ? r.payment.amount + '€' : ''}`,
                                    rejected: 'Rechazado',
                                    refunded: 'Reembolsado',
                                    free:     'Partida gratis',
                                  }[r.payment?.method === 'free' ? 'free' : r.payment?.status] || '—';
                                  return (
                                    <div key={r.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                                      <div className="w-7 h-7 bg-accion/20 border border-accion/40 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-accion font-bold text-xs">{name.charAt(0).toUpperCase()}</span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-gray-900 font-semibold text-sm truncate">{name}</div>
                                        <div className={`text-xs ${payCls}`}>{payLabel}</div>
                                      </div>
                                      {r.attended === true  && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" title="Asistió" />}
                                      {r.attended === false && <XCircle    className="w-4 h-4 text-red-500 flex-shrink-0"   title="No se presentó" />}
                                      {r.attended === null  && <AlertCircle className="w-4 h-4 text-gray-300 flex-shrink-0" title="Sin marcar" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            <Pagination page={page} lastPage={lastPage} total={total} onPage={setPage} />
          </div>
        )}
      </main>

      {/* Modal crear / editar */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-gray-900 font-black font-tactical uppercase">
                {modal === 'create' ? 'Nueva Partida' : 'Editar Partida'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Fecha de inicio *</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Fecha de fin *</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Estado *</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                >
                  <option value="published">Publicada (visible para jugadores)</option>
                  <option value="draft">Borrador (solo admin)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Precio (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Plazas máx. *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_slots}
                    onChange={e => setForm(f => ({ ...f, max_slots: e.target.value }))}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={modal === 'create' ? handleCreate : handleEdit}
                disabled={saving}
                className="flex-1 bg-accion hover:bg-accion-600 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm shadow"
              >
                {saving ? 'Guardando...' : (modal === 'create' ? 'Crear' : 'Guardar')}
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

      {/* Modal eliminar */}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-sm">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 border border-red-300 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-gray-900 font-black font-tactical uppercase">Eliminar Partida</h2>
              </div>
              <p className="text-gray-600 text-sm mb-1">
                ¿Eliminar <span className="text-gray-900 font-semibold">{selected?.title}</span>?
              </p>
              <p className="text-gray-400 text-xs">Se cancelarán todas las reservas asociadas.</p>
              {selected && !['draft','cancelled','finished'].includes(selected.status) && !(selected.ends_at && new Date(selected.ends_at) < new Date()) && (
                <div className="mt-3 bg-yellow-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded text-sm">
                  ⚠️ Solo se pueden eliminar partidas finalizadas, canceladas o en borrador.
                </div>
              )}
              {error && (
                <div className="mt-3 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleDelete}
                disabled={saving || (!['draft','cancelled','finished'].includes(selected?.status) && !(selected?.ends_at && new Date(selected.ends_at) < new Date()))}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
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
