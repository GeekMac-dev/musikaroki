import React from 'react';
import { useKaraokeStore } from '@/store/karaokeStore';
import { GripVertical, X, Mic2, ListMusic } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onStart: () => void;
}

const QueueScreen: React.FC<Props> = ({ onStart }) => {
  const { queue, removeFromQueue, reorderQueue, clearQueue } = useKaraokeStore();
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newQ = [...queue];
    const [moved] = newQ.splice(dragIdx, 1);
    newQ.splice(idx, 0, moved);
    reorderQueue(newQ);
    setDragIdx(null);
  };

  return (
    <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-5xl md:text-6xl text-glow-pink text-[#FF3CAC]">PILA NG KANTA</h1>
        <p className="text-purple-200 mt-2">{queue.length} song{queue.length !== 1 ? 's' : ''} in queue</p>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-20">
          <ListMusic className="w-20 h-20 mx-auto text-purple-700 mb-4" />
          <p className="text-purple-300 text-lg">Walang laman ang pila!</p>
          <p className="text-purple-400 text-sm mt-2">Add songs from the Library</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {queue.map((song, idx) => (
              <div
                key={song.queueId}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className={`flex items-center gap-3 bg-[#15002a]/80 border-2 ${
                  idx === 0 ? 'border-[#FFD700] neon-gold' : 'border-purple-900'
                } rounded-xl p-4 cursor-move hover:border-[#FF3CAC] transition-all`}
              >
                <GripVertical className="w-5 h-5 text-purple-400" />
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${idx === 0 ? 'bg-[#FFD700] text-[#0A0015]' : 'bg-purple-800 text-white'} flex items-center justify-center font-display text-lg`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-white truncate">{song.title}</h3>
                  <p className="text-sm text-purple-300 truncate">{song.artist}</p>
                </div>
                {idx === 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FFD700] text-[#0A0015]">NEXT</span>
                )}
                <button
                  onClick={() => { removeFromQueue(song.queueId); toast('Removed from queue'); }}
                  className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { clearQueue(); toast('Queue cleared'); }}
              className="px-6 py-3 bg-[#15002a] border-2 border-purple-700 text-purple-200 rounded-xl font-bold hover:border-red-500 hover:text-red-400 transition-all"
            >
              Clear All
            </button>
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD700] to-[#FF3CAC] text-[#0A0015] py-4 rounded-xl font-display text-2xl neon-gold hover:scale-[1.02] transition-all"
            >
              <Mic2 className="w-7 h-7" /> UMAWIT NA!
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QueueScreen;
