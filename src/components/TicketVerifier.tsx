import React, { useState } from 'react';
import { Search, Ticket, CheckCircle2, Clock } from 'lucide-react';

interface VerifiedTicket {
  ticketNumber: string;
  paymentStatus: 'pending_verification' | 'verified';
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
}

interface TicketVerifierProps {
  onSearch: (query: string) => VerifiedTicket[];
}

export const TicketVerifier: React.FC<TicketVerifierProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VerifiedTicket[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const tickets = onSearch(query);
      setResults(tickets);
      setSearched(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      {/* Search Panel matching mockup */}
      <div className="glass-panel p-8 rounded-2xl border border-border-color flex flex-col items-center gap-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white text-center">
          VERIFICADOR DE BOLETOS
        </h2>

        <form onSubmit={handleSearch} className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Número de Teléfono o Correo..."
              className="w-full py-4 px-5 rounded-xl border bg-bg-primary text-white text-sm font-medium transition-all duration-200 focus:outline-none focus:border-accent-gold"
              style={{
                borderColor: 'var(--border-color-light)'
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl font-bold tracking-wider text-sm transition-all duration-150 uppercase flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
              color: 'var(--bg-primary)'
            }}
          >
            <Search size={16} /> Buscar
          </button>
        </form>
      </div>

      {/* Results View */}
      {searched && results && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary text-left">
            Resultados de búsqueda ({results.length})
          </h3>

          {results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((ticket, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-5 rounded-xl flex items-center justify-between border"
                  style={{
                    borderColor: ticket.paymentStatus === 'verified' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bg-secondary border border-border-color-light flex items-center justify-center">
                      <Ticket size={20} style={{ color: 'var(--accent-gold)' }} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-text-muted block">Boleto adquirido</span>
                      <span className="text-lg font-extrabold text-white block">#{ticket.ticketNumber}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {ticket.paymentStatus === 'verified' ? (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Confirmado
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/50 flex items-center gap-1">
                        <Clock size={12} /> Por Validar
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">{ticket.buyerName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-xl text-center border border-border-color-light">
              <p className="text-sm text-text-secondary">No se encontraron boletos registrados bajo ese teléfono o correo electrónico.</p>
              <p className="text-xs text-text-muted mt-2">Por favor, verifica los datos e ingresa exactamente la información provista en la compra.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
