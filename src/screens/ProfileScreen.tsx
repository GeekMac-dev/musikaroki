import React from 'react';
import { useKaraokeStore } from '@/store/karaokeStore';
import { User, Music2, Trophy, BarChart3, Tv, Users, Sparkles } from 'lucide-react';

const ProfileScreen: React.FC = () => {
  const {
    playerName, setPlayerName,
    totalSongs, bestScore, superstarCount, recentSongs,
    tvMode, setTvMode, duetMode, setDuetMode,
  } = useKaraokeStore();

  return (
    <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-5xl md:text-6xl text-glow-pink text-[#FF3CAC]">PROFILE</h1>
        <p className="text-purple-200 mt-2">Your karaoke kingdom</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-[#15002a]/80 border border-purple-900 rounded-2xl p-6 mb-4 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF3CAC] flex items-center justify-center neon-gold mb-3">
          <User className="w-12 h-12 text-[#0A0015]" />
        </div>
        <label className="text-xs text-purple-300 uppercase tracking-widest">Your Nickname</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="block mx-auto mt-2 bg-transparent border-b-2 border-[#FFD700] text-center font-display text-2xl text-white outline-none focus:border-[#FF3CAC] transition-all"
          maxLength={20}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <Music2 className="w-6 h-6 mx-auto text-[#00D4FF] mb-1" />
          <div className="font-display text-3xl text-white">{totalSongs}</div>
          <div className="text-[10px] text-purple-300 uppercase">Songs Sung</div>
        </div>
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <BarChart3 className="w-6 h-6 mx-auto text-[#FFD700] mb-1" />
          <div className="font-display text-3xl text-white">{bestScore}</div>
          <div className="text-[10px] text-purple-300 uppercase">Best Score</div>
        </div>
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto text-[#FF3CAC] mb-1" />
          <div className="font-display text-3xl text-white">{superstarCount}</div>
          <div className="text-[10px] text-purple-300 uppercase">Superstars</div>
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-[#15002a]/80 border border-purple-900 rounded-2xl p-4 mb-4 space-y-3">
        <h3 className="font-display text-lg text-[#FFD700] flex items-center gap-2"><Sparkles className="w-5 h-5"/> Settings</h3>
        <div className="flex items-center justify-between p-3 bg-[#0A0015]/60 rounded-lg">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-[#00D4FF]" />
            <div>
              <div className="text-white font-bold">TV Mode</div>
              <div className="text-xs text-purple-300">Larger text for casting</div>
            </div>
          </div>
          <button
            onClick={() => setTvMode(!tvMode)}
            className={`w-14 h-8 rounded-full transition-all ${tvMode ? 'bg-[#FFD700]' : 'bg-purple-900'} relative`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${tvMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-[#0A0015]/60 rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#FF3CAC]" />
            <div>
              <div className="text-white font-bold">Duet Mode</div>
              <div className="text-xs text-purple-300">2-player split mic</div>
            </div>
          </div>
          <button
            onClick={() => setDuetMode(!duetMode)}
            className={`w-14 h-8 rounded-full transition-all ${duetMode ? 'bg-[#FF3CAC]' : 'bg-purple-900'} relative`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${duetMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Recent songs */}
      <div className="bg-[#15002a]/80 border border-purple-900 rounded-2xl p-4">
        <h3 className="font-display text-lg text-[#00D4FF] mb-3">Recent Songs</h3>
        {recentSongs.length === 0 ? (
          <p className="text-purple-300 text-sm text-center py-4">No songs yet. Start singing!</p>
        ) : (
          <div className="space-y-2">
            {recentSongs.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-[#0A0015]/40 rounded-lg">
                <Music2 className="w-4 h-4 text-[#FFD700]" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{s.title}</div>
                  <div className="text-xs text-purple-300 truncate">{s.artist}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
