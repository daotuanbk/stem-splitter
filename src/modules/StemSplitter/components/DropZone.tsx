import { useRef, useState, type DragEvent, type FC } from "react";
import { FileAudio, Upload } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { AUDIO_EXTENSIONS } from "../constants/models";
import { isAudioFile, stemApi } from "../service";

interface Props {
  fileName?: string;
  onFile: (path: string) => void;
}

const DropZone: FC<Props> = ({ fileName, onFile }) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    const path = stemApi.pathForFile(file);
    if (!isAudioFile(path)) return setError(`Unsupported file. Use ${AUDIO_EXTENSIONS.join(", ")}.`);
    setError(undefined);
    onFile(path);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={AUDIO_EXTENSIONS.join(",")}
        hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-describedby="dropzone-hint"
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6",
          "transition-colors duration-200",
          fileName ? "py-8" : "py-14",
          dragging ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-primary/70 hover:bg-surface-2",
          fileName && !dragging && "border-solid border-primary/60",
        )}
      >
        <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          {dragging || fileName ? <FileAudio className="size-7" aria-hidden /> : <Upload className="size-7" aria-hidden />}
        </span>
        <span className="max-w-full truncate text-lg font-semibold">
          {dragging ? "Drop the song" : (fileName ?? "Drop a song here or browse")}
        </span>
        <span id="dropzone-hint" className="text-sm text-muted">
          {fileName ? "Click or drop to choose another song" : AUDIO_EXTENSIONS.join(" · ")}
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default DropZone;
