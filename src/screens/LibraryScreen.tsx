import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/store/karaokeStore';
import SongCard from '@/components/SongCard';
import { Search, Loader2 } from 'lucide-react';
import { fallbackSongs, filterSongs } from '@/data/music';

const FILTERS = ['All', 'OPM', 'Pop', 'Rock', 'Love Songs', 'Trending'];
const PAGE_SIZE = 20;

interface Props {
  onPlay: (song: Song) => void;
}

const LibraryScreen: React.FC<Props> = ({ onPlay }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const localFallback = filterSongs(fallbackSongs, search, filter).slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE - 1
      );

      try {
        let q = supabase.from('songs').select('*');
        if (filter === 'OPM') q = q.eq('is_opm', true);
        else if (filter === 'Trending') q = q.gte('popularity', 90);
        else if (filter !== 'All') q = q.eq('genre', filter);
        if (search) q = q.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
        q = q.order('popularity', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        const { data, error } = await q;
        if (error || !data || data.length === 0) {
          setSongs(localFallback);
        } else {
          setSongs(data as Song[]);
        }
      } catch (error) {
        setSongs(localFallback);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, filter, page]);

  return (
    <div className="px-4 pt-6 pb-32 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-5xl md:text-6xl text-glow-gold text-[#FFD700]">SONG LIBRARY</h1>
        <p className="text-purple-200 mt-2">Pumili ng kanta, kababayan!</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search songs or artists..."
          className="w-full bg-[#15002a]/80 border-2 border-purple-900 focus:border-[#FFD700] rounded-full pl-12 pr-4 py-3 text-white placeholder-purple-400 outline-none transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f
                ? 'bg-[#FFD700] text-[#0A0015] neon-gold'
                : 'bg-[#15002a] text-purple-200 border border-purple-800 hover:border-[#FFD700]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-20 text-purple-300">No songs found. Try another search!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((s) => (
            <SongCard key={s.id} song={s} onPlay={onPlay} />
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-8">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="px-6 py-2 bg-[#15002a] border border-purple-700 rounded-lg text-white disabled:opacity-30 hover:border-[#FFD700]"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-[#FFD700] font-bold">Page {page + 1}</span>
        <button
          disabled={songs.length < PAGE_SIZE}
          onClick={() => setPage((p) => p + 1)}
          className="px-6 py-2 bg-[#15002a] border border-purple-700 rounded-lg text-white disabled:opacity-30 hover:border-[#FFD700]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LibraryScreen;
