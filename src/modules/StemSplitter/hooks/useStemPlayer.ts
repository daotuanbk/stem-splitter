import { useEffect, useRef, useState } from "react";
import { stemApi } from "../service";
import type { Track } from "../types";
import { computePeaks } from "../utils/audio";

const PEAK_BUCKETS = 800;

export function useStemPlayer(jobId: string, stems: string[]) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodes = useRef(new Map<string, { buffer: AudioBuffer; gain: GainNode }>());
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const clock = useRef({ startedAt: 0, offset: 0, playing: false });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>();

  const now = () => {
    const { startedAt, offset, playing } = clock.current;
    return playing && ctxRef.current ? Math.max(0, ctxRef.current.currentTime - startedAt) : offset;
  };

  const stopSources = () => {
    sources.current.forEach((s) => s.stop());
    sources.current = [];
  };

  useEffect(() => {
    const ctx = new AudioContext();
    let cancelled = false;
    ctxRef.current = ctx;
    Promise.all(
      stems.map(async (name) => {
        const buffer = await ctx.decodeAudioData(await stemApi.readStem(jobId, name));
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        return { name, buffer, gain };
      }),
    )
      .then((loaded) => {
        if (cancelled) return;
        nodes.current = new Map(loaded.map(({ name, buffer, gain }) => [name, { buffer, gain }]));
        setTracks(
          loaded.map(({ name, buffer }) => ({
            name,
            volume: 1,
            mute: false,
            solo: false,
            peaks: computePeaks(buffer, PEAK_BUCKETS),
          })),
        );
        setDuration(Math.max(...loaded.map(({ buffer }) => buffer.duration)));
      })
      .catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
      stopSources();
      clock.current = { startedAt: 0, offset: 0, playing: false };
      nodes.current = new Map();
      void ctx.close();
    };
  }, [jobId, stems]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const anySolo = tracks.some((t) => t.solo);
    for (const t of tracks) {
      const target = t.mute || (anySolo && !t.solo) ? 0 : t.volume;
      // A short ramp instead of a hard jump avoids clicks when muting mid-playback.
      nodes.current.get(t.name)?.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.01);
    }
  }, [tracks]);

  const play = (from: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // AudioBufferSourceNodes are single-use, so every play/seek starts a fresh set on one shared clock to keep stems sample-aligned.
    const at = ctx.currentTime + 0.05;
    sources.current = [...nodes.current.values()].map(({ buffer, gain }) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(at, from);
      return src;
    });
    clock.current = { startedAt: at - from, offset: from, playing: true };
    setPlaying(true);
    void ctx.resume();
  };

  const pause = () => {
    if (!clock.current.playing) return;
    clock.current = { ...clock.current, offset: now(), playing: false };
    stopSources();
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const t = now();
      if (t >= duration) {
        stopSources();
        clock.current = { startedAt: 0, offset: 0, playing: false };
        setPlaying(false);
        setPosition(0);
        return;
      }
      setPosition(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  const seek = (t: number) => {
    const wasPlaying = clock.current.playing;
    stopSources();
    clock.current = { startedAt: 0, offset: t, playing: false };
    setPosition(t);
    if (wasPlaying) play(t);
  };

  const update = (name: string, patch: Partial<Track>) =>
    setTracks((tracks) => tracks.map((t) => (t.name === name ? { ...t, ...patch } : t)));

  return {
    tracks,
    loading: tracks.length === 0 && !error,
    error,
    playing,
    position,
    duration,
    toggle: () => (clock.current.playing ? pause() : play(clock.current.offset)),
    seek,
    setVolume: (name: string, volume: number) => update(name, { volume }),
    toggleMute: (t: Track) => update(t.name, { mute: !t.mute }),
    toggleSolo: (t: Track) => update(t.name, { solo: !t.solo }),
  };
}
