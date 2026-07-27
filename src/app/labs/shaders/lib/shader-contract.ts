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
export type RendererClassification = "hardware" | "software" | "unknown";
export type ColorSpaceSupport = "native" | "unsupported" | "rejected";

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
  frameCadenceMedianMs: number;
  frameCadenceP95Ms: number;
  frameCadenceSampleCount: number;
  gpuTimer?: "EXT_disjoint_timer_query_webgl2";
  medianGpuDrawPassMs?: number;
  gpuDrawPassSampleCount?: number;
}

export interface RenderingEvidenceInput {
  requestedColorSpace: OutputColorSpace;
  colorSpaceSupport: ColorSpaceSupport;
  alphaContext: boolean;
  alphaBits: number;
  sampledAlpha: number;
  drawingBufferColorSpace: OutputColorSpace | null;
  powerPreference: WebGLPowerPreference;
  renderer: string;
  vendor: string;
  rendererClassification: RendererClassification;
  rendererInfoSource: "unmasked" | "masked";
}

interface AuditEvidenceInput {
  state: ShaderLabState;
  reducedMotion: boolean;
  renderer: RendererKind;
  rendererStatus?: RendererEvidenceStatus;
  fallbackRendered?: boolean;
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

export function proceduralFieldLuminance(
  u: number,
  v: number,
  width: number,
  height: number,
  rippleStrength: number,
  distortionStrength: number,
  time = 0,
) {
  const centerX = u - 0.5;
  const centerY = v - 0.5;
  const aspect = width / Math.max(height, 1);
  const radius = Math.hypot(centerX * aspect, centerY);
  const ripple = Math.sin(radius * 42 - time * 2.4);
  const directionX = radius > 0.0001 ? centerX / radius : 0;
  const directionY = radius > 0.0001 ? centerY / radius : 0;
  let warpedX = u + directionX * ripple * 0.018 * rippleStrength;
  let warpedY = v + directionY * ripple * 0.018 * rippleStrength;
  warpedX +=
    Math.sin((warpedY + time * 0.08) * 18) * 0.025 * distortionStrength;
  warpedY +=
    Math.cos((warpedX - time * 0.06) * 14) * 0.018 * distortionStrength;

  const bands = 0.5 + 0.5 * Math.sin((warpedX * 1.25 + warpedY) * 11);
  const rings =
    0.5 + 0.5 * Math.cos(Math.hypot(warpedX - 0.5, warpedY - 0.5) * 31);
  const pulse =
    0.5 + 0.5 * Math.sin((warpedX - warpedY) * 9 + time * 0.35);
  const red = 0.09 + bands * 0.72;
  const green = 0.12 + rings * 0.68;
  const blue = 0.18 + pulse * 0.72;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
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
    typeof input.performance.medianGpuDrawPassMs === "number" &&
    Number.isFinite(input.performance.medianGpuDrawPassMs) &&
    typeof input.performance.gpuDrawPassSampleCount === "number" &&
    input.performance.gpuDrawPassSampleCount > 0 &&
    input.rendering?.rendererClassification === "hardware";
  const hasWideGamutOutput =
    input.rendering?.requestedColorSpace === "display-p3" &&
    input.rendering.colorSpaceSupport === "native" &&
    input.rendering.drawingBufferColorSpace === "display-p3";
  const hasLowPowerContext =
    input.rendering?.powerPreference === "low-power";
  const hasFrameCadence =
    typeof input.performance?.frameCadenceMedianMs === "number" &&
    Number.isFinite(input.performance.frameCadenceMedianMs) &&
    typeof input.performance.frameCadenceP95Ms === "number" &&
    Number.isFinite(input.performance.frameCadenceP95Ms) &&
    input.performance.frameCadenceSampleCount > 0;
  const staticFrame = !input.state.animate;
  const performance = input.performance
    ? {
        measurement: "webgl-render-loop",
        budgetMs: 16.7,
        mainThreadSubmission: {
          medianMs:
            Math.round(input.performance.medianSubmissionMs * 1000) / 1000,
          sampleCount: input.performance.sampleCount,
        },
        ...(hasFrameCadence
          ? {
              animationFrameCadence: {
                medianIntervalMs:
                  Math.round(input.performance.frameCadenceMedianMs * 1000) /
                  1000,
                p95IntervalMs:
                  Math.round(input.performance.frameCadenceP95Ms * 1000) / 1000,
                sampleCount: input.performance.frameCadenceSampleCount,
                passesBudget: input.performance.frameCadenceMedianMs <= 16.7,
              },
            }
          : {}),
        browser: input.performance.browser,
        hardwareConcurrency: input.performance.hardwareConcurrency,
        ...(hasHardwareGpuEvidence
          ? {
              gpuDrawPass: {
                timer: input.performance.gpuTimer,
                medianMs:
                  Math.round(input.performance.medianGpuDrawPassMs! * 1000) /
                  1000,
                passesBudget: input.performance.medianGpuDrawPassMs! <= 16.7,
                sampleCount: input.performance.gpuDrawPassSampleCount,
              },
            }
          : {}),
      }
    : {
        measurement: "unassessed-static-mode",
        budgetMs: 16.7,
        reason: "Static mode does not collect animation performance samples.",
      };

  const assessedDimensions = [
    "seeded-spatial-noise",
    ...(staticFrame ? ["static-frame-determinism"] : []),
    ...(input.reducedMotion ? ["reduced-motion-active"] : []),
    ...(input.renderer === "canvas-2d" || input.fallbackRendered
      ? ["canvas-2d-fallback"]
      : []),
    ...(input.renderer === "webgl2"
      ? ["webgl2-availability"]
      : ["renderer-fallback-resolution"]),
    ...(input.performance ? ["main-thread-webgl-submission"] : []),
    ...(hasFrameCadence ? ["animation-frame-cadence"] : []),
    ...(hasHardwareGpuEvidence ? ["gpu-draw-pass-duration"] : []),
    ...(input.rendering
      ? ["opaque-alpha-contract", "render-color-space", "renderer-classification"]
      : []),
    ...(hasWideGamutOutput ? ["wide-gamut-output-contract"] : []),
    ...(hasLowPowerContext ? ["low-power-context"] : []),
  ];
  const unassessedDimensions = [
    ...(!staticFrame ? ["static-frame-determinism"] : []),
    ...(!input.reducedMotion ? ["reduced-motion-active"] : []),
    ...(input.renderer !== "canvas-2d" && !input.fallbackRendered
      ? ["canvas-2d-fallback"]
      : []),
    ...(!input.performance ? ["main-thread-webgl-submission"] : []),
    ...(!hasFrameCadence ? ["animation-frame-cadence"] : []),
    ...(input.renderer !== "webgl2" ? ["webgl2-rendering"] : []),
    ...(input.renderer === "unavailable" ? ["rendered-output"] : []),
    ...(!hasHardwareGpuEvidence ? ["gpu-draw-pass-duration"] : []),
    ...(!input.rendering
      ? ["opaque-alpha-contract", "render-color-space", "renderer-classification"]
      : []),
    "power-consumption",
    "wide-gamut-color-accuracy",
  ];

  return {
    schemaVersion: "1.1.0",
    route: "/labs/shaders",
    deterministic: staticFrame,
    determinism: {
      seededSpatialNoise: true,
      staticFrame,
      reason: staticFrame
        ? "Static mode fixes shader time at zero for repeatable controls."
        : "Animation is time-dependent; only the seeded spatial noise is deterministic.",
    },
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
      implementation: "original-composition-with-attributed-algorithm-constants",
      externalShaderCodeCopied: false,
      externalAssetsCopied: false,
      references: [
        "docs/evidence/shader-lab-sources.md",
        "NOTICE",
      ],
    },
    performance,
    rendering: input.rendering ? { ...input.rendering } : null,
    assessedDimensions: [...new Set(assessedDimensions)],
    unassessedDimensions: [...new Set(unassessedDimensions)],
  };
}
