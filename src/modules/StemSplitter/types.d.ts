import type { JobStatus, ModelId } from "@/shared/types/stem-api";

export interface Job {
  id: string;
  fileName: string;
  model: ModelId;
  status: JobStatus | "done" | "error";
  progress: number;
  stems: string[];
  error?: string;
  startedAt: number;
}

export interface Track {
  name: string;
  volume: number;
  mute: boolean;
  solo: boolean;
  peaks: Float32Array;
}
