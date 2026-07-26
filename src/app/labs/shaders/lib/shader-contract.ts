export const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

export type DitherMode = "ordered" | "noise";

export interface ShaderLabState {
  mode: DitherMode;
  seed: number;
  ripple: number;
  distortion: number;
  animate: boolean;
}

export const DEFAULT_LAB_STATE: ShaderLabState = {
  mode: "ordered",
  seed: 2026,
  ripple: 0.35,
  distortion: 0.2,
  animate: true,
};

interface PerformanceEvidenceInput {
  medianSubmissionMs: number;
  sampleCount: number;
  browser: string;
  hardwareConcurrency: number;
}

interface AuditEvidenceInput {
  state: ShaderLabState;
  reducedMotion: boolean;
  renderer: "webgl2" | "canvas-2d";
  performance: PerformanceEvidenceInput;
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
    Math.imul(Math.trunc(x), 374_761_393) ^
    Math.imul(Math.trunc(y), 668_265_263) ^
    Math.imul(Math.trunc(seed), 69_069);
  value = Math.imul(value ^ (value >>> 13), 1_274_126_177);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
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

  return {
    mode,
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
  const medianMs = Math.round(input.performance.medianSubmissionMs * 1000) / 1000;

  return {
    schemaVersion: "1.0.0",
    route: "/labs/shaders",
    deterministic: true,
    renderer: input.renderer,
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
    performance: {
      measurement: "main-thread-webgl-submission",
      budgetMs: 16.7,
      medianMs,
      passesBudget: medianMs <= 16.7,
      sampleCount: input.performance.sampleCount,
      browser: input.performance.browser,
      hardwareConcurrency: input.performance.hardwareConcurrency,
    },
    assessedDimensions: [
      "webgl2-availability",
      "deterministic-output",
      "main-thread-webgl-submission",
      "reduced-motion",
      "canvas-2d-fallback",
    ],
    unassessedDimensions: [
      "gpu-frame-time",
      "power-consumption",
      "wide-gamut-color-accuracy",
    ],
  };
}
