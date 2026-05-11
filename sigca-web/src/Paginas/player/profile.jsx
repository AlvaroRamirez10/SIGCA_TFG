import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Servicios/api';
import { 
  LogOut,
  ArrowLeft,
  User,
  Mail,
  Shield,
  Phone,
  Camera,
  Lock,
  Trash2,
  Save,
  X
} from 'lucide-react';
import Logo from '../../Componentes/Logo';
import MobileMenu from '../../Componentes/MobileMenu';

export default function PlayerProfile() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    email: '',
    phone: '',
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/player/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.user.name,
        alias: response.data.player.alias || '',
        email: response.data.user.email,
        phone: response.data.player.phone || '',
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({});
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    try {
      await api.put('/player/profile', formData);
      setSuccessMessage('Perfil actualizado correctamente');
      setEditing(false);
      loadProfile();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const res = await api.post('/player/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Actualizar avatar directamente desde la respuesta sin esperar a loadProfile
      setProfile(prev => ({
        ...prev,
        player: { ...prev.player, avatar: res.data.avatar },
      }));
      setSuccessMessage('Foto actualizada correctamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al subir la foto');
    } finally {
      setUploadingAvatar(false);
      // Resetear el input para permitir subir el mismo archivo de nuevo
      e.target.value = '';
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await api.put('/player/profile/password', passwordData);
      setSuccessMessage('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      setErrors(error.response?.data?.errors || { password: [error.response?.data?.message] });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!confirm('¿Estás COMPLETAMENTE SEGURO? Esta acción NO se puede deshacer.')) {
      return;
    }

    try {
      await api.delete('/player/profile', {
        data: { password: deletePassword },
      });
      alert('Tu cuenta ha sido eliminada');
      logout();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar cuenta');
    }
  };

  const getAvatarUrl = () => {
    if (profile?.player?.avatar) {
      return `${import.meta.env.VITE_API_URL ?? ''}/storage/${profile.player.avatar}`;
    }
    return null;
  };

  const getInitials = () => {
    if (!profile?.user?.name) return '?';
    return profile.user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-white text-xl font-tactical">CARGANDO PERFIL...</div>
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
                <div className="text-comando-200 text-xs uppercase tracking-wider">Mi perfil</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="hidden lg:flex items-center gap-2 bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 transition-colors font-tactical uppercase text-sm"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
              <MobileMenu user={{ name: profile?.user?.name, email: profile?.user?.email, role: 'player' }} logout={logout} />
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

        {/* Success message */}
        {successMessage && (
          <div className="bg-operativo/10 border border-operativo text-operativo px-4 py-3 mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Avatar y acciones */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-comando-900 border border-comando-700 p-6 text-center">
              <div className="relative inline-block mb-4">
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-accion"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-accion flex items-center justify-center border-4 border-accion-600">
                    <span className="text-white text-4xl font-black font-tactical">
                      {getInitials()}
                    </span>
                  </div>
                )}
                
                <label className="absolute bottom-0 right-0 bg-accion hover:bg-accion-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>

              <h2 className="text-xl font-black text-white font-tactical mb-1">
                {profile?.user?.name}
              </h2>
              <p className="text-comando-200 text-sm mb-4">
                {profile?.player?.alias || 'Sin alias'}
              </p>

              <p className="text-comando-300 text-xs">
                Tamaño máximo: 2MB
                <br />
                Formatos: JPG, PNG
              </p>
            </div>

            {/* Acciones peligrosas */}
            <div className="bg-comando-900 border border-comando-700 p-6">
              <h3 className="text-lg font-black text-white font-tactical mb-4">
                ZONA PELIGROSA
              </h3>
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-alerta/10 hover:bg-alerta hover:text-white text-alerta border border-alerta px-4 py-3 mb-3 transition-all font-tactical uppercase text-sm"
              >
                <Lock className="w-4 h-4" />
                Cambiar contraseña
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-emergencia/10 hover:bg-emergencia hover:text-white text-emergencia border border-emergencia px-4 py-3 transition-all font-tactical uppercase text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar cuenta
              </button>
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-comando-900 border border-comando-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white font-tactical">
                  INFORMACIÓN PERSONAL
                </h2>
                
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-accion hover:bg-accion-600 text-white px-4 py-2 font-tactical uppercase text-sm transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: profile.user.name,
                        alias: profile.player.alias || '',
                        email: profile.user.email,
                        phone: profile.player.phone || '',
                      });
                      setErrors({});
                    }}
                    className="bg-comando-800 hover:bg-comando-700 text-white px-4 py-2 font-tactical uppercase text-sm transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Nombre completo */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                    <User className="w-4 h-4 text-accion" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {errors.name && (
                    <p className="text-emergencia text-xs mt-1">{errors.name[0]}</p>
                  )}
                </div>

                {/* Alias táctico */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                    <Shield className="w-4 h-4 text-accion" />
                    Alias táctico
                  </label>
                  <input
                    type="text"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.alias && (
                    <p className="text-emergencia text-xs mt-1">{errors.alias[0]}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                    <Mail className="w-4 h-4 text-accion" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {errors.email && (
                    <p className="text-emergencia text-xs mt-1">{errors.email[0]}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                    <Phone className="w-4 h-4 text-accion" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Opcional"
                  />
                  {errors.phone && (
                    <p className="text-emergencia text-xs mt-1">{errors.phone[0]}</p>
                  )}
                </div>

                {editing && (
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-accion hover:bg-accion-600 text-white font-bold py-4 font-tactical uppercase tracking-wider transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Guardar cambios
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-carbon/90 flex items-center justify-center z-50 p-4">
          <div className="bg-comando-900 border-2 border-comando-700 p-6 max-w-md w-full">
            <h3 className="text-2xl font-black text-white font-tactical mb-4">
              CAMBIAR CONTRASEÑA
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-white mb-2 block uppercase tracking-wide">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-white mb-2 block uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-white mb-2 block uppercase tracking-wide">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.new_password_confirmation}
                  onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                  className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none"
                  required
                />
              </div>

              {errors.password && (
                <p className="text-emergencia text-sm">{errors.password[0]}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setErrors({});
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      new_password_confirmation: '',
                    });
                  }}
                  className="flex-1 bg-comando-800 hover:bg-comando-700 text-white py-3 font-tactical uppercase text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accion hover:bg-accion-600 text-white py-3 font-tactical uppercase text-sm transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-carbon/90 flex items-center justify-center z-50 p-4">
          <div className="bg-comando-900 border-2 border-emergencia p-6 max-w-md w-full">
            <h3 className="text-2xl font-black text-emergencia font-tactical mb-4">
              ⚠️ ELIMINAR CUENTA
            </h3>

            <p className="text-white mb-4">
              Esta acción es <strong>PERMANENTE</strong> y <strong>NO SE PUEDE DESHACER</strong>.
            </p>

            <p className="text-comando-200 text-sm mb-4">
              Se eliminarán:
            </p>
            <ul className="text-comando-300 text-sm mb-6 list-disc list-inside space-y-1">
              <li>Todos tus datos personales</li>
              <li>Tu historial de reservas</li>
              <li>Tus sellos de fidelización</li>
              <li>Tus créditos gratuitos</li>
            </ul>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-white mb-2 block uppercase tracking-wide">
                  Confirma tu contraseña
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-carbon border-2 border-emergencia text-white focus:border-emergencia focus:outline-none"
                  placeholder="Escribe tu contraseña para confirmar"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className="flex-1 bg-comando-800 hover:bg-comando-700 text-white py-3 font-tactical uppercase text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emergencia hover:bg-emergencia/80 text-white py-3 font-tactical uppercase text-sm transition-colors"
                >
                  Eliminar cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}