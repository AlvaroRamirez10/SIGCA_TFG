import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import {
  DollarSign, ArrowLeft, Search, Filter,
  CheckCircle, XCircle, X, Clock, TrendingUp
} from 'lucide-react';
import MobileMenu from '../../Componentes/MobileMenu';
import Logo from '../../Componentes/Logo';
import NotificationBell from '../../Componentes/NotificationBell';
import Pagination from '../../Componentes/Pagination';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',    badge: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  paid:     { label: 'Pagado',       badge: 'bg-green-100 border-green-300 text-green-800' },
  rejected: { label: 'Rechazado',   badge: 'bg-red-100 border-red-300 text-red-800' },
  refunded: { label: 'Reembolsado', badge: 'bg-gray-100 border-gray-300 text-gray-600' },
};

const METHOD_LABEL = {
  bizum:    'Bizum',
  cash:     'Efectivo',
  transfer: 'Transferencia',
  free:     'Partida gratis',
};

const ACTION_CONFIG = {
  confirm: { label: 'Confirmar pago',  btn: 'Confirmar',  btnClass: 'bg-green-600 hover:bg-green-700' },
  reject:  { label: 'Rechazar pago',   btn: 'Rechazar',   btnClass: 'bg-red-600 hover:bg-red-700' },
  refund:  { label: 'Reembolsar pago', btn: 'Reembolsar', btnClass: 'bg-yellow-500 hover:bg-yellow-600' },
};

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPayments(page); }, [page]);

  const loadPayments = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments', { params: { page: p } });
      let paymentsData = res.data?.data || res.data?.payments || res.data || [];
      if (Array.isArray(paymentsData)) {
        paymentsData = paymentsData.map(payment => ({
          ...payment,
          player: payment.reservation?.player ? {
            ...payment.reservation.player,
            name:  payment.reservation.player?.user?.name  || payment.reservation.player?.name  || 'Sin nombre',
            email: payment.reservation.player?.user?.email || payment.reservation.player?.email || 'Sin email',
          } : null,
          game: payment.reservation?.game || null,
        }));
      }
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setLastPage(res.data?.last_page || 1);
      setTotal(res.data?.total || paymentsData.length);
    } catch (e) {
      console.error('Error cargando pagos:', e);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const openAction = (payment, action) => { setSelected({ ...payment, action }); setError(''); setModal('action'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const handleAction = async () => {
    setSaving(true);
    const { action, id } = selected;
    const statusMap = { confirm: 'paid', reject: 'rejected', refund: 'refunded' };
    try {
      await api.put(`/admin/payments/${id}`, { status: statusMap[action] });
      closeModal();
      await loadPayments();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al actualizar pago');
    } finally {
      setSaving(false);
    }
  };

  const filtered = payments.filter(p => {
    const matchSearch = !search ||
      p.player?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.player?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.game?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
                <span className="text-gray-700 font-tactical uppercase text-sm">Pagos</span>
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
            <DollarSign className="w-8 h-8 text-accion" />
            PAGOS
          </h1>
          <p className="text-gray-500 text-sm mt-1">{payments.length} transacciones registradas</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-gray-500 text-sm font-bold uppercase">Cobrado</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">{totalPaid.toFixed(2)}€</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-500 text-sm font-bold uppercase">Pendiente</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">{totalPending.toFixed(2)}€</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-accion" />
              <span className="text-gray-500 text-sm font-bold uppercase">Por confirmar</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-tactical">
              {payments.filter(p => p.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por jugador o partida..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-accion focus:ring-1 focus:ring-accion transition-colors text-sm"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 font-tactical uppercase tracking-wider">
            Cargando pagos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-tactical uppercase">No se encontraron pagos</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <span>Jugador</span>
              <span>Partida</span>
              <span>Importe</span>
              <span>Método</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map(payment => {
                const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={payment.id}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-2 lg:gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="text-gray-900 font-semibold">
                        {payment.player?.name || payment.reservation?.player?.name || '—'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(payment.created_at)}
                      </div>
                    </div>

                    <div className="text-gray-600 text-sm">
                      {payment.game?.title || payment.reservation?.game?.title || '—'}
                    </div>

                    <div className="text-accion font-black font-tactical text-lg">
                      {payment.amount}€
                    </div>

                    <div className="text-sm">
                      {payment.method === 'free'
                        ? <span className="text-green-700 font-bold">Partida gratis</span>
                        : <span className="text-gray-500">{METHOD_LABEL[payment.method] || payment.method || '—'}</span>
                      }
                    </div>

                    <div>
                      {payment.method === 'free'
                        ? <span className="px-2 py-1 border rounded text-xs font-bold uppercase bg-green-100 border-green-300 text-green-800">Confirmado</span>
                        : <span className={`px-2 py-1 border rounded text-xs font-bold uppercase ${cfg.badge}`}>{cfg.label}</span>
                      }
                    </div>

                    <div className="flex items-center gap-2">
                      {payment.method !== 'free' && payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openAction(payment, 'confirm')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => openAction(payment, 'reject')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {payment.method !== 'free' && payment.status === 'paid' && (
                        <button
                          onClick={() => openAction(payment, 'refund')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reembolsar
                        </button>
                      )}
                      {payment.method === 'free' && (
                        <span className="text-gray-400 text-xs italic">Sin acciones</span>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">Importe</span>
                <span className="text-accion font-black font-tactical text-2xl">{selected.amount}€</span>
              </div>
              <p className="text-gray-600 text-sm">
                Jugador: <span className="text-gray-900 font-semibold">
                  {selected.player?.name || selected.reservation?.player?.name}
                </span>
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
