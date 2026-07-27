"use client";

import { useEffect, useRef, useState } from "react";

import type {
  OutputColorSpace,
  RenderingEvidenceInput,
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
  onGpuPerformance?: (
    timer: "EXT_disjoint_timer_query_webgl2",
    samples: number[],
  ) => void;
  onRenderingEvidence?: (evidence: RenderingEvidenceInput) => void;
  onStatusChange?: (status: RendererAvailability) => void;
}

interface DisjointTimerExtension {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}

interface DebugRendererExtension {
  UNMASKED_VENDOR_WEBGL: number;
  UNMASKED_RENDERER_WEBGL: number;
}

function rendererDetails(
  gl: WebGL2RenderingContext,
  requestedColorSpace: OutputColorSpace,
): RenderingEvidenceInput {
  const attributes = gl.getContextAttributes();
  const debug = gl.getExtension(
    "WEBGL_debug_renderer_info",
  ) as DebugRendererExtension | null;
  const vendor = debug
    ? String(gl.getParameter(debug.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));
  const renderer = debug
    ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  const pixel = new Uint8Array(4);
  gl.readPixels(
    Math.max(0, Math.floor(gl.drawingBufferWidth / 2)),
    Math.max(0, Math.floor(gl.drawingBufferHeight / 2)),
    1,
    1,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixel,
  );
  const colorSpace =
    "drawingBufferColorSpace" in gl
      ? String(gl.drawingBufferColorSpace)
      : "unreported";

  return {
    requestedColorSpace,
    alphaContext: attributes?.alpha ?? true,
    alphaBits: Number(gl.getParameter(gl.ALPHA_BITS)),
    sampledAlpha: pixel[3],
    drawingBufferColorSpace: colorSpace,
    powerPreference: attributes?.powerPreference ?? "default",
    renderer,
    vendor,
    softwareRenderer: /swiftshader|llvmpipe|software/i.test(
      `${vendor} ${renderer}`,
    ),
  };
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
  onGpuPerformance,
  onRenderingEvidence,
  onStatusChange,
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RendererAvailability>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!canvas || !gl) {
      queueMicrotask(() => {
        setStatus("unavailable");
        onStatusChange?.("unavailable");
      });
      return;
    }
    gl.drawingBufferColorSpace = state.colorSpace;

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
    const gpuSamples: number[] = [];
    const timer = gl.getExtension(
      "EXT_disjoint_timer_query_webgl2",
    ) as DisjointTimerExtension | null;
    const startedAt = performance.now();
    let frame = 0;
    let animationFrame = 0;
    let disposed = false;
    let pendingQuery: WebGLQuery | null = null;
    let renderingEvidenceReported = false;

    const draw = (now: number) => {
      if (disposed) return;
      if (pendingQuery && timer) {
        const available = gl.getQueryParameter(
          pendingQuery,
          gl.QUERY_RESULT_AVAILABLE,
        ) as boolean;
        const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT) as boolean;
        if (available) {
          if (!disjoint) {
            const elapsedNanoseconds = gl.getQueryParameter(
              pendingQuery,
              gl.QUERY_RESULT,
            ) as number;
            gpuSamples.push(elapsedNanoseconds / 1_000_000);
            if (gpuSamples.length > 120) gpuSamples.shift();
            onGpuPerformance?.(
              "EXT_disjoint_timer_query_webgl2",
              [...gpuSamples],
            );
          }
          gl.deleteQuery(pendingQuery);
          pendingQuery = null;
        }
      }
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
      const frameQuery = timer && !pendingQuery ? gl.createQuery() : null;
      if (frameQuery && timer) {
        gl.beginQuery(timer.TIME_ELAPSED_EXT, frameQuery);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (frameQuery && timer) {
        gl.endQuery(timer.TIME_ELAPSED_EXT);
        pendingQuery = frameQuery;
      }
      samples.push(performance.now() - submittedAt);
      if (samples.length > 120) samples.shift();
      frame += 1;

      if (frame === 1) {
        setStatus("ready");
        onStatusChange?.("ready");
      }
      if (!renderingEvidenceReported) {
        renderingEvidenceReported = true;
        onRenderingEvidence?.(rendererDetails(gl, state.colorSpace));
      }
      if (onPerformance && frame % 10 === 0) onPerformance([...samples]);
      if (!paused) animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      if (pendingQuery) gl.deleteQuery(pendingQuery);
      gl.deleteProgram(program);
    };
  }, [
    mode,
    onPerformance,
    onGpuPerformance,
    onRenderingEvidence,
    onStatusChange,
    paused,
    state.distortion,
    state.colorSpace,
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
