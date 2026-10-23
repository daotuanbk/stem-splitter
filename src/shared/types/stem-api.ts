export type ModelId = "bs_roformer_sw" | "htdemucs_ft" | "htdemucs_6s" | "htdemucs";

export type StemId = "vocals" | "drums" | "bass" | "keys" | "guitar" | "lead_guitar" | "rhythm_guitar";

export interface SeparateOptions {
  model: ModelId;
  stems: StemId[];
}

export type JobStatus = "starting" | "loading-model" | "separating" | "saving";

export type JobEvent =
  | { jobId: string; type: "status"; value: JobStatus }
  | { jobId: string; type: "progress"; value: number }
  | { jobId: string; type: "done"; stems: string[] }
  | { jobId: string; type: "error"; message: string };

export interface StemApi {
  pathForFile: (file: File) => string;
  separate: (input: string, options: SeparateOptions) => Promise<string>;
  cancel: (jobId: string) => Promise<void>;
  readStem: (jobId: string, stem: string) => Promise<ArrayBuffer>;
  exportStem: (jobId: string, stem: string, songName: string) => Promise<boolean>;
  exportAll: (jobId: string, stems: string[], songName: string) => Promise<boolean>;
  revealJob: (jobId: string) => Promise<void>;
  onJobEvent: (listener: (event: JobEvent) => void) => () => void;
}
