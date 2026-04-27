import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phoneNumber = '34693242855'; // Sin espacios ni símbolos
  const message = encodeURIComponent('¡Hola! Me gustaría obtener más información sobre el Club SIGCA.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Contactar por WhatsApp"
    >
      <div className="relative">
        {/* Pulso animado */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-75"></div>
        
        {/* Botón principal */}
        <div className="relative bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-2xl transition-all duration-300 group-hover:scale-110">
          <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-carbon text-white text-sm font-tactical uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Contáctanos por WhatsApp
        <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-carbon"></div>
      </div>
    </a>
  );
}