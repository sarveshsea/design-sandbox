"use client";

import { useEffect, useRef, useState } from "react";

import type {
  RendererAvailability,
  ShaderLabState,
} from "../../lib/shader-contract";
import {
  DITHER_FRAGMENT_SHADER,
  FULLSCREEN_VERTEX_SHADER,
} from "../../lib/shader-source";

interface ShaderCanvasProps {
  label: string;
  mode: "original" | "processed";
  state: ShaderLabState;
  paused: boolean;
  testId: string;
  onPerformance?: (samples: number[]) => void;
  onStatusChange?: (status: RendererAvailability) => void;
}

function compileShader(
  gl: WebGL2RenderingContext,
  kind: number,
  source: string,
) {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error("WebGL2 could not allocate a shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL2 could not allocate a program.");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, DITHER_FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown shader link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

/** Atomic Design: organism — a complete WebGL2 rendering system. */
export function ShaderCanvas({
  label,
  mode,
  state,
  paused,
  testId,
  onPerformance,
  onStatusChange,
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RendererAvailability>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!canvas || !gl) {
      queueMicrotask(() => {
        setStatus("unavailable");
        onStatusChange?.("unavailable");
      });
      return;
    }

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.error("Shader lab renderer failed to initialize.", error);
      queueMicrotask(() => {
        setStatus("unavailable");
        onStatusChange?.("unavailable");
      });
      return;
    }

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const locations = {
      resolution: uniform("u_resolution"),
      time: uniform("u_time"),
      ripple: uniform("u_ripple"),
      distortion: uniform("u_distortion"),
      mode: uniform("u_mode"),
      seed: uniform("u_seed"),
    };
    const samples: number[] = [];
    const startedAt = performance.now();
    let frame = 0;
    let animationFrame = 0;
    let disposed = false;

    const draw = (now: number) => {
      if (disposed) return;
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(bounds.width * scale));
      const height = Math.max(1, Math.floor(bounds.height * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.uniform2f(locations.resolution, width, height);
      gl.uniform1f(locations.time, paused ? 0 : (now - startedAt) / 1000);
      gl.uniform1f(locations.ripple, state.ripple);
      gl.uniform1f(locations.distortion, state.distortion);
      gl.uniform1i(
        locations.mode,
        mode === "original" ? 0 : state.mode === "ordered" ? 1 : 2,
      );
      gl.uniform1ui(locations.seed, state.seed);

      const submittedAt = performance.now();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      samples.push(performance.now() - submittedAt);
      if (samples.length > 120) samples.shift();
      frame += 1;

      if (frame === 1) {
        setStatus("ready");
        onStatusChange?.("ready");
      }
      if (onPerformance && frame % 10 === 0) onPerformance([...samples]);
      if (!paused) animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      gl.deleteProgram(program);
    };
  }, [
    mode,
    onPerformance,
    onStatusChange,
    paused,
    state.distortion,
    state.mode,
    state.ripple,
    state.seed,
  ]);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        data-testid={testId}
        data-status={status}
        className="size-full"
      />
      {status === "unavailable" ? (
        <p className="absolute inset-0 grid place-items-center bg-muted p-6 text-center text-sm text-muted-foreground">
          WebGL2 is unavailable. Use the Canvas 2D reference.
        </p>
      ) : null}
    </div>
  );
}
