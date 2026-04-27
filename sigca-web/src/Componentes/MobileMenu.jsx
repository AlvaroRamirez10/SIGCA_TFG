import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, Calendar, Trophy, LogOut, User } from 'lucide-react';
import Logo from './Logo';

export default function MobileMenu({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={toggleMenu}
        className="lg:hidden text-white p-2 hover:bg-comando-800 transition-colors"
        aria-label="Menú"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-carbon/80 z-40 lg:hidden"
          onClick={closeMenu}
        ></div>
      )}

      {/* Menú lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-comando-900 border-l-2 border-comando-700 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header del menú */}
        <div className="p-6 border-b border-comando-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div className="text-white font-black text-lg font-tactical">
                CLUB SIGCA
              </div>
            </div>
            <button
              onClick={closeMenu}
              className="text-white hover:text-accion transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {user && (
            <div className="bg-carbon border border-comando-700 p-3">
              <div className="text-white font-semibold text-sm mb-1">
                {user.name}
              </div>
              <div className="text-comando-200 text-xs">{user.email}</div>
            </div>
          )}
        </div>

        {/* Links del menú */}
        <nav className="p-6">
          <div className="space-y-2">
            {user ? (
              <>
                {/* Menú para jugador */}
                {user.role === 'player' && (
                  <>
                    <Link
                      to="/player"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Home className="w-5 h-5 text-accion" />
                      Dashboard
                    </Link>
                    <Link
                      to="/games"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Calendar className="w-5 h-5 text-accion" />
                      Partidas
                    </Link>
                    <Link
                      to="/player/reservations"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Calendar className="w-5 h-5 text-accion" />
                      Mis Reservas
                    </Link>
                    <Link
                      to="/player/loyalty"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Trophy className="w-5 h-5 text-accion" />
                      Mi Cartilla
                    </Link>
                    <Link
                      to="/player/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <User className="w-5 h-5 text-accion" />
                      Mi Perfil
                    </Link>
                  </>
                )}

                {/* Menú para admin */}
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Home className="w-5 h-5 text-accion" />
                      Dashboard Admin
                    </Link>
                    <Link
                      to="/admin/players"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <User className="w-5 h-5 text-accion" />
                      Jugadores
                    </Link>
                    <Link
                      to="/admin/games"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Calendar className="w-5 h-5 text-accion" />
                      Partidas
                    </Link>
                    <Link
                      to="/admin/reservations"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                    >
                      <Trophy className="w-5 h-5 text-accion" />
                      Reservas
                    </Link>
                  </>
                )}

                <div className="border-t border-comando-700 my-4"></div>

                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 text-emergencia hover:bg-emergencia/10 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                {/* Menú para visitantes */}
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                >
                  <Home className="w-5 h-5 text-accion" />
                  Inicio
                </Link>
                <Link
                  to="/games"
                  onClick={closeMenu}
                  className="flex items-center gap-3 text-white hover:bg-comando-800 px-4 py-3 transition-colors font-tactical uppercase text-sm"
                >
                  <Calendar className="w-5 h-5 text-accion" />
                  Partidas
                </Link>

                <div className="border-t border-comando-700 my-4"></div>

                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block text-center bg-accion hover:bg-accion-600 text-white font-bold py-3 px-4 transition-colors font-tactical uppercase text-sm mb-2"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="block text-center border-2 border-accion text-accion hover:bg-accion hover:text-white font-bold py-3 px-4 transition-all font-tactical uppercase text-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}