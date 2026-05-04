import React from 'react';

const RainbowBar: React.FC = () => (
  <div
    className="h-1 w-full"
    style={{
      background:
        'linear-gradient(90deg, #FF3CAC, #FFD700, #00D4FF, #FF3CAC, #FFD700, #00D4FF)',
      backgroundSize: '200% 100%',
      animation: 'rainbow-slide 4s linear infinite',
    }}
  />
);

export default RainbowBar;
