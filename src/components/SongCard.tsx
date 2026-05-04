import React from 'react';
import { Song, useKaraokeStore } from '@/store/karaokeStore';
import { Plus, Music2, Mic2, Star } from 'lucide-react';
import { toast } from 'sonner';

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const genreColor = (genre: string) => {
  const map: Record<string, string> = {
    OPM: 'from-[#FFD700] to-[#FF3CAC]',
    Rock: 'from-red-500 to-orange-500',
    Pop: 'from-[#FF3CAC] to-[#00D4FF]',
    'Love Songs': 'from-pink-400 to-rose-500',
  };
  return map[genre] || 'from-purple-500 to-indigo-500';
};

interface Props {
  song: Song;
  onPlay?: (song: Song) => void;
}

const SongCard: React.FC<Props> = ({ song, onPlay }) => {
  const { addToQueue } = useKaraokeStore();

  const handleAdd = () => {
    addToQueue(song);
    toast.success(`Added "${song.title}" to queue!`, {
      style: { background: '#0A0015', color: '#FFD700', border: '1px solid #FFD700' },
    });
  };

  return (
    <div
      className="group relative bg-[#15002a]/80 backdrop-blur border border-purple-900/50 rounded-xl p-4 hover:border-[#FFD700] transition-all duration-300 hover:scale-[1.02]"
      style={{ boxShadow: '0 4px 20px rgba(255, 60, 172, 0.1)' }}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br ${genreColor(song.genre)} flex items-center justify-center`}>
          <Music2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-white truncate group-hover:text-glow-gold transition-all">
            {song.title}
          </h3>
          <p className="text-sm text-purple-200 truncate">{song.artist}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${genreColor(song.genre)} text-white`}>
              {song.genre}
            </span>
            {song.is_opm && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD700] text-[#0A0015]">
                OPM
              </span>
            )}
            <span className="text-[10px] text-purple-300">{formatDuration(song.duration)}</span>
            {song.popularity >= 95 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#FFD700]">
                <Star className="w-3 h-3 fill-[#FFD700]" /> HOT
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-1 bg-[#FF3CAC]/20 hover:bg-[#FF3CAC] text-[#FF3CAC] hover:text-white border border-[#FF3CAC] py-2 rounded-lg text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" /> Queue
        </button>
        {onPlay && (
          <button
            onClick={() => onPlay(song)}
            className="flex-1 flex items-center justify-center gap-1 bg-[#FFD700] hover:bg-[#FFE74C] text-[#0A0015] py-2 rounded-lg text-sm font-bold transition-all neon-gold"
          >
            <Mic2 className="w-4 h-4" /> Sing!
          </button>
        )}
      </div>
    </div>
  );
};

export default SongCard;
