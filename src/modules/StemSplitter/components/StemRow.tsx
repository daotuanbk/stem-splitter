import type { FC } from "react";
import { Download, Headphones, VolumeX } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { STEM_COLORS, STEM_LABELS } from "../constants/models";
import type { Track } from "../types";
import Waveform from "./Waveform";

interface Props {
  track: Track;
  audible: boolean;
  progress: number;
  onVolume: (volume: number) => void;
  onMute: () => void;
  onSolo: () => void;
  onExport: () => void;
  onSeek: (fraction: number) => void;
}

const toggleClass = (on: boolean, onClass: string) =>
  cn(
    "grid size-11 cursor-pointer place-items-center rounded-lg border text-sm font-bold transition-colors duration-150",
    on ? onClass : "border-line text-muted hover:border-fg/40 hover:text-fg",
  );

const StemRow: FC<Props> = ({ track, audible, progress, onVolume, onMute, onSolo, onExport, onSeek }) => {
  const color = STEM_COLORS[track.name] ?? "var(--color-fg)";
  const label = STEM_LABELS[track.name] ?? track.name;
  return (
    <li className="grid grid-cols-[8.5rem_auto_auto_1fr_auto] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 truncate font-semibold">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
          {label}
        </span>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={track.volume}
          onChange={(e) => onVolume(+e.target.value)}
          aria-label={`${label} volume`}
          aria-valuetext={`${Math.round(track.volume * 100)}%`}
          className="w-full"
        />
      </div>
      <button
        type="button"
        onClick={onMute}
        aria-pressed={track.mute}
        aria-label={`Mute ${label}`}
        title="Mute"
        className={toggleClass(track.mute, "border-danger bg-danger/15 text-danger")}
      >
        <VolumeX className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSolo}
        aria-pressed={track.solo}
        aria-label={`Solo ${label}`}
        title="Solo"
        className={toggleClass(track.solo, "border-stem-drums bg-stem-drums/15 text-stem-drums")}
      >
        <Headphones className="size-4" aria-hidden />
      </button>
      <Waveform peaks={track.peaks} color={color} progress={progress} dimmed={!audible} onSeek={onSeek} />
      <button
        type="button"
        onClick={onExport}
        aria-label={`Export ${label} as WAV`}
        title="Export WAV"
        className="grid size-11 cursor-pointer place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
      >
        <Download className="size-5" aria-hidden />
      </button>
    </li>
  );
};

export default StemRow;
