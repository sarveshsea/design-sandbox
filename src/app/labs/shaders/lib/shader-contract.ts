export const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

/**
 * Original 32-bit integer hash shared by the TypeScript fallback and GLSL.
 * Every operation wraps to uint32 before normalization to [0, 1).
 */
export const SEEDED_NOISE_HASH = {
  xMultiplier: 374_761_393,
  yMultiplier: 668_265_263,
  seedMultiplier: 69_069,
  firstShift: 16,
  firstMixMultiplier: 2_246_822_519,
  secondShift: 13,
  secondMixMultiplier: 3_266_489_917,
  finalShift: 16,
  divisor: 4_294_967_296,
} as const;

export type DitherMode = "ordered" | "noise";
export type OutputColorSpace = "srgb" | "display-p3";

export interface ShaderLabState {
  mode: DitherMode;
  colorSpace: OutputColorSpace;
  seed: number;
  ripple: number;
  distortion: number;
  animate: boolean;
}

export type RendererKind = "webgl2" | "canvas-2d" | "unavailable";
export type RendererAvailability = "loading" | "ready" | "unavailable";
export type RendererEvidenceStatus = "ready" | "fallback" | "unavailable";

export const DEFAULT_LAB_STATE: ShaderLabState = {
  mode: "ordered",
  colorSpace: "srgb",
  seed: 2026,
  ripple: 0.35,
  distortion: 0.2,
  animate: true,
};

export interface PerformanceEvidenceInput {
  medianSubmissionMs: number;
  sampleCount: number;
  browser: string;
  hardwareConcurrency: number;
  gpuTimer?: "EXT_disjoint_timer_query_webgl2";
  medianGpuFrameMs?: number;
  gpuSampleCount?: number;
}

export interface RenderingEvidenceInput {
  requestedColorSpace: OutputColorSpace;
  alphaContext: boolean;
  alphaBits: number;
  sampledAlpha: number;
  drawingBufferColorSpace: string;
  powerPreference: WebGLPowerPreference;
  renderer: string;
  vendor: string;
  softwareRenderer: boolean;
}

interface AuditEvidenceInput {
  state: ShaderLabState;
  reducedMotion: boolean;
  renderer: RendererKind;
  rendererStatus?: RendererEvidenceStatus;
  performance: PerformanceEvidenceInput | null;
  rendering: RenderingEvidenceInput | null;
}

function wrapCoordinate(value: number) {
  return ((Math.trunc(value) % 4) + 4) % 4;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getBayerThreshold(x: number, y: number) {
  const index = wrapCoordinate(y) * 4 + wrapCoordinate(x);
  return BAYER_4X4[index] / 16;
}

export function seededNoise(x: number, y: number, seed: number) {
  let value =
    (Math.imul(Math.trunc(x), SEEDED_NOISE_HASH.xMultiplier) ^
      Math.imul(Math.trunc(y), SEEDED_NOISE_HASH.yMultiplier) ^
      Math.imul(Math.trunc(seed), SEEDED_NOISE_HASH.seedMultiplier)) >>>
    0;
  value ^= value >>> SEEDED_NOISE_HASH.firstShift;
  value =
    Math.imul(value, SEEDED_NOISE_HASH.firstMixMultiplier) >>> 0;
  value ^= value >>> SEEDED_NOISE_HASH.secondShift;
  value =
    Math.imul(value, SEEDED_NOISE_HASH.secondMixMultiplier) >>> 0;
  value ^= value >>> SEEDED_NOISE_HASH.finalShift;
  return (value >>> 0) / SEEDED_NOISE_HASH.divisor;
}

export function normalizeLabState(
  candidate: unknown,
): ShaderLabState {
  const values =
    typeof candidate === "object" && candidate !== null
      ? (candidate as Record<string, unknown>)
      : {};
  const mode =
    values.mode === "ordered" || values.mode === "noise"
      ? values.mode
      : DEFAULT_LAB_STATE.mode;
  const colorSpace =
    values.colorSpace === "display-p3" || values.colorSpace === "srgb"
      ? values.colorSpace
      : DEFAULT_LAB_STATE.colorSpace;

  return {
    mode,
    colorSpace,
    seed: Math.round(
      clamp(finiteNumber(values.seed, DEFAULT_LAB_STATE.seed), 0, 9999),
    ),
    ripple: clamp(
      finiteNumber(values.ripple, DEFAULT_LAB_STATE.ripple),
      0,
      1,
    ),
    distortion: clamp(
      finiteNumber(values.distortion, DEFAULT_LAB_STATE.distortion),
      0,
      1,
    ),
    animate:
      typeof values.animate === "boolean"
        ? values.animate
        : DEFAULT_LAB_STATE.animate,
  };
}

export function createAuditEvidence(input: AuditEvidenceInput) {
  const rendererStatus =
    input.rendererStatus ??
    (input.renderer === "webgl2"
      ? "ready"
      : input.renderer === "canvas-2d"
        ? "fallback"
        : "unavailable");
  const hasHardwareGpuEvidence =
    input.performance?.gpuTimer === "EXT_disjoint_timer_query_webgl2" &&
    typeof input.performance.medianGpuFrameMs === "number" &&
    Number.isFinite(input.performance.medianGpuFrameMs) &&
    typeof input.performance.gpuSampleCount === "number" &&
    input.performance.gpuSampleCount > 0 &&
    input.rendering?.softwareRenderer === false;
  const hasWideGamutOutput =
    input.rendering?.requestedColorSpace === "display-p3" &&
    input.rendering.drawingBufferColorSpace === "display-p3";
  const hasLowPowerContext =
    input.rendering?.powerPreference === "low-power";
  const performance = input.performance
    ? {
        measurement: "main-thread-webgl-submission",
        budgetMs: 16.7,
        medianMs:
          Math.round(input.performance.medianSubmissionMs * 1000) / 1000,
        passesBudget: input.performance.medianSubmissionMs <= 16.7,
        sampleCount: input.performance.sampleCount,
        browser: input.performance.browser,
        hardwareConcurrency: input.performance.hardwareConcurrency,
        ...(hasHardwareGpuEvidence
          ? {
              gpuTimer: input.performance.gpuTimer,
              medianGpuFrameMs:
                Math.round(input.performance.medianGpuFrameMs! * 1000) / 1000,
              gpuPassesBudget: input.performance.medianGpuFrameMs! <= 16.7,
              gpuSampleCount: input.performance.gpuSampleCount,
            }
          : {}),
      }
    : {
        measurement: "unassessed-static-mode",
        budgetMs: 16.7,
        medianMs: null,
        passesBudget: null,
        sampleCount: 0,
        reason: "Static mode does not collect animation performance samples.",
      };

  return {
    schemaVersion: "1.0.0",
    route: "/labs/shaders",
    deterministic: true,
    renderer: input.renderer,
    rendererStatus,
    reducedMotion: input.reducedMotion,
    controls: { ...input.state },
    algorithms: [
      "bayer-4x4",
      "seeded-noise",
      "ripple-distortion",
    ] as const,
    sourcePolicy: {
      implementation: "original-procedural-code",
      externalShaderCodeCopied: false,
      externalAssetsCopied: false,
    },
    performance,
    rendering: input.rendering ? { ...input.rendering } : null,
    assessedDimensions: [
      "deterministic-output",
      "reduced-motion",
      "canvas-2d-fallback",
      ...(input.renderer === "webgl2"
        ? ["webgl2-availability"]
        : ["renderer-fallback-resolution"]),
      ...(input.performance ? ["main-thread-webgl-submission"] : []),
      ...(hasHardwareGpuEvidence ? ["gpu-frame-time"] : []),
      ...(input.rendering ? ["opaque-alpha-contract", "render-color-space"] : []),
      ...(hasWideGamutOutput ? ["wide-gamut-output-contract"] : []),
      ...(hasLowPowerContext ? ["low-power-context"] : []),
    ],
    unassessedDimensions: [
      ...(!input.performance ? ["main-thread-webgl-submission"] : []),
      ...(input.renderer !== "webgl2" ? ["webgl2-rendering"] : []),
      ...(input.renderer === "unavailable" ? ["rendered-output"] : []),
      ...(!hasHardwareGpuEvidence ? ["gpu-frame-time"] : []),
      ...(!input.rendering ? ["opaque-alpha-contract", "render-color-space"] : []),
      "power-consumption",
      "wide-gamut-color-accuracy",
    ],
  };
}
