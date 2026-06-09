import React from 'react';
import { Plus, Minus, Ticket } from 'lucide-react';

interface TicketSelectorProps {
  ticketPrice: number;
  currency: string;
  selectedCount: number;
  onChange: (count: number) => void;
  maxTickets?: number;
  soldTicketsCount: number;
  totalTicketsCount: number;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  ticketPrice,
  currency,
  selectedCount,
  onChange,
  maxTickets = 100,
  soldTicketsCount,
  totalTicketsCount
}) => {
  const percentSold = totalTicketsCount > 0 ? (soldTicketsCount / totalTicketsCount) * 100 : 0;

  const increment = () => {
    if (selectedCount < maxTickets) {
      onChange(selectedCount + 1);
    }
  };

  const decrement = () => {
    if (selectedCount > 1) {
      onChange(selectedCount - 1);
    }
  };

  return (
    <div className="ticket-selector-container">
      {/* Progress Bar of Sold Tickets */}
      <div className="progress-bar-wrapper">
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider mb-2">
          <span style={{ color: 'var(--text-secondary)' }}>Progreso de Venta</span>
          <span style={{ color: 'var(--accent-gold)' }}>{percentSold.toFixed(1)}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentSold}%`,
              background: 'linear-gradient(90deg, #aa8010 0%, #d4af37 100%)'
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>{soldTicketsCount} Vendidos</span>
          <span>{totalTicketsCount} Totales</span>
        </div>
      </div>

      {/* Ticket Counter Selection */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Ticket size={16} style={{ color: 'var(--accent-gold)' }} /> BOLETOS
        </h4>

        <div className="counter-box flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={decrement}
            disabled={selectedCount <= 1}
            className="counter-btn"
          >
            <Minus size={18} />
          </button>
          
          <input
            type="number"
            min={1}
            max={maxTickets}
            value={selectedCount}
            onChange={(e) => {
              const val = Math.max(1, Math.min(maxTickets, Number(e.target.value) || 1));
              onChange(val);
            }}
            className="w-16 text-center font-black bg-transparent border-b border-bg-tertiary focus:outline-none focus:border-accent-gold text-2xl font-orbitron text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={increment}
            disabled={selectedCount >= maxTickets}
            className="counter-btn"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Quick Ticket Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {[5, 10, 20, 50].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const newVal = Math.min(maxTickets, selectedCount + preset);
                onChange(newVal);
              }}
              className="px-2.5 py-1 rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-bg-tertiary text-[10px] font-bold text-accent-gold hover:text-white transition-all font-heading"
            >
              +{preset}
            </button>
          ))}
        </div>

        <div className="total-pay-box">
          <span className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Total a Pagar</span>
          <span className="text-3xl font-extrabold text-gold-gradient block mt-1">
            {currency}{ (selectedCount * ticketPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 }) }
          </span>
        </div>

        {/* Probability Gamification Indicator */}
        <div className="w-full mt-2 p-4 rounded-xl bg-bg-primary/40 border border-bg-tertiary text-center flex flex-col items-center gap-1.5 animate-fadeIn">
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Tu Probabilidad de Ganar</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gold-gradient font-orbitron">
              {((selectedCount / totalTicketsCount) * 100).toFixed(2)}%
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-accent-gold-muted border border-accent-gold-border text-accent-gold font-rajdhani">
              {selectedCount === 1 ? '🍀 Básico' : selectedCount < 5 ? '⚡ Bronce' : selectedCount < 10 ? '🔥 Épico' : '👑 Leyenda'}
            </span>
          </div>
          <p className="text-[10px] text-text-secondary leading-relaxed max-w-[260px] mx-auto">
            {selectedCount === 1 
              ? '¡Lleva más boletos para multiplicar tus posibilidades de ganar!' 
              : `¡Excelente! Tienes ${selectedCount} participaciones únicas aseguradas en la ruleta.`}
          </p>
        </div>
      </div>
    </div>
  );
};
