"use client";

import { useEffect, useRef, useState } from "react";

import {
  getBayerThreshold,
  proceduralFieldLuminance,
  seededNoise,
} from "../../lib/shader-contract";
import type {
  RendererAvailability,
  ShaderLabState,
} from "../../lib/shader-contract";

interface FallbackCanvasProps {
  state: ShaderLabState;
  onStatusChange?: (status: RendererAvailability) => void;
}

/** Atomic Design: organism — a static Canvas 2D fallback, not WebGL proof. */
export function FallbackCanvas({
  state,
  onStatusChange,
}: FallbackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RendererAvailability>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      queueMicrotask(() => {
        setStatus("unavailable");
        onStatusChange?.("unavailable");
      });
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(bounds.width * scale));
    canvas.height = Math.max(1, Math.floor(bounds.height * scale));
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue("--foreground").trim();
    const paper = styles.getPropertyValue("--background").trim();
    const cell = Math.max(4, Math.round(canvas.width / 72));

    context.fillStyle = paper;
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += cell) {
      for (let x = 0; x < canvas.width; x += cell) {
        const horizontal = (x + cell * 0.5) / canvas.width;
        const vertical = (y + cell * 0.5) / canvas.height;
        const field = proceduralFieldLuminance(
          horizontal,
          vertical,
          canvas.width,
          canvas.height,
          state.ripple,
          state.distortion,
        );
        const threshold =
          state.mode === "ordered"
            ? getBayerThreshold(x / cell, y / cell)
            : seededNoise(x / cell, y / cell, state.seed);
        if (field >= threshold) {
          context.fillStyle = ink;
          context.fillRect(x, y, cell, cell);
        }
      }
    }
    const statusFrame = requestAnimationFrame(() => {
      setStatus("ready");
      onStatusChange?.("ready");
    });
    return () => cancelAnimationFrame(statusFrame);
  }, [
    onStatusChange,
    state.distortion,
    state.mode,
    state.ripple,
    state.seed,
  ]);

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Static Canvas 2D fallback using the selected treatment"
        data-testid="fallback-renderer"
        data-status={status}
        className="size-full"
      />
    </div>
  );
}
