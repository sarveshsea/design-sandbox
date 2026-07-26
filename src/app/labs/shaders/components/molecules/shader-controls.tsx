import type { ShaderLabState } from "../../lib/shader-contract";
import { RangeField, SelectField } from "../atoms/control-fields";

interface ShaderControlsProps {
  state: ShaderLabState;
  reducedMotion: boolean;
  evidenceReady: boolean;
  onChange: (next: ShaderLabState) => void;
  onExport: () => void;
}

/** Atomic Design: molecule — related shader inputs and their immediate feedback. */
export function ShaderControls({
  state,
  reducedMotion,
  evidenceReady,
  onChange,
  onExport,
}: ShaderControlsProps) {
  const update = <Key extends keyof ShaderLabState>(
    key: Key,
    value: ShaderLabState[Key],
  ) => onChange({ ...state, [key]: value });

  return (
    <section
      aria-labelledby="controls-heading"
      className="space-y-5 rounded-lg border border-border bg-card p-5 text-card-foreground"
    >
      <div className="space-y-1 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          molecule / controls
        </p>
        <h2 id="controls-heading" className="text-lg font-semibold">
          Tune the field
        </h2>
      </div>

      <SelectField
        id="dither-method"
        label="Dither method"
        value={state.mode}
        onChange={(event) =>
          update("mode", event.target.value === "noise" ? "noise" : "ordered")
        }
      >
        <option value="ordered">Ordered Bayer 4×4</option>
        <option value="noise">Seeded noise</option>
      </SelectField>

      <div className="space-y-2">
        <label htmlFor="shader-seed" className="block text-sm font-medium">
          Deterministic seed
        </label>
        <input
          id="shader-seed"
          type="number"
          min={0}
          max={9999}
          inputMode="numeric"
          value={state.seed}
          onChange={(event) =>
            update("seed", Math.min(9999, Math.max(0, event.target.valueAsNumber || 0)))
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <RangeField
        id="ripple-strength"
        label="Ripple strength"
        min={0}
        max={1}
        step={0.01}
        value={state.ripple}
        output={`${Math.round(state.ripple * 100)}%`}
        onChange={(event) => update("ripple", event.target.valueAsNumber)}
      />

      <RangeField
        id="distortion-strength"
        label="Distortion"
        min={0}
        max={1}
        step={0.01}
        value={state.distortion}
        output={`${Math.round(state.distortion * 100)}%`}
        onChange={(event) => update("distortion", event.target.valueAsNumber)}
      />

      <label className="flex min-h-10 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={state.animate && !reducedMotion}
          disabled={reducedMotion}
          onChange={(event) => update("animate", event.target.checked)}
          className="size-4 accent-foreground"
        />
        Animate field
      </label>

      <p role="status" className="text-xs leading-5 text-muted-foreground">
        {reducedMotion || !state.animate
          ? "Static frame active"
          : "Continuous procedural motion. Reduced motion holds a static frame."}
      </p>

      <button
        type="button"
        disabled={!evidenceReady}
        onClick={onExport}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-wait disabled:opacity-50"
      >
        {evidenceReady ? "Export audit evidence" : "Sampling performance…"}
      </button>
    </section>
  );
}
