import type { ModelId } from "@/shared/types/stem-api";

export const MODELS: { id: ModelId; name: string; detail: string; sixStems: boolean }[] = [
  {
    id: "bs_roformer_sw",
    name: "Best quality",
    detail: "BS-RoFormer SW, separates guitar and keys too. Very slow on CPU, about 18× the song length.",
    sixStems: true,
  },
  {
    id: "htdemucs_ft",
    name: "Demucs fine-tuned",
    detail: "Vocals, drums and bass only. About 4× the song length.",
    sixStems: false,
  },
  {
    id: "htdemucs_6s",
    name: "Demucs 6 stems",
    detail: "Guitar and keys at lower quality. Roughly real time.",
    sixStems: true,
  },
  { id: "htdemucs", name: "Fast preview", detail: "Vocals, drums and bass. Roughly real time.", sixStems: false },
];

export const DEFAULT_MODEL: ModelId = "bs_roformer_sw";

export type InstrumentId = "vocals" | "drums" | "bass" | "keys" | "guitar";

export const INSTRUMENTS: { id: InstrumentId; sixStemsOnly: boolean }[] = [
  { id: "vocals", sixStemsOnly: false },
  { id: "drums", sixStemsOnly: false },
  { id: "bass", sixStemsOnly: false },
  { id: "keys", sixStemsOnly: true },
  { id: "guitar", sixStemsOnly: true },
];

export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".flac", ".ogg", ".m4a"];

export const STEM_LABELS: Record<string, string> = {
  vocals: "Vocals",
  drums: "Drums",
  bass: "Bass",
  keys: "Keyboards",
  guitar: "Guitar",
  lead_guitar: "Lead guitar",
  rhythm_guitar: "Rhythm guitar",
  other: "Other",
};

export const STEM_COLORS: Record<string, string> = {
  vocals: "var(--color-stem-vocals)",
  drums: "var(--color-stem-drums)",
  bass: "var(--color-stem-bass)",
  keys: "var(--color-stem-keys)",
  guitar: "var(--color-stem-guitar)",
  lead_guitar: "var(--color-stem-guitar)",
  rhythm_guitar: "var(--color-stem-rhythm)",
  other: "var(--color-stem-other)",
};

export const STEM_ORDER = ["vocals", "lead_guitar", "rhythm_guitar", "guitar", "keys", "bass", "drums", "other"];
