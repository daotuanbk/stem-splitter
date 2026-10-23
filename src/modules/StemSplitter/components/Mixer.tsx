import { useEffect, type FC } from "react";
import { FolderOpen, LoaderCircle, Pause, Play, Plus, Save } from "lucide-react";
import { useStemPlayer } from "../hooks/useStemPlayer";
import { stemApi } from "../service";
import type { Job } from "../types";
import { formatTime } from "../utils/audio";
import StemRow from "./StemRow";

interface Props {
  job: Job;
  onNewSong: () => void;
}

const secondaryButton =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium transition-colors duration-150 hover:border-primary hover:bg-surface-2";

const Mixer: FC<Props> = ({ job, onNewSong }) => {
  const player = useStemPlayer(job.id, job.stems);
  const { tracks, duration, position } = player;
  const anySolo = tracks.some((t) => t.solo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code !== "Space" || target.closest("button, input")) return;
      e.preventDefault();
      player.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (player.error) {
    return (
      <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-danger">
        Could not load stems: {player.error}
      </p>
    );
  }

  if (player.loading) {
    return (
      <p className="flex items-center gap-2 text-muted" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Loading stems…
      </p>
    );
  }

  return (
    <section aria-labelledby="mixer-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mixer-title" className="min-w-0 truncate text-xl font-semibold">
          {job.fileName}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} onClick={() => stemApi.revealJob(job.id)}>
            <FolderOpen className="size-4" aria-hidden /> Open folder
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => stemApi.exportAll(job.id, job.stems, job.fileName)}
          >
            <Save className="size-4" aria-hidden /> Export all
          </button>
          <button type="button" className={secondaryButton} onClick={onNewSong}>
            <Plus className="size-4" aria-hidden /> New song
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3">
        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.playing ? "Pause" : "Play"}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-on-accent transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          {player.playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={position}
          onChange={(e) => player.seek(+e.target.value)}
          aria-label="Seek"
          aria-valuetext={formatTime(position)}
          className="flex-1"
        />
        <span className="w-24 text-right text-sm tabular-nums text-muted">
          {formatTime(position)} / {formatTime(duration)}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {tracks.map((t) => (
          <StemRow
            key={t.name}
            track={t}
            audible={!t.mute && (!anySolo || t.solo)}
            progress={duration ? position / duration : 0}
            onVolume={(v) => player.setVolume(t.name, v)}
            onMute={() => player.toggleMute(t)}
            onSolo={() => player.toggleSolo(t)}
            onExport={() => stemApi.exportStem(job.id, t.name, job.fileName)}
            onSeek={(f) => player.seek(f * duration)}
          />
        ))}
      </ul>
      <p className="text-sm text-muted">
        Space to play or pause. Click a waveform to jump. Stems are 24-bit WAV.
      </p>
    </section>
  );
};

export default Mixer;
