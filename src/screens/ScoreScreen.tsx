import React, { useEffect, useRef, useState } from 'react';
import { Song, useKaraokeStore } from '@/store/karaokeStore';
import { supabase } from '@/lib/supabase';
import Confetti from '@/components/Confetti';
import { Trophy, Medal, Music2, Share2, ArrowRight, Library, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  song: Song;
  scores: { pitch: number; timing: number; consistency: number; final: number };
  recordingBlob: Blob | null;
  onNext: () => void;
  onLibrary: () => void;
}

const getRank = (s: number) => {
  if (s >= 90) return { label: 'SUPERSTAR!', color: '#FFD700', emoji: <Trophy className="w-12 h-12" /> };
  if (s >= 80) return { label: 'MAGALING!', color: '#FFD700', emoji: <Medal className="w-12 h-12" /> };
  if (s >= 65) return { label: 'NICE TRY!', color: '#C0C0C0', emoji: <Medal className="w-12 h-12" /> };
  return { label: 'PRACTICE MORE!', color: '#FF3CAC', emoji: <Music2 className="w-12 h-12" /> };
};

const ScoreScreen: React.FC<Props> = ({ song, scores, recordingBlob, onNext, onLibrary }) => {
  const { playerName, recordPerformance } = useKaraokeStore();
  const [revealed, setRevealed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rank = getRank(scores.final);

  // Build local URL for immediate playback + upload to Supabase Storage
  useEffect(() => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordingBlob]);

  // Animate score reveal + persist to DB (upload audio first if available)
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += 2;
      setRevealed(Math.min(scores.final, v));
      if (v >= scores.final) clearInterval(id);
    }, 30);

    const persist = async () => {
      let recording_url: string | null = null;

      // Upload recording blob to Supabase Storage
      if (recordingBlob && recordingBlob.size > 0) {
        try {
          setUploading(true);
          const ext = (recordingBlob.type.split('/')[1] || 'webm').split(';')[0];
          const filename = `${Date.now()}-${song.id}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase
            .storage
            .from('karaoke-recordings')
            .upload(filename, recordingBlob, { contentType: recordingBlob.type, upsert: false });
          if (!upErr) {
            const { data } = supabase.storage.from('karaoke-recordings').getPublicUrl(filename);
            recording_url = data.publicUrl;
            setUploadedUrl(recording_url);
          } else {
            console.warn('Upload failed', upErr.message || upErr);
          }
        } catch (e) {
          console.warn('Upload failed', e);
        } finally {
          setUploading(false);
        }
      }

      try {
        await supabase.from('scores').insert({
          song_id: song.id,
          player_name: playerName,
          pitch_score: scores.pitch,
          timing_score: scores.timing,
          consistency_score: scores.consistency,
          final_score: scores.final,
          recording_url,
        });
      } catch (e) {
        console.warn('Score submission failed', e);
      }
    };

    persist();
    recordPerformance(song, scores.final);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => toast.error('Playback failed'));
  };

  const share = () => {
    const text = `I scored ${scores.final} on "${song.title}" by ${song.artist} on MUSIKAROKI! 🎤`;
    if (navigator.share) {
      navigator.share({ title: 'MUSIKAROKI Score', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Score copied to clipboard!');
    }
  };

  const dash = 2 * Math.PI * 90;
  const offset = dash - (revealed / 100) * dash;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0A0015] via-[#1a0033] to-[#0A0015] flex flex-col items-center justify-start py-6 px-6 overflow-y-auto">
      <Confetti active={scores.final >= 90} />

      <div className="text-center mb-4">
        <p className="text-purple-300 text-sm">{playerName} sang</p>
        <h2 className="font-display text-2xl text-white">{song.title}</h2>
        <p className="text-purple-300 text-sm">{song.artist}</p>
      </div>

      <div className="relative" style={{ animation: 'score-reveal 0.8s ease-out' }}>
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r="90" stroke="#2a0055" strokeWidth="14" fill="none" />
          <circle
            cx="110" cy="110" r="90" stroke="url(#grad)" strokeWidth="14" fill="none"
            strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FF3CAC" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-7xl text-[#FFD700] text-glow-gold">{revealed}</div>
          <div className="text-xs text-purple-300 uppercase tracking-widest">out of 100</div>
        </div>
      </div>

      <div
        className="mt-6 px-6 py-3 rounded-full font-display text-2xl flex items-center gap-3"
        style={{
          background: `linear-gradient(90deg, ${rank.color}33, ${rank.color}66)`,
          border: `2px solid ${rank.color}`,
          color: rank.color,
          boxShadow: `0 0 30px ${rank.color}66`,
        }}
      >
        {rank.emoji}
        {rank.label}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-md">
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <div className="text-xs text-purple-300 mb-1">PITCH</div>
          <div className="font-display text-3xl text-[#FFD700]">{scores.pitch}</div>
        </div>
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <div className="text-xs text-purple-300 mb-1">TIMING</div>
          <div className="font-display text-3xl text-[#FF3CAC]">{scores.timing}</div>
        </div>
        <div className="bg-[#15002a]/80 border border-purple-900 rounded-xl p-4 text-center">
          <div className="text-xs text-purple-300 mb-1">CONSISTENCY</div>
          <div className="font-display text-3xl text-[#00D4FF]">{scores.consistency}</div>
        </div>
      </div>

      {/* Recorded performance playback */}
      {audioUrl && (
        <div className="mt-6 w-full max-w-md bg-[#15002a]/80 border border-purple-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-[#00D4FF]">Your Performance</h3>
            {uploading ? (
              <span className="text-xs text-purple-300 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </span>
            ) : uploadedUrl ? (
              <span className="text-xs text-green-400">Saved</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF3CAC] text-[#0A0015] flex items-center justify-center neon-gold flex-shrink-0"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              controls
              className="flex-1 min-w-0"
              style={{ filter: 'invert(0.9) hue-rotate(180deg)' }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md mb-8">
        <button onClick={share} className="flex items-center justify-center gap-2 px-5 py-3 bg-[#15002a] border border-purple-700 hover:border-[#00D4FF] rounded-xl text-white font-bold">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button onClick={onLibrary} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#15002a] border border-purple-700 hover:border-[#FFD700] rounded-xl text-white font-bold">
          <Library className="w-4 h-4" /> Library
        </button>
        <button onClick={onNext} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FFD700] to-[#FF3CAC] rounded-xl text-[#0A0015] font-display text-lg neon-gold">
          Next <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;
