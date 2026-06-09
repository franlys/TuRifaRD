import React, { useState, useEffect } from 'react';

interface CountdownClockProps {
  targetDate: string | Date;
  onExpire?: () => void;
}

export const CountdownClock: React.FC<CountdownClockProps> = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        if (onExpire && !timeLeft.isExpired) {
          onExpire();
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const renderUnit = (value: number, label: string, max: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / max) * circumference;

    return (
      <div className="countdown-unit">
        <svg className="countdown-svg" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="countdown-circle-bg"
          />
          {/* Glowing progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="countdown-circle-progress"
          />
        </svg>
        <div className="countdown-text-overlay">
          <span className="countdown-number">
            {value.toString().padStart(2, '0')}
          </span>
          <span className="countdown-label">
            {label}
          </span>
        </div>
      </div>
    );
  };

  if (timeLeft.isExpired) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center max-w-md mx-auto glow-gold" style={{ borderColor: 'var(--accent-gold)' }}>
        <h3 className="text-xl font-bold text-gold-gradient mb-2">¡Llegó la Hora!</h3>
        <p className="text-sm text-gray-400">El sorteo ha comenzado o se cerrará pronto. ¡Mucha suerte a todos!</p>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      {renderUnit(timeLeft.days, 'Días', 365)}
      {renderUnit(timeLeft.hours, 'Horas', 24)}
      {renderUnit(timeLeft.minutes, 'Minutos', 60)}
      {renderUnit(timeLeft.seconds, 'Segundos', 60)}
    </div>
  );
};
