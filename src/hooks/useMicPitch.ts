import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Autocorrelation pitch detection (ACF / YIN-lite) on a time-domain buffer.
 * Returns frequency in Hz, or -1 if no clear pitch.
 */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  // RMS — bail on near-silence
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  // Trim leading/trailing low-amplitude samples
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }
  const trimmed = buf.slice(r1, r2);
  const T = trimmed.length;
  if (T < 32) return -1;

  // Autocorrelation
  const c = new Array(T).fill(0);
  for (let i = 0; i < T; i++) {
    for (let j = 0; j < T - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  // Find first dip then peak
  let d = 0;
  while (d < T - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < T; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  if (maxpos <= 0) return -1;

  let T0 = maxpos;
  // Parabolic interpolation for sub-sample accuracy
  const x1 = c[T0 - 1] || 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1500) return -1;
  return freq;
}

export const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);

export interface MicPitchHandle {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  isReady: boolean;
  error: string | null;
}

export interface PitchSample {
  hz: number;
  midi: number;
  level: number; // 0..100
  t: number; // ms since start
}

/**
 * Hook that captures microphone, runs realtime pitch detection,
 * exposes live frequency + audio level via callback, and records a Blob.
 */
export const useMicPitch = (
  onSample: (s: PitchSample) => void
): MicPitchHandle => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const onSampleRef = useRef(onSample);

  useEffect(() => { onSampleRef.current = onSample; }, [onSample]);

  const start = useCallback(async () => {
    try {
      setError(null);
      if (streamRef.current) return; // already running

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      analyserRef.current = analyser;
      source.connect(analyser);

      // MediaRecorder for capture
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(250);
      recorderRef.current = recorder;

      startTimeRef.current = performance.now();
      setIsReady(true);

      const buf = new Float32Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buf);
        analyserRef.current.getByteFrequencyData(freqBuf);

        // RMS-derived audio level (0..100)
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const level = Math.max(0, Math.min(100, rms * 600));

        const hz = autoCorrelate(buf, ctx.sampleRate);
        const midi = hz > 0 ? hzToMidi(hz) : -1;

        onSampleRef.current({
          hz,
          midi,
          level,
          t: performance.now() - startTimeRef.current,
        });

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setError(e?.message || 'Microphone access denied');
      setIsReady(false);
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    let blob: Blob | null = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      blob = await new Promise<Blob | null>((resolve) => {
        recorder.onstop = () => {
          if (chunksRef.current.length === 0) return resolve(null);
          const type = recorder.mimeType || 'audio/webm';
          resolve(new Blob(chunksRef.current, { type }));
        };
        try { recorder.stop(); } catch { resolve(null); }
      });
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { sourceRef.current?.disconnect(); } catch {}
    try { await audioCtxRef.current?.close(); } catch {}

    streamRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setIsReady(false);

    return blob;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, []);

  return { start, stop, isReady, error };
};
