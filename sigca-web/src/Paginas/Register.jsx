import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { User, Mail, Lock, Shield, ArrowRight, Calendar } from 'lucide-react';
import Logo from '../Componentes/Logo';
import WhatsAppButton from '../Componentes/WhatsAppButton';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    alias: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar error del campo cuando el usuario escribe
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      navigate('/player');
    } else {
      setErrors(result.errors || { general: result.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con textura */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            #2D7A4E 10px,
            #2D7A4E 20px
          )`
        }}></div>
      </div>

      {/* Crosshairs decorativos */}
      <div className="absolute top-10 right-10 opacity-10">
        <Shield className="w-32 h-32 text-accion" strokeWidth={1} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <Logo className="w-16 h-16" />
          </Link>
          <h1 className="text-4xl font-black text-white font-tactical mb-2">RECLUTAMIENTO</h1>
          <p className="text-comando-200">Únete al Club SIGCA</p>
        </div>

        {/* Formulario */}
        <div className="bg-comando-900 border-2 border-comando-700 p-8">
          <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-3 py-1 mb-6">
            <div className="w-2 h-2 bg-accion rounded-full animate-pulse"></div>
            <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
              Formulario de alistamiento
            </span>
          </div>

          {errors.general && (
            <div className="bg-emergencia/10 border border-emergencia text-emergencia px-4 py-3 mb-6 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="Ej: Juan Pérez"
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
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="Ej: El Comando, Sniper, Lobo..."
                required
              />
              {errors.alias && (
                <p className="text-emergencia text-xs mt-1">{errors.alias[0]}</p>
              )}
              <p className="text-comando-300 text-xs mt-1">
                Tu nombre de guerra en el campo de batalla
              </p>
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
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
              {errors.email && (
                <p className="text-emergencia text-xs mt-1">{errors.email[0]}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                <Lock className="w-4 h-4 text-accion" />
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="Mínimo 8 caracteres"
                required
              />
              {errors.password && (
                <p className="text-emergencia text-xs mt-1">{errors.password[0]}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                <Lock className="w-4 h-4 text-accion" />
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-accion text-white font-bold py-4 text-lg font-tactical uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accion-600 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? 'PROCESANDO...' : 'COMPLETAR REGISTRO'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </span>
            </button>
          </form>

          {/* Link a login */}
          <div className="mt-6 pt-6 border-t border-comando-700 text-center">
            <p className="text-comando-200 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accion font-semibold hover:text-accion-400 transition-colors">
                Acceder aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-comando-300 text-xs">
            Al registrarte aceptas las normas del club y el código de conducta en campo.
          </p>
        </div>
      </div>
      
      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton />
    </div>
  );
}