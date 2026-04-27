import { Link } from "react-router-dom";
import {
  Calendar,
  Trophy,
  MapPin,
  Users,
  ArrowRight,
  Clock,
  Euro,
  Crosshair,
  Target,
} from "lucide-react";
import Logo from '../Componentes/Logo';
import WhatsAppButton from '../Componentes/WhatsAppButton';
import campoImg from '../assets/campo.jpg';
import jugadoresImg from '../assets/jugadores.jpg';
import equipoImg from '../assets/equipo.jpg';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-comando-100 via-arena to-comando-50 text-carbon">
      {/* Hero Section - Campo de batalla */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${campoImg})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-carbon/55 via-carbon/45 to-carbon/65"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-carbon/45 via-transparent to-carbon/45"></div>

          {/* Textura de humo */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="0.4"/%3E%3C/svg%3E')`,
            }}
          ></div>
        </div>

        {/* Crosshair decorativo */}
        <div className="absolute top-10 right-10 opacity-20">
          <Crosshair className="w-32 h-32 text-accion" strokeWidth={1} />
        </div>
        <div className="absolute bottom-10 left-10 opacity-10">
          <Crosshair className="w-24 h-24 text-alerta" strokeWidth={1} />
        </div>

        {/* Contenido hero */}
        <div className="relative z-10 container mx-auto px-4 py-20 pb-32 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Logo className="w-32 h-32" />
            </div>

            {/* Badge táctico */}
            <div className="inline-flex items-center gap-2 bg-comando-100/90 border-2 border-comando-300 px-4 py-2 mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 bg-comando-500 rounded-full animate-pulse"></div>
              <span className="text-comando-700 font-bold text-sm tracking-widest uppercase font-tactical">
                CAMPO OPERATIVO · LA PALMA DEL CONDADO
              </span>
            </div>

            {/* Título principal */}
            <h1 className="text-7xl md:text-9xl font-black text-white mb-6 font-tactical tracking-tighter relative">
              <span className="relative inline-block">
                CLUB
                <div className="absolute inset-0 bg-accion/20 blur-xl"></div>
              </span>
              <br />
              <span className="relative inline-block text-comando-800">
                SIGCA
                <div className="absolute -inset-1 bg-comando-800/25 blur-2xl"></div>
              </span>
            </h1>

            <p className="text-2xl md:text-3xl text-comando-50 mb-8 leading-tight font-semibold">
              COMBATE TÁCTICO DE AIRSOFT
              <br />
              <span className="text-alerta">HUELVA · ANDALUCÍA</span>
            </p>

            <div className="flex items-center gap-4 mb-12 text-comando-100 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-accion"></div>
                <div>
                  <div className="text-3xl font-black text-white font-tactical">
                    8€
                  </div>
                  <div className="text-xs uppercase tracking-wide">
                    Por partida
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-alerta"></div>
                <div>
                  <div className="text-3xl font-black text-white font-tactical">
                    5:1
                  </div>
                  <div className="text-xs uppercase tracking-wide">
                    Partida gratis
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-operativo"></div>
                <div>
                  <div className="text-3xl font-black text-white font-tactical">
                    24/7
                  </div>
                  <div className="text-xs uppercase tracking-wide">
                    Reservas online
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group relative overflow-hidden bg-accion text-white font-bold py-4 px-8 text-lg font-tactical uppercase tracking-wider transition-all hover:bg-accion-600"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  ALISTARSE
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                to="/games"
                className="relative overflow-hidden border-2 border-comando-700 bg-comando text-white font-bold py-4 px-8 text-lg font-tactical uppercase tracking-wider hover:bg-comando-700 transition-all shadow-tactical"
              >
                VER MISIONES
              </Link>
            </div>
          </div>
        </div>

        {/* Indicador scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <Crosshair className="w-8 h-8 text-alerta" strokeWidth={2} />
            <div className="text-xs text-comando-200 uppercase tracking-widest font-tactical">
              Scroll
            </div>
          </div>
        </div>
      </section>

      {/* Galería campo */}
      <section className="py-24 bg-comando-100 border-y border-comando-300 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #81C784 0px, #81C784 2px, transparent 2px, transparent 10px)`,
          }}
        ></div>

        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative group overflow-hidden aspect-video bg-comando-100">
              <img
                src={campoImg}
                alt="Campo SIGCA"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 text-white font-tactical">
                <div className="text-xs text-alerta uppercase tracking-widest mb-1">
                  Campo táctico
                </div>
                <div className="text-lg font-bold">ZONA DE COMBATE</div>
              </div>
            </div>

            <div className="relative group overflow-hidden aspect-video bg-comando-100">
              <img
                src={jugadoresImg}
                alt="Jugadores SIGCA"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 text-white font-tactical">
                <div className="text-xs text-alerta uppercase tracking-widest mb-1">
                  Comunidad
                </div>
                <div className="text-lg font-bold">NUESTROS COMBATIENTES</div>
              </div>
            </div>

            <div className="relative group overflow-hidden aspect-video bg-comando-100">
              <img
                src={equipoImg}
                alt="Equipo SIGCA"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 text-white font-tactical">
                <div className="text-xs text-alerta uppercase tracking-widest mb-1">
                  Equipamiento
                </div>
                <div className="text-lg font-bold">RÉPLICAS Y PROTECCIÓN</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocolo */}
      <section className="py-24 bg-gradient-to-b from-comando-200 to-arena relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #FF8A5B 0%, transparent 50%), radial-gradient(circle at 80% 80%, #FFE066 0%, transparent 50%)`,
          }}
        ></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-accion/10 border border-accion/30 px-4 py-2 mb-4">
              <Crosshair className="w-4 h-4 text-accion" />
              <span className="text-accion text-xs font-bold uppercase tracking-widest font-tactical">
                Mission Briefing
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-carbon font-tactical mb-4">
              PROTOCOLO DE COMBATE
            </h2>
            <p className="text-comando-700 text-lg max-w-2xl mx-auto">
              Cuatro pasos para entrar en acción
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                num: "01",
                title: "REGISTRO",
                desc: "Crea tu perfil de combatiente. Email + alias táctico.",
              },
              {
                num: "02",
                title: "RESERVA",
                desc: "Selecciona tu misión en el calendario operativo.",
              },
              {
                num: "03",
                title: "COMBATE",
                desc: "Presentación en campo. Pago: 8€ (efectivo/Bizum).",
              },
              {
                num: "04",
                title: "RECOMPENSA",
                desc: "5 misiones completadas = 1 partida gratis.",
              },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-gradient-to-br from-comando-100 to-comando-50 border-2 border-comando-300 p-6 h-full hover:border-accion transition-all">
                  <div className="text-6xl font-black text-accion/20 font-tactical mb-2">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-black text-carbon font-tactical mb-3">
                    {step.title}
                  </h3>
                  <p className="text-comando-700 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-accion/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intel */}
      <section className="py-24 bg-comando-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-alerta/10 border border-alerta/30 px-4 py-2 mb-4">
              <Target className="w-4 h-4 text-alerta" />
              <span className="text-alerta text-xs font-bold uppercase tracking-widest font-tactical">
                Intel
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-carbon font-tactical">
              ESPECIFICACIONES
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                color: "comando",
                title: "ZONA DE OPERACIONES",
                value: "La Palma del Condado",
                sub: "Huelva, Andalucía",
              },
              {
                icon: Euro,
                color: "accion",
                title: "COSTE POR MISIÓN",
                value: "8€",
                sub: "Efectivo o Bizum en campo",
              },
              {
                icon: Clock,
                color: "operativo",
                title: "HORARIO OPERATIVO",
                value: "Fin de semana",
                sub: "Consultar calendario",
              },
              {
                icon: Trophy,
                color: "alerta",
                title: "PROGRAMA LEALTAD",
                value: "5 : 1",
                sub: "Cada 5 partidas = 1 gratis",
              },
              {
                icon: Calendar,
                color: "peligro",
                title: "SISTEMA RESERVAS",
                value: "24/7 Online",
                sub: "Confirmación instantánea",
              },
              {
                icon: Users,
                color: "comando",
                title: "COMUNIDAD",
                value: "Todos los niveles",
                sub: "De novatos a veteranos",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="group relative bg-gradient-to-br from-comando-100 to-comando-50 border border-comando-300 p-6 hover:border-accion transition-all"
                >
                  <div
                    className={`w-12 h-12 bg-${item.color}/10 border border-${item.color}/30 flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-6 h-6 text-${item.color}`} />
                  </div>
                  <div className="text-xs text-comando-600 uppercase tracking-widest font-tactical mb-2">
                    {item.title}
                  </div>
                  <div className="text-3xl font-black text-carbon font-tactical mb-1">
                    {item.value}
                  </div>
                  <div className="text-sm text-comando-700">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${campoImg})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-carbon/55 via-carbon/50 to-carbon/65"></div>
          <div className="absolute inset-0 bg-accion/15"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-comando/30 border-2 border-comando-600 px-4 py-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-comando-700 rounded-full animate-pulse"></div>
            <span className="text-comando-800 font-bold text-sm tracking-widest uppercase font-tactical">
              Reclutamiento abierto
            </span>
          </div>

          <h2 className="text-6xl md:text-7xl font-black text-white mb-6 font-tactical">
            ¿LISTO PARA
            <br />
            EL COMBATE?
          </h2>
          <p className="text-xl text-comando-100 mb-12 max-w-2xl mx-auto">
            Únete al Club SIGCA y demuestra tus habilidades tácticas
            <br />
            en el mejor campo de airsoft de Huelva.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group relative overflow-hidden bg-accion text-white font-bold py-5 px-10 text-xl font-tactical uppercase tracking-wider"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2">
                ALISTARSE AHORA
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Link>
            <Link
              to="/games"
              className="border-2 border-comando-700 bg-comando text-white font-bold py-5 px-10 text-xl font-tactical uppercase tracking-wider hover:bg-comando-700 transition-all shadow-tactical"
            >
              CALENDARIO MISIONES
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-comando-100 border-t-2 border-comando-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Logo className="w-12 h-12" />
              <div>
                <div className="text-carbon font-black text-xl font-tactical">
                  CLUB SIGCA
                </div>
                <div className="text-comando-700 text-xs uppercase tracking-wider">
                  La Palma del Condado · Huelva
                </div>
              </div>
            </div>
            <div className="flex gap-8 text-sm text-comando-700 font-tactical uppercase tracking-wider">
              <Link to="/games" className="hover:text-accion transition-colors">
                Misiones
              </Link>
              <Link to="/login" className="hover:text-accion transition-colors">
                Acceso
              </Link>
              <Link
                to="/register"
                className="hover:text-accion transition-colors"
              >
                Registro
              </Link>
            </div>
            <p className="text-comando-600 text-xs">
              © 2026 CLUB SIGCA - ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </footer>
      
      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton />
    </div>
  );
}