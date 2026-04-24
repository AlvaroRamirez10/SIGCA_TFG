import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import Logo from '../Componentes/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const quickLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
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

      {/* Crosshair decorativo */}
      <div className="absolute top-10 right-10 opacity-10">
        <Shield className="w-32 h-32 text-accion" strokeWidth={1} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <Logo className="w-16 h-16" />
          </Link>
          <h1 className="text-4xl font-black text-white font-tactical mb-2">ACCESO</h1>
          <p className="text-comando-200">Identifícate en el sistema</p>
        </div>

        {/* Formulario */}
        <div className="bg-comando-900 border-2 border-comando-700 p-8">
          <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-3 py-1 mb-6">
            <div className="w-2 h-2 bg-accion rounded-full animate-pulse"></div>
            <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
              Inicio de sesión
            </span>
          </div>

          {error && (
            <div className="bg-emergencia/10 border border-emergencia text-emergencia px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                <Mail className="w-4 h-4 text-accion" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wide">
                <Lock className="w-4 h-4 text-accion" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-carbon border-2 border-comando-700 text-white focus:border-accion focus:outline-none transition-all"
                placeholder="••••••••"
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
                {loading ? 'ACCEDIENDO...' : 'INICIAR SESIÓN'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </span>
            </button>
          </form>

          {/* Link a registro */}
          <div className="mt-6 pt-6 border-t border-comando-700 text-center">
            <p className="text-comando-200 text-sm">
              ¿Primera vez en el club?{' '}
              <Link to="/register" className="text-accion font-semibold hover:text-accion-400 transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Acceso rápido desarrollo */}
        <div className="mt-6 bg-comando-900/50 border border-comando-800 p-4">
          <p className="text-comando-200 text-xs mb-3 uppercase tracking-wider font-tactical text-center">
            Acceso rápido (desarrollo)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('admin@sigca.local', 'sigca_admin_2024')}
              className="text-xs bg-comando-800 hover:bg-comando-700 text-white px-3 py-2 transition-colors font-tactical uppercase"
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('pedro@sigca.local', '12345678')}
              className="text-xs bg-comando-800 hover:bg-comando-700 text-white px-3 py-2 transition-colors font-tactical uppercase"
            >
              Jugador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}