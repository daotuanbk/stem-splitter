import { useEffect, useState } from "react";
import type { JobEvent, SeparateOptions } from "@/shared/types/stem-api";
import { STEM_ORDER } from "../constants/models";
import { baseName, stemApi } from "../service";
import type { Job } from "../types";

function applyEvent(job: Job, event: JobEvent): Job {
  switch (event.type) {
    case "status":
      return { ...job, status: event.value };
    case "progress":
      return { ...job, status: "separating", progress: event.value };
    case "done":
      return { ...job, status: "done", progress: 1, stems: STEM_ORDER.filter((s) => event.stems.includes(s)) };
    case "error":
      return { ...job, status: "error", error: event.message };
  }
}

export function useSeparationJob() {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(
    () => stemApi.onJobEvent((event) => setJob((job) => (job?.id === event.jobId ? applyEvent(job, event) : job))),
    [],
  );

  const start = async (path: string, options: SeparateOptions) => {
    setJob({
      id: "",
      fileName: baseName(path),
      model: options.model,
      status: "starting",
      progress: 0,
      stems: [],
      startedAt: Date.now(),
    });
    try {
      const id = await stemApi.separate(path, options);
      setJob((job) => job && { ...job, id });
    } catch (err) {
      setJob((job) => job && { ...job, status: "error", error: String(err) });
    }
  };

  const cancel = async () => {
    if (job?.id && job.status !== "done" && job.status !== "error") await stemApi.cancel(job.id);
    setJob(null);
  };

  return { job, start, cancel, reset: () => setJob(null) };
}
