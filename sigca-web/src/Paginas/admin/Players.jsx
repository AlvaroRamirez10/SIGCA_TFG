import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  Users, Search, ArrowLeft, Edit2, Trash2, Plus,
  X, Mail, Phone, Shield, AlertTriangle, CheckCircle
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Logo from '../../Componentes/Logo';
import NotificationBell from '../../Componentes/NotificationBell';
import Pagination from '../../Componentes/Pagination';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export default function AdminPlayers() {
  const { user, logout } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPlayers(page); }, [page]);

  const loadPlayers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/players', { params: { page: p } });
      let playersData = res.data?.data || res.data?.players || res.data || [];
      if (Array.isArray(playersData)) {
        playersData = playersData.map(player => ({
          ...player,
          name:  player.user?.name  || player.name  || 'Sin nombre',
          email: player.user?.email || player.email || 'Sin email'
        }));
      }
      setPlayers(Array.isArray(playersData) ? playersData : []);
      setLastPage(res.data?.last_page || 1);
      setTotal(res.data?.total || playersData.length);
    } catch (e) {
      console.error('Error cargando jugadores:', e);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };

  const openEdit = (player) => {
    setSelected(player);
    setForm({ name: player.name, email: player.email, phone: player.phone || '', password: '' });
    setError('');
    setModal('edit');
  };

  const openDelete = (player) => { setSelected(player); setError(''); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios');
      return;
    }
    if (!form.email.includes('@')) {
      setError('El email debe contener @');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/players', form);
      setPlayers(prev => [...prev, res.data.player || res.data]);
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al crear jugador');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name || !form.email) { setError('Nombre y email son obligatorios'); return; }
    if (!form.email.includes('@')) { setError('El email debe contener @'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone };
      if (form.password) payload.password = form.password;
      const res = await api.put(`/admin/players/${selected.id}`, payload);
      setPlayers(prev => prev.map(p => p.id === selected.id ? (res.data.player || res.data) : p));
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al actualizar jugador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/players/${selected.id}`);
      setPlayers(prev => prev.filter(p => p.id !== selected.id));
      closeModal();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al eliminar jugador');
    } finally {
      setSaving(false);
    }
  };

  const filtered = players.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

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
                <span className="text-gray-700 font-tactical uppercase text-sm">Jugadores</span>
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
              <Users className="w-8 h-8 text-accion" />
              JUGADORES
            </h1>
            <p className="text-gray-500 text-sm mt-1">{players.length} jugadores registrados</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-accion hover:bg-accion-600 text-white font-bold px-5 py-3 rounded transition-colors font-tactical uppercase text-sm shadow"
          >
            <Plus className="w-4 h-4" />
            Nuevo Jugador
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 pl-12 pr-4 py-3 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 font-tactical uppercase tracking-wider">
            Cargando jugadores...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-tactical uppercase">No se encontraron jugadores</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Cabecera tabla */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <span>Jugador</span>
              <span>Email</span>
              <span>No-shows</span>
              <span>Sellos</span>
              <span>Acciones</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map(player => (
                <div
                  key={player.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 md:gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Nombre */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accion/20 border border-accion/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accion font-bold text-sm font-tactical">
                        {player.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">{player.name}</div>
                      {player.phone && (
                        <div className="text-gray-400 text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" />{player.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {player.email}
                  </div>

                  {/* No-shows */}
                  <div>
                    {(player.noshow_count || 0) >= 2 ? (
                      <span className="flex items-center gap-1 bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded text-xs font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {player.noshow_count}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Shield className="w-4 h-4" />
                        {player.noshow_count || 0}
                      </span>
                    )}
                  </div>

                  {/* Sellos */}
                  <div className="flex items-center gap-1 text-yellow-600 text-sm font-bold font-tactical">
                    <CheckCircle className="w-4 h-4" />
                    {player.loyalty_card?.stamps_count || 0}/5
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(player)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-bold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDelete(player)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} lastPage={lastPage} total={total} onPage={setPage} />
          </div>
        )}
      </main>

      {/* Modal crear / editar */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-gray-900 font-black font-tactical uppercase">
                {modal === 'create' ? 'Nuevo Jugador' : 'Editar Jugador'}
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
              {[
                { label: 'Nombre *', key: 'name', type: 'text' },
                { label: 'Email *',  key: 'email', type: 'email' },
                { label: 'Teléfono', key: 'phone', type: 'tel' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">
                  {modal === 'create' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors"
                />
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
                <h2 className="text-gray-900 font-black font-tactical uppercase">Eliminar Jugador</h2>
              </div>
              <p className="text-gray-600 text-sm mb-1">
                ¿Eliminar a <span className="text-gray-900 font-semibold">{selected?.name}</span>?
              </p>
              <p className="text-gray-400 text-xs">Esta acción no se puede deshacer.</p>
              {error && (
                <div className="mt-3 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors font-tactical uppercase text-sm"
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
