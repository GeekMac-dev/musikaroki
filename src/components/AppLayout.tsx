import React, { useState } from 'react';
import { Song } from '@/store/karaokeStore';
import { useKaraokeStore } from '@/store/karaokeStore';
import StarBackground from '@/components/StarBackground';
import RainbowBar from '@/components/RainbowBar';
import BottomNav, { Tab } from '@/components/BottomNav';
import LibraryScreen from '@/screens/LibraryScreen';
import QueueScreen from '@/screens/QueueScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import PlayerScreen, { FinishPayload } from '@/screens/PlayerScreen';
import ScoreScreen from '@/screens/ScoreScreen';
import { Mic2 } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'main' | 'player' | 'score';

const AppLayout: React.FC = () => {
  const [tab, setTab] = useState<Tab>('library');
  const [mode, setMode] = useState<Mode>('main');
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [scores, setScores] = useState<{ pitch: number; timing: number; consistency: number; final: number } | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const { queue, removeFromQueue } = useKaraokeStore();

  const startSong = (song: Song) => {
    setActiveSong(song);
    setRecordingBlob(null);
    setScores(null);
    setMode('player');
  };

  const startQueue = () => {
    if (queue.length === 0) {
      toast.error('Add songs to queue first!');
      return;
    }
    startSong(queue[0]);
  };

  const handleFinish = (payload: FinishPayload) => {
    setScores({
      pitch: payload.pitch,
      timing: payload.timing,
      consistency: payload.consistency,
      final: payload.final,
    });
    setRecordingBlob(payload.recordingBlob);
    setMode('score');
  };

  const handleNextSong = () => {
    if (queue.length > 0 && activeSong && queue[0].id === activeSong.id) {
      removeFromQueue(queue[0].queueId);
    }
    if (queue.length > 1) {
      const next = queue[1];
      startSong(next);
    } else {
      setMode('main');
      setTab('library');
    }
  };

  const handleBackToLibrary = () => {
    if (queue.length > 0 && activeSong && queue[0].id === activeSong.id) {
      removeFromQueue(queue[0].queueId);
    }
    setMode('main');
    setTab('library');
  };

  if (mode === 'player' && activeSong) {
    return <PlayerScreen song={activeSong} onFinish={handleFinish} onExit={() => setMode('main')} />;
  }

  if (mode === 'score' && activeSong && scores) {
    return (
      <ScoreScreen
        song={activeSong}
        scores={scores}
        recordingBlob={recordingBlob}
        onNext={handleNextSong}
        onLibrary={handleBackToLibrary}
      />
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      <StarBackground />
      <RainbowBar />

      <header className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-purple-900/40 bg-[#0A0015]/60 backdrop-blur sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF3CAC] flex items-center justify-center neon-gold">
            <Mic2 className="w-5 h-5 text-[#0A0015]" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-glow-gold text-[#FFD700] leading-none">MUSIKAROKI</h1>
            <p className="text-[10px] text-purple-300 leading-none mt-0.5">Sing it your way, kababayan!</p>
          </div>
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-[#FF3CAC]/20 border border-[#FF3CAC] text-[#FF3CAC] font-bold">
          GUEST
        </div>
      </header>

      <main className="relative z-10">
        {tab === 'library' && <LibraryScreen onPlay={startSong} />}
        {tab === 'queue' && <QueueScreen onStart={startQueue} />}
        {tab === 'leaderboard' && <LeaderboardScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
};

export default AppLayout;
