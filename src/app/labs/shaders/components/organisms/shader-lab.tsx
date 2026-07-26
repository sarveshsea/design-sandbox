"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAuditEvidence,
  DEFAULT_LAB_STATE,
  normalizeLabState,
} from "../../lib/shader-contract";
import type { ShaderLabState } from "../../lib/shader-contract";
import { ShaderControls } from "../molecules/shader-controls";
import { FallbackCanvas } from "./fallback-canvas";
import { ShaderCanvas } from "./shader-canvas";

const PERFORMANCE_SAMPLE_TARGET = 30;

function median(values: number[]) {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

/** Atomic Design: organism — controls, renderers, evidence, and fallback behavior. */
export function ShaderLab() {
  const [state, setState] = useState<ShaderLabState>(DEFAULT_LAB_STATE);
  const [samples, setSamples] = useState<number[]>([]);
  const reducedMotion = useReducedMotion();
  const paused = reducedMotion || !state.animate;
  const updatePerformance = useCallback((next: number[]) => setSamples(next), []);
  const medianSubmissionMs = useMemo(() => median(samples), [samples]);

  const handleStateChange = (next: ShaderLabState) => {
    setState(normalizeLabState(next));
  };

  const handleExport = () => {
    const effectiveState = {
      ...state,
      animate: state.animate && !reducedMotion,
    };
    const evidence = createAuditEvidence({
      state: effectiveState,
      reducedMotion,
      renderer: "webgl2",
      performance: {
        medianSubmissionMs,
        sampleCount: samples.length,
        browser: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
      },
    });
    const blob = new Blob([`${JSON.stringify(evidence, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `memi-shader-audit-seed-${state.seed}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const panels = [
    {
      eyebrow: "Unmodified",
      title: "Original field",
      body: "Procedural color before quantization.",
      renderer: (
        <ShaderCanvas
          label="Original procedural color field"
          mode="original"
          state={state}
          paused={paused}
          testId="original-renderer"
        />
      ),
    },
    {
      eyebrow: "WebGL2",
      title: state.mode === "ordered" ? "Ordered dither" : "Seeded noise",
      body: "The selected deterministic treatment.",
      renderer: (
        <ShaderCanvas
          label="Processed deterministic dither field"
          mode="processed"
          state={state}
          paused={paused}
          testId="processed-renderer"
          onPerformance={updatePerformance}
        />
      ),
    },
    {
      eyebrow: "No WebGL",
      title: "Static fallback",
      body: "Canvas 2D proof with no animation claim.",
      renderer: <FallbackCanvas state={state} />,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <ShaderControls
        state={state}
        reducedMotion={reducedMotion}
        evidenceReady={samples.length >= PERFORMANCE_SAMPLE_TARGET}
        onChange={handleStateChange}
        onExport={handleExport}
      />

      <section aria-labelledby="comparison-heading" className="min-w-0 space-y-4">
        <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              organism / comparison
            </p>
            <h2 id="comparison-heading" className="text-lg font-semibold">
              Same field, three contracts
            </h2>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            median submission {medianSubmissionMs.toFixed(3)}ms / 16.7ms
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {panels.map((panel) => (
            <article
              key={panel.title}
              className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 text-card-foreground"
            >
              {panel.renderer}
              <div className="px-1 pb-1">
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                  {panel.eyebrow}
                </p>
                <h3 className="mt-1 text-sm font-semibold">{panel.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {panel.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
