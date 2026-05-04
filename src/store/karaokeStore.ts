import { useCallback, useSyncExternalStore } from 'react';


export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  is_opm: boolean;
  popularity: number;
  cover_url?: string | null;
}

export interface QueueItem extends Song {
  queueId: string;
}

export interface KaraokeState {
  playerName: string;
  queue: QueueItem[];
  tvMode: boolean;
  duetMode: boolean;
  totalSongs: number;
  bestScore: number;
  superstarCount: number;
  recentSongs: Song[];
}

const STORAGE_KEY = 'musikaroki-store';

const defaultState: KaraokeState = {
  playerName: 'Kababayan',
  queue: [],
  tvMode: false,
  duetMode: false,
  totalSongs: 0,
  bestScore: 0,
  superstarCount: 0,
  recentSongs: [],
};

let state: KaraokeState = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
})();

const listeners = new Set<() => void>();

const notify = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
};

const setState = (partial: Partial<KaraokeState> | ((s: KaraokeState) => Partial<KaraokeState>)) => {
  const next = typeof partial === 'function' ? partial(state) : partial;
  state = { ...state, ...next };
  notify();
};

export const useKaraokeStore = () => {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);

  return {
    ...snapshot,
    setPlayerName: (name: string) => setState({ playerName: name }),
    addToQueue: (song: Song) =>
      setState((s) => ({
        queue: [...s.queue, { ...song, queueId: `${song.id}-${Date.now()}-${Math.random()}` }],
      })),
    removeFromQueue: (queueId: string) =>
      setState((s) => ({ queue: s.queue.filter((q) => q.queueId !== queueId) })),
    reorderQueue: (queue: QueueItem[]) => setState({ queue }),
    clearQueue: () => setState({ queue: [] }),
    setTvMode: (v: boolean) => setState({ tvMode: v }),
    setDuetMode: (v: boolean) => setState({ duetMode: v }),
    recordPerformance: (song: Song, finalScore: number) =>
      setState((s) => ({
        totalSongs: s.totalSongs + 1,
        bestScore: Math.max(s.bestScore, finalScore),
        superstarCount: finalScore >= 90 ? s.superstarCount + 1 : s.superstarCount,
        recentSongs: [song, ...s.recentSongs.filter((x) => x.id !== song.id)].slice(0, 10),
      })),
  };
};
