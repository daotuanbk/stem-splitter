import { useState, type FC } from "react";
import { AudioWaveform, RotateCcw, Scissors } from "lucide-react";
import type { ModelId, StemId } from "@/shared/types/stem-api";
import DropZone from "./components/DropZone";
import InstrumentPicker from "./components/InstrumentPicker";
import JobProgress from "./components/JobProgress";
import Mixer from "./components/Mixer";
import ModelPicker from "./components/ModelPicker";
import { DEFAULT_MODEL, INSTRUMENTS, MODELS, type InstrumentId } from "./constants/models";
import { useSeparationJob } from "./hooks/useSeparationJob";
import { baseName } from "./service";

const StemSplitterPage: FC = () => {
  const [file, setFile] = useState<string>();
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [selected, setSelected] = useState(() => new Set<InstrumentId>(INSTRUMENTS.map((i) => i.id)));
  const [splitGuitar, setSplitGuitar] = useState(true);
  const { job, start, cancel, reset } = useSeparationJob();

  const sixStems = MODELS.find((m) => m.id === model)!.sixStems;
  const stems = INSTRUMENTS.filter(({ id, sixStemsOnly }) => selected.has(id) && (sixStems || !sixStemsOnly)).flatMap(
    ({ id }): StemId[] => (id === "guitar" && splitGuitar ? ["lead_guitar", "rhythm_guitar"] : [id]),
  );

  const toggle = (id: InstrumentId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary">
            <AudioWaveform className="size-5" aria-hidden />
          </span>
          <h1 className="text-lg font-bold tracking-tight">Stem Splitter</h1>
          <span className="ml-auto text-sm text-muted">Runs locally on your computer</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        {!job && (
          <>
            <DropZone fileName={file && baseName(file)} onFile={setFile} />
            <ModelPicker value={model} onChange={setModel} />
            <InstrumentPicker
              selected={selected}
              sixStems={sixStems}
              splitGuitar={splitGuitar}
              onToggle={toggle}
              onSplitGuitar={setSplitGuitar}
            />
            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-line pt-6">
              <p className="text-sm text-muted" aria-live="polite">
                {!file
                  ? "Choose a song first."
                  : stems.length === 0
                    ? "Pick at least one instrument."
                    : `${stems.length + 1} stems including Other.`}
              </p>
              <button
                type="button"
                disabled={!file || stems.length === 0}
                onClick={() => file && start(file, { model, stems })}
                className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 font-semibold text-on-accent transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <Scissors className="size-5" aria-hidden /> Separate
              </button>
            </div>
          </>
        )}

        {job && job.status !== "done" && job.status !== "error" && <JobProgress job={job} onCancel={cancel} />}

        {job?.status === "error" && (
          <section role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 p-6">
            <h2 className="font-semibold text-danger">Separation failed: {job.fileName}</h2>
            <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-sm text-muted">{job.error}</pre>
            <button
              type="button"
              onClick={reset}
              className="mt-4 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium transition-colors duration-150 hover:border-primary"
            >
              <RotateCcw className="size-4" aria-hidden /> Back
            </button>
          </section>
        )}

        {job?.status === "done" && <Mixer job={job} onNewSong={reset} />}
      </main>
    </div>
  );
};

export default StemSplitterPage;
