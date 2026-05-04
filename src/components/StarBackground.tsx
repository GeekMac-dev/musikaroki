import React, { useMemo } from 'react';

const StarBackground: React.FC = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      })),
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0015] via-[#1a0033] to-[#0A0015]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, #FF3CAC22 0%, transparent 50%), radial-gradient(circle at 80% 70%, #00D4FF22 0%, transparent 50%), radial-gradient(circle at 50% 50%, #FFD70011 0%, transparent 70%)',
        }}
      />
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: '0 0 6px #fff',
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;
