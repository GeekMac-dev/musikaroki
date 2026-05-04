import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

const FILTERS = ['All Time', 'This Week', 'OPM Only'];

interface LeaderRow {
  id: number;
  player_name: string;
  final_score: number;
  pitch_score: number;
  timing_score: number;
  consistency_score: number;
  recorded_at: string;
  songs?: { title: string; artist: string; is_opm: boolean };
}

const LeaderboardScreen: React.FC = () => {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Time');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('scores')
          .select('*, songs(title, artist, is_opm)')
          .order('final_score', { ascending: false })
          .limit(20);
        if (filter === 'This Week') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          q = q.gte('recorded_at', weekAgo);
        }
        const { data, error } = await q;
        if (error || !data) {
          setRows([]);
        } else {
          let result = (data as any[]) || [];
          if (filter === 'OPM Only') result = result.filter((r) => r.songs?.is_opm);
          setRows(result);
        }
      } catch (error) {
        console.warn('Leaderboard load failed', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel('scores-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const medal = (i: number) => {
    if (i === 0) return <Trophy className="w-6 h-6 text-[#FFD700]" />;
    if (i === 1) return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
    if (i === 2) return <Award className="w-6 h-6 text-[#CD7F32]" />;
    return <span className="font-display text-purple-300 w-6 text-center">{i + 1}</span>;
  };

  return (
    <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-5xl md:text-6xl text-glow-cyan text-[#00D4FF]">LEADERBOARD</h1>
        <p className="text-purple-200 mt-2">Top 20 superstars of MUSIKAROKI</p>
      </div>

      <div className="flex gap-2 mb-4 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              filter === f ? 'bg-[#00D4FF] text-[#0A0015] neon-pink' : 'bg-[#15002a] text-purple-200 border border-purple-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#00D4FF] animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-purple-300">No scores yet. Be the first!</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                i === 0
                  ? 'bg-gradient-to-r from-[#FFD700]/20 to-transparent border-[#FFD700]'
                  : i === 1
                  ? 'bg-gradient-to-r from-[#C0C0C0]/20 to-transparent border-[#C0C0C0]'
                  : i === 2
                  ? 'bg-gradient-to-r from-[#CD7F32]/20 to-transparent border-[#CD7F32]'
                  : 'bg-[#15002a]/80 border-purple-900'
              }`}
            >
              <div className="flex-shrink-0">{medal(i)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-white truncate">{r.player_name}</div>
                <div className="text-xs text-purple-300 truncate">
                  {r.songs?.title || 'Unknown'} • {r.songs?.artist || ''}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-[#FFD700] text-glow-gold">{r.final_score}</div>
                <div className="text-[10px] text-purple-300">{new Date(r.recorded_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardScreen;
