import type { FC } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { INSTRUMENTS, STEM_COLORS, STEM_LABELS, type InstrumentId } from "../constants/models";

interface Props {
  selected: Set<InstrumentId>;
  sixStems: boolean;
  splitGuitar: boolean;
  onToggle: (id: InstrumentId) => void;
  onSplitGuitar: (split: boolean) => void;
}

const InstrumentPicker: FC<Props> = ({ selected, sixStems, splitGuitar, onToggle, onSplitGuitar }) => (
  <fieldset>
    <legend className="mb-1 text-sm font-medium text-muted">Instruments to separate</legend>
    <p className="mb-3 text-sm text-muted">Everything you leave out is mixed into an “Other” stem.</p>
    <div className="flex flex-wrap gap-2">
      {INSTRUMENTS.map(({ id, sixStemsOnly }) => {
        const disabled = sixStemsOnly && !sixStems;
        const checked = selected.has(id) && !disabled;
        return (
          <label
            key={id}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
              disabled
                ? "cursor-not-allowed border-line text-muted/60"
                : checked
                  ? "cursor-pointer border-primary bg-primary/15"
                  : "cursor-pointer border-line hover:border-primary/60",
            )}
            title={disabled ? "Needs a 6-stem model" : undefined}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(id)}
            />
            <span
              className="grid size-4 place-items-center rounded-full"
              style={{ background: checked ? STEM_COLORS[id] : "var(--color-surface-2)" }}
              aria-hidden
            >
              {checked && <Check className="size-3 text-on-accent" strokeWidth={3} />}
            </span>
            {STEM_LABELS[id]}
          </label>
        );
      })}
    </div>
    {!sixStems && <p className="mt-2 text-sm text-muted">Keyboards and guitar need a 6-stem model.</p>}
    {sixStems && selected.has("guitar") && (
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
        <input
          type="checkbox"
          checked={splitGuitar}
          onChange={(e) => onSplitGuitar(e.target.checked)}
          className="mt-1 size-4 cursor-pointer accent-primary"
        />
        <span>
          <span className="font-medium">Split guitar into lead and rhythm</span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">
            Based on stereo position: centred guitar becomes lead, guitars panned left/right become rhythm. Works on
            typical band mixes, not on mono or centre-mixed recordings.
          </span>
        </span>
      </label>
    )}
  </fieldset>
);

export default InstrumentPicker;
