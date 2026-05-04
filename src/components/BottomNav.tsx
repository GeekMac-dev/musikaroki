import React from 'react';
import { Library, ListMusic, Trophy, User } from 'lucide-react';
import { useKaraokeStore } from '@/store/karaokeStore';

export type Tab = 'library' | 'queue' | 'leaderboard' | 'profile';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const BottomNav: React.FC<Props> = ({ active, onChange }) => {
  const { queue } = useKaraokeStore();
  const tabs: { id: Tab; icon: any; label: string; color: string }[] = [
    { id: 'library', icon: Library, label: 'Library', color: '#FFD700' },
    { id: 'queue', icon: ListMusic, label: 'Queue', color: '#FF3CAC' },
    { id: 'leaderboard', icon: Trophy, label: 'Scores', color: '#00D4FF' },
    { id: 'profile', icon: User, label: 'Profile', color: '#FF3CAC' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0015]/95 backdrop-blur-xl border-t border-purple-900/60">
      <div className="max-w-3xl mx-auto grid grid-cols-4">
        {tabs.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="relative flex flex-col items-center justify-center py-3 px-2 gap-1 transition-all"
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6 transition-all"
                  style={{ color: isActive ? t.color : '#a78bfa', filter: isActive ? `drop-shadow(0 0 6px ${t.color})` : 'none' }}
                />
                {t.id === 'queue' && queue.length > 0 && (
                  <span className="absolute -top-2 -right-3 bg-[#FF3CAC] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 neon-pink">
                    {queue.length}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isActive ? t.color : '#a78bfa' }}
              >
                {t.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
