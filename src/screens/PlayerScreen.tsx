import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Song } from '@/store/karaokeStore';
import { supabase } from '@/lib/supabase';
import { X, Mic, Square, Volume2, MicOff, AlertCircle } from 'lucide-react';
import { useMicPitch, hzToMidi, PitchSample } from '@/hooks/useMicPitch';
import { toast } from 'sonner';
import { fallbackLyricsBySong } from '@/data/music';

interface Lyric {
  id: number;
  line_text: string;
  start_time: number;
  end_time: number;
}

export interface FinishPayload {
  pitch: number;
  timing: number;
  consistency: number;
  final: number;
  recordingBlob: Blob | null;
}

interface Props {
  song: Song;
  onFinish: (score: FinishPayload) => void;
  onExit: () => void;
}

const MicVisualizer: React.FC<{ active: boolean; level: number; freqHistory: number[] }> = ({ active, level, freqHistory }) => (
  <div className="flex items-end justify-center gap-1 h-16">
    {Array.from({ length: 24 }).map((_, i) => {
      // Combine global RMS level with per-bar variation derived from recent freq history
      const variation = freqHistory[i % freqHistory.length] || 0;
      const h = active
        ? Math.max(8, Math.min(100, level * 0.6 + variation * 0.4 + Math.sin(Date.now() / 200 + i) * 10))
        : 8;
      return (
        <div
          key={i}
          className="w-2 rounded-t transition-all duration-75"
          style={{
            height: `${h}%`,
            background: 'linear-gradient(to top, #FF3CAC, #FFD700, #00D4FF)',
            boxShadow: active && level > 20 ? '0 0 8px #FFD700' : 'none',
          }}
        />
      );
    })}
  </div>
);

/** Stable per-line "expected" MIDI note derived deterministically from line text. */
const expectedMidiForLine = (line: string, songId: number): number => {
  // Build a simple hash of the line + song id, map into a vocal range (C3..C5 = 48..72)
  let h = songId * 31;
  for (let i = 0; i < line.length; i++) h = (h * 31 + line.charCodeAt(i)) | 0;
  const range = 24; // 2 octaves
  const base = 52; // E3
  return base + Math.abs(h) % range;
};

const PlayerScreen: React.FC<Props> = ({ song, onFinish, onExit }) => {
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [pitch, setPitch] = useState(0);
  const [tempo, setTempo] = useState(100);
  const [echo, setEcho] = useState(false);
  const [reverb, setReverb] = useState(true);
  const [guideVocals, setGuideVocals] = useState(true);
  const [recording, setRecording] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [currentHz, setCurrentHz] = useState(0);
  const [centsOff, setCentsOff] = useState<number | null>(null);
  const [freqBars, setFreqBars] = useState<number[]>(Array(24).fill(0));

  // Refs we read on finalize (to avoid stale closures)
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();
  const pitchScoreSamplesRef = useRef<number[]>([]); // per-frame pitch accuracy (0..100)
  const timingHitsRef = useRef<{ hits: number; total: number }>({ hits: 0, total: 0 });
  const detectedMidiSamplesRef = useRef<number[]>([]); // for consistency calc
  const lyricsRef = useRef<Lyric[]>([]);
  const finalizingRef = useRef(false);

  useEffect(() => { lyricsRef.current = lyrics; }, [lyrics]);

  // ---- Mic pitch handler (called on every audio frame) ----
  const handleSample = useCallback((s: PitchSample) => {
    // Update visualizer state at a throttled rate
    setMicLevel(s.level);
    setCurrentHz(s.hz);
    setFreqBars((prev) => {
      const next = prev.slice(1);
      next.push(s.level);
      return next;
    });

    if (!started || finalizingRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000 * (tempo / 100);
    const activeLyric = lyricsRef.current.find(
      (l) => elapsed >= l.start_time && elapsed <= l.end_time
    );

    // Timing tracker (counts frames inside lyric windows + voice detected)
    if (activeLyric) {
      timingHitsRef.current.total += 1;
      if (s.hz > 0 && s.level > 8) timingHitsRef.current.hits += 1;
    }

    // Pitch accuracy + consistency only when a pitch is detected loud enough
    if (s.hz > 0 && s.level > 8) {
      const detectedMidi = s.midi;
      detectedMidiSamplesRef.current.push(detectedMidi);

      if (activeLyric) {
        const target = expectedMidiForLine(activeLyric.line_text, song.id);
        // Fold octave so jumps don't kill score
        let diff = detectedMidi - target;
        diff = ((diff + 6) % 12 + 12) % 12 - 6; // [-6..6]
        const cents = diff * 100;
        setCentsOff(Math.round(cents));
        const accuracy = Math.max(0, 100 - Math.abs(diff) * 18); // 1 semitone ≈ -18
        pitchScoreSamplesRef.current.push(accuracy);

        // Live score = exponential moving avg
        setLiveScore((prev) => Math.round(prev * 0.92 + accuracy * 0.08));
      } else {
        setCentsOff(null);
      }
    } else {
      setCentsOff(null);
    }
  }, [started, tempo, song.id]);

  const { start: startMic, stop: stopMic, error: micError } = useMicPitch(handleSample);

  // ---- Load lyrics ----
  useEffect(() => {
    const load = async () => {
      const local = fallbackLyricsBySong[song.id];
      try {
        const { data, error } = await supabase
          .from('lyrics')
          .select('*')
          .eq('song_id', song.id)
          .order('start_time');
        if (error || !data || data.length === 0) {
          if (local) setLyrics(local as Lyric[]);
          else {
            const fallback = [
              'La la la la la',
              'Sing along with me now',
              'Music in the air',
              'Tonight we celebrate',
              'Voices rise together',
              'Magkakasama tayo',
              'Awit ng pag-ibig',
              'Forever in our hearts',
              'Sing it loud and proud',
              'MUSIKAROKI night!',
            ].map((t, i) => ({
              id: i,
              line_text: t,
              start_time: 4 + i * 5,
              end_time: 9 + i * 5,
            }));
            setLyrics(fallback);
          }
        } else {
          setLyrics(data as Lyric[]);
        }
      } catch (error) {
        if (local) setLyrics(local as Lyric[]);
        else {
          const fallback = [
            'La la la la la',
            'Sing along with me now',
            'Music in the air',
            'Tonight we celebrate',
            'Voices rise together',
            'Magkakasama tayo',
            'Awit ng pag-ibig',
            'Forever in our hearts',
            'Sing it loud and proud',
            'MUSIKAROKI night!',
          ].map((t, i) => ({
            id: i,
            line_text: t,
            start_time: 4 + i * 5,
            end_time: 9 + i * 5,
          }));
          setLyrics(fallback);
        }
      }
    };
    load();
  }, [song.id]);

  // ---- Countdown ----
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (!started) {
      // Kick off mic + recording
      startMic().then(() => {
        setStarted(true);
        setRecording(true);
        startTimeRef.current = performance.now();
      }).catch(() => {});
    }
  }, [countdown, started, startMic]);

  // ---- Time tracker ----
  useEffect(() => {
    if (!started) return;
    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000 * (tempo / 100);
      setTime(elapsed);
      const maxDuration = Math.min(song.duration, 60);
      if (elapsed >= maxDuration && !finalizingRef.current) {
        finalize();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line
  }, [started, tempo]);

  const finalize = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const pitchSamples = pitchScoreSamplesRef.current;
    const detectedNotes = detectedMidiSamplesRef.current;
    const { hits, total } = timingHitsRef.current;

    // Pitch accuracy: average of per-frame pitch accuracies
    let pitchScore = 0;
    if (pitchSamples.length > 0) {
      const sum = pitchSamples.reduce((a, b) => a + b, 0);
      pitchScore = Math.round(sum / pitchSamples.length);
    }

    // Timing: % of time-in-lyric where the user actually produced sound
    const timingScore = total > 0 ? Math.round((hits / total) * 100) : 0;

    // Consistency: 100 - normalized stddev of detected MIDI notes (lower variance = more consistent)
    let consistencyScore = 0;
    if (detectedNotes.length > 4) {
      const avg = detectedNotes.reduce((a, b) => a + b, 0) / detectedNotes.length;
      const variance = detectedNotes.reduce((s, v) => s + (v - avg) ** 2, 0) / detectedNotes.length;
      const std = Math.sqrt(variance);
      consistencyScore = Math.max(0, Math.min(100, Math.round(100 - std * 8)));
    }

    // If user barely sang, floor everything reasonably
    if (pitchSamples.length < 5) {
      pitchScore = Math.max(pitchScore, 10);
      consistencyScore = Math.max(consistencyScore, 10);
    }

    const final = Math.round(pitchScore * 0.5 + timingScore * 0.3 + consistencyScore * 0.2);

    const blob = await stopMic();

    onFinish({
      pitch: pitchScore,
      timing: timingScore,
      consistency: consistencyScore,
      final,
      recordingBlob: blob,
    });
  }, [stopMic, onFinish]);

  // Show mic error
  useEffect(() => {
    if (micError) toast.error(`Mic error: ${micError}`);
  }, [micError]);

  const currentLineIdx = lyrics.findIndex((l) => time >= l.start_time && time <= l.end_time);
  const activeLine = currentLineIdx >= 0 ? lyrics[currentLineIdx] : null;
  const prevLine = currentLineIdx > 0 ? lyrics[currentLineIdx - 1] : null;
  const nextLine = currentLineIdx >= 0 && currentLineIdx < lyrics.length - 1 ? lyrics[currentLineIdx + 1] : null;

  const renderActiveLine = () => {
    if (!activeLine) {
      const upcoming = lyrics.find((l) => time < l.start_time);
      return upcoming ? (
        <span className="text-purple-400/60">{upcoming.line_text}</span>
      ) : <span className="text-purple-400/60">~ ~ ~</span>;
    }
    const words = activeLine.line_text.split(' ');
    const lineProgress = (time - activeLine.start_time) / (activeLine.end_time - activeLine.start_time);
    const wordsLit = Math.floor(lineProgress * words.length);
    return (
      <span>
        {words.map((w, i) => (
          <span
            key={i}
            className={i <= wordsLit ? 'text-[#FFD700] text-glow-gold' : 'text-white/70'}
          >
            {w}{' '}
          </span>
        ))}
      </span>
    );
  };

  if (countdown > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0015] flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl text-purple-300 mb-2">Get ready to sing</h2>
          <h1 className="font-display text-4xl text-[#FFD700] text-glow-gold">{song.title}</h1>
          <p className="text-purple-200 text-xl">{song.artist}</p>
          <p className="text-purple-400 text-xs mt-4 flex items-center justify-center gap-1">
            <Mic className="w-3 h-3" /> Allow mic access when prompted
          </p>
        </div>
        <div
          key={countdown}
          className="font-display text-[12rem] leading-none text-[#FF3CAC] text-glow-pink"
          style={{ animation: 'countdown-pop 1s ease-out' }}
        >
          {countdown}
        </div>
      </div>
    );
  }

  const progress = Math.min(100, (time / Math.min(song.duration, 60)) * 100);
  const tunerColor =
    centsOff === null ? '#a78bfa'
    : Math.abs(centsOff) < 30 ? '#FFD700'
    : Math.abs(centsOff) < 80 ? '#00D4FF'
    : '#FF3CAC';

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0015] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-purple-900/50">
        <button onClick={onExit} className="p-2 text-white hover:bg-red-500/20 rounded-lg">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center min-w-0 px-2">
          <div className="font-display text-lg text-[#FFD700] truncate">{song.title}</div>
          <div className="text-xs text-purple-300 truncate">{song.artist}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-purple-300">SCORE</div>
          <div className="font-display text-2xl text-glow-gold text-[#FFD700]">{liveScore}</div>
        </div>
      </div>

      {/* Mic error banner */}
      {micError && (
        <div className="bg-red-900/50 border-b border-red-500 text-red-100 text-xs px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {micError} — please allow microphone access and try again.
        </div>
      )}

      {/* Lyrics display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-xl md:text-2xl text-purple-400/40 min-h-[2rem] mb-4">
          {prevLine?.line_text || ''}
        </div>
        <div className="font-display text-3xl md:text-5xl lg:text-6xl mb-4 min-h-[5rem] leading-tight">
          {renderActiveLine()}
        </div>
        <div className="text-xl md:text-2xl text-purple-400/40 min-h-[2rem]">
          {nextLine?.line_text || ''}
        </div>

        {/* Live tuner */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase tracking-widest text-purple-400">Live Pitch</div>
          <div className="flex items-center gap-3">
            <div className="font-display text-2xl" style={{ color: tunerColor }}>
              {currentHz > 0 ? `${currentHz.toFixed(1)} Hz` : '— Hz'}
            </div>
            {currentHz > 0 && (
              <div className="text-xs text-purple-300">
                MIDI {hzToMidi(currentHz).toFixed(1)}
                {centsOff !== null && (
                  <span className="ml-2" style={{ color: tunerColor }}>
                    {centsOff > 0 ? '+' : ''}{centsOff}¢
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Tuner bar */}
          <div className="w-64 h-2 bg-purple-900/40 rounded-full relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40" />
            {centsOff !== null && (
              <div
                className="absolute top-0 bottom-0 w-2 rounded-full transition-all"
                style={{
                  left: `calc(50% + ${Math.max(-50, Math.min(50, centsOff / 2))}% - 4px)`,
                  background: tunerColor,
                  boxShadow: `0 0 10px ${tunerColor}`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mic visualizer */}
      <div className="px-6 mb-3">
        <MicVisualizer active={recording} level={micLevel} freqHistory={freqBars} />
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-3">
        <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FFD700] via-[#FF3CAC] to-[#00D4FF] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-purple-300 mt-1">
          <span>{Math.floor(time)}s</span>
          <span>{Math.min(song.duration, 60)}s</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#15002a]/80 border-t border-purple-900/50 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-purple-300 flex justify-between"><span>Pitch</span><span className="text-[#FFD700]">{pitch > 0 ? '+' : ''}{pitch}</span></label>
            <input type="range" min={-6} max={6} value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full accent-[#FFD700]" />
          </div>
          <div>
            <label className="text-purple-300 flex justify-between"><span>Tempo</span><span className="text-[#FFD700]">{tempo}%</span></label>
            <input type="range" min={70} max={130} value={tempo} onChange={(e) => setTempo(+e.target.value)} className="w-full accent-[#FFD700]" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setEcho(!echo)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${echo ? 'bg-[#FF3CAC] text-white border-[#FF3CAC]' : 'border-purple-700 text-purple-300'}`}>
            Echo {echo ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setReverb(!reverb)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${reverb ? 'bg-[#00D4FF] text-[#0A0015] border-[#00D4FF]' : 'border-purple-700 text-purple-300'}`}>
            Reverb {reverb ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setGuideVocals(!guideVocals)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${guideVocals ? 'bg-[#FFD700] text-[#0A0015] border-[#FFD700]' : 'border-purple-700 text-purple-300'}`}>
            <Volume2 className="w-3 h-3 inline mr-1" />Guide {guideVocals ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setRecording(!recording)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-700 text-white'}`}
          >
            {recording ? <Square className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            {recording ? 'REC' : 'Paused'}
          </button>
          <button onClick={finalize} className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#FF3CAC] text-[#0A0015]">
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerScreen;
