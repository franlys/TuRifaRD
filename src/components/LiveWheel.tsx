import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface Participant {
  id: string;
  name: string;
  ticketNumber: string;
}

interface LiveWheelProps {
  participants: Participant[];
  onDrawComplete: (winner: Participant) => void;
  triggerSpin: boolean;
}

export const LiveWheel: React.FC<LiveWheelProps> = ({
  participants,
  onDrawComplete,
  triggerSpin
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);

  // Sound generator using Web Audio API so we don't need external assets
  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // Audio context might be blocked or unsupported
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startAngle = 0;
    
    // Fallback if no participants exist
    const list = participants.length > 0 
      ? participants 
      : Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, name: `Boleto #${i+1}`, ticketNumber: `000${i+1}` }));
      
    const numSegments = list.length;
    const arc = (2 * Math.PI) / numSegments;
    
    let spinAngleStart = 0;
    let spinTime = 0;
    let spinTimeTotal = 0;

    const drawRouletteWheel = (angleOffset = 0) => {
      const size = Math.min(canvas.width, canvas.height);
      const center = size / 2;
      const radius = center - 15;

      ctx.clearRect(0, 0, size, size);

      // Shadow behind the wheel
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Draw segments
      for (let i = 0; i < numSegments; i++) {
        const angle = angleOffset + i * arc;
        ctx.fillStyle = i % 2 === 0 ? '#121216' : '#1e1e24';
        
        ctx.beginPath();
        ctx.arc(center, center, radius, angle, angle + arc, false);
        ctx.lineTo(center, center);
        ctx.fill();

        // Stroke gold border on segments
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.shadowBlur = 0; // Disable shadows for text
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#ffffff';
        ctx.translate(
          center + Math.cos(angle + arc / 2) * (radius * 0.7),
          center + Math.sin(angle + arc / 2) * (radius * 0.7)
        );
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        
        ctx.font = '600 12px Outfit, sans-serif';
        const label = `${list[i].ticketNumber}`;
        ctx.fillText(label, -ctx.measureText(label).width / 2, 0);
        ctx.restore();
      }

      // Outer gold rim
      ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Inner decorative ring
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center, center, radius - 15, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw center golden knob
      ctx.fillStyle = '#d4af37';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(center, center, 24, 0, 2 * Math.PI);
      ctx.fill();

      // Inner knob glow
      ctx.fillStyle = '#f3cf65';
      ctx.beginPath();
      ctx.arc(center, center, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw the top pointer arrow
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.moveTo(center - 12, center - radius - 10);
      ctx.lineTo(center + 12, center - radius - 10);
      ctx.lineTo(center, center - radius + 15);
      ctx.closePath();
      ctx.fill();
      
      // Pointer gold frame
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    let currentAngle = startAngle;
    let lastTickAngle = 0;

    const rotateWheel = () => {
      spinTime += 30;
      if (spinTime >= spinTimeTotal) {
        setSpinning(false);
        
        // Settle on final index
        const degrees = (currentAngle * 180) / Math.PI + 90;
        const arcd = (arc * 180) / Math.PI;
        const index = Math.floor((360 - (degrees % 360)) / arcd) % numSegments;
        const finalWinner = list[index >= 0 ? index : 0];
        
        setCurrentWinner(finalWinner);
        onDrawComplete(finalWinner);

        // Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#ffffff', '#aa8010']
        });
        return;
      }

      // Easing function
      const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
      currentAngle += (spinAngle * Math.PI) / 180;
      
      // Sound tick triggers
      const currentAngleDeg = (currentAngle * 180) / Math.PI;
      if (Math.floor(currentAngleDeg / (360 / numSegments)) !== Math.floor(lastTickAngle / (360 / numSegments))) {
        playTickSound();
        lastTickAngle = currentAngleDeg;
      }

      drawRouletteWheel(currentAngle);
      animationFrameId = requestAnimationFrame(rotateWheel);
    };

    const easeOut = (t: number, b: number, c: number, d: number) => {
      const ts = (t /= d) * t;
      const tc = ts * t;
      return b + c * (tc + -3 * ts + 3 * t);
    };

    if (triggerSpin && !spinning) {
      setSpinning(true);
      setCurrentWinner(null);
      spinAngleStart = Math.random() * 10 + 15; // 15 to 25 deg per step
      spinTime = 0;
      spinTimeTotal = Math.random() * 3000 + 4000; // 4s to 7s duration
      rotateWheel();
    } else {
      drawRouletteWheel(currentAngle);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [participants, triggerSpin]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          style={{ width: '360px', height: '360px' }}
          className="rounded-full shadow-lg"
        />
      </div>

      {currentWinner && (
        <div className="glass-panel p-6 rounded-2xl border border-gold text-center max-w-sm glow-gold animate-bounce">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent-gold" style={{ color: 'var(--accent-gold)' }}>
            ¡Boleto Ganador!
          </h4>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            #{currentWinner.ticketNumber}
          </h2>
          <p className="text-md text-gray-300 mt-2 font-medium">
            {currentWinner.name}
          </p>
        </div>
      )}

      {spinning && (
        <div className="text-center">
          <p className="text-md text-accent-gold animate-pulse font-medium">
            Girando la ruleta del destino...
          </p>
        </div>
      )}
    </div>
  );
};
