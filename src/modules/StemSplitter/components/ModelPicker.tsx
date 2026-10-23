import type { FC } from "react";
import type { ModelId } from "@/shared/types/stem-api";
import { cn } from "@/shared/lib/cn";
import { MODELS } from "../constants/models";

interface Props {
  value: ModelId;
  onChange: (model: ModelId) => void;
}

const ModelPicker: FC<Props> = ({ value, onChange }) => (
  <fieldset>
    <legend className="mb-3 text-sm font-medium text-muted">Separation model</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {MODELS.map((m) => (
        <label
          key={m.id}
          className={cn(
            "relative flex cursor-pointer flex-col gap-1 rounded-xl border bg-surface p-4 transition-colors duration-150",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary hover:border-primary/60",
            value === m.id ? "border-primary bg-primary/10" : "border-line",
          )}
        >
          <input
            type="radio"
            name="model"
            value={m.id}
            checked={value === m.id}
            onChange={() => onChange(m.id)}
            className="sr-only"
          />
          <span className="flex items-center justify-between font-semibold">
            {m.name}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-normal text-muted">{m.id}</code>
          </span>
          <span className="text-sm leading-relaxed text-muted">{m.detail}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

export default ModelPicker;
