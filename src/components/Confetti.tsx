import React, { useMemo } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2,
        color: ['#FFD700', '#FF3CAC', '#00D4FF', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 8 + 6,
      })),
    []
  );

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
