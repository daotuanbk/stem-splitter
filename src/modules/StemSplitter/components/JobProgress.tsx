import { useEffect, useState, type FC } from "react";
import { LoaderCircle, X } from "lucide-react";
import { MODELS } from "../constants/models";
import type { Job } from "../types";
import { formatTime } from "../utils/audio";

const STATUS_LABEL: Record<string, string> = {
  starting: "Starting Python…",
  "loading-model": "Loading model…",
  separating: "Separating stems…",
  saving: "Saving stems…",
};

interface Props {
  job: Job;
  onCancel: () => void;
}

const JobProgress: FC<Props> = ({ job, onCancel }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = (now - job.startedAt) / 1000;
  const percent = Math.round(job.progress * 100);
  const eta = job.progress > 0.03 ? elapsed / job.progress - elapsed : null;

  return (
    <section aria-labelledby="job-title" className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="job-title" className="truncate text-lg font-semibold">
            {job.fileName}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted" aria-live="polite">
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
            {STATUS_LABEL[job.status]} · {MODELS.find((m) => m.id === job.model)?.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium transition-colors duration-150 hover:border-danger hover:text-danger"
        >
          <X className="size-4" aria-hidden />
          Cancel
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="Separation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-6 h-2.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full origin-left rounded-full bg-linear-to-r from-primary to-accent transition-transform duration-500"
          style={{ transform: `scaleX(${job.progress})` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm tabular-nums text-muted">
        <span>{percent}%</span>
        <span>
          Elapsed {formatTime(elapsed)}
          {eta !== null && ` · about ${formatTime(eta)} left`}
        </span>
      </div>
    </section>
  );
};

export default JobProgress;
