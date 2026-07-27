import { describe, expect, it } from "vitest";

import {
  BAYER_4X4,
  DEFAULT_LAB_STATE,
  createAuditEvidence,
  getBayerThreshold,
  normalizeLabState,
  seededNoise,
  proceduralFieldLuminance,
} from "./shader-contract";

describe("shader lab contract", () => {
  it("exposes every normalized threshold in the 4x4 Bayer matrix", () => {
    const thresholds = BAYER_4X4.map((_, index) =>
      getBayerThreshold(index % 4, Math.floor(index / 4)),
    );

    expect(new Set(thresholds)).toHaveLength(16);
    expect(Math.min(...thresholds)).toBe(0);
    expect(Math.max(...thresholds)).toBe(15 / 16);
  });

  it("generates deterministic seeded noise in the normalized range", () => {
    const first = seededNoise(12, 34, 2026);
    const repeat = seededNoise(12, 34, 2026);
    const changedSeed = seededNoise(12, 34, 2027);

    expect(first).toBe(repeat);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
    expect(changedSeed).not.toBe(first);
  });

  it.each([
    { x: 12, y: 34, seed: 2026, uint: 3_467_517_367 },
    { x: 0, y: 0, seed: 0, uint: 0 },
    { x: 1, y: 1, seed: 1, uint: 397_079_400 },
    { x: 4095, y: 2047, seed: 9999, uint: 3_633_305_628 },
  ])(
    "matches the shared GLSL uint hash for ($x, $y, $seed)",
    ({ x, y, seed, uint }) => {
      expect(seededNoise(x, y, seed)).toBe(uint / 4_294_967_296);
    },
  );

  it("normalizes external control values at the shader boundary", () => {
    expect(
      normalizeLabState({
        mode: "unsupported",
        colorSpace: "unsupported",
        seed: -2,
        ripple: 3,
        distortion: Number.NaN,
        animate: "yes",
      }),
    ).toEqual({
      ...DEFAULT_LAB_STATE,
      seed: 0,
      ripple: 1,
    });
  });

  it("preserves valid alternate controls and rejects primitive payloads", () => {
    expect(
      normalizeLabState({
        mode: "noise",
        colorSpace: "display-p3",
        seed: 44.6,
        ripple: -3,
        distortion: 0.7,
        animate: false,
      }),
    ).toEqual({
      mode: "noise",
      colorSpace: "display-p3",
      seed: 45,
      ripple: 0,
      distortion: 0.7,
      animate: false,
    });
    expect(normalizeLabState(null)).toEqual(DEFAULT_LAB_STATE);
  });

  it("wraps Bayer coordinates without changing the matrix period", () => {
    expect(getBayerThreshold(-1, -1)).toBe(getBayerThreshold(3, 3));
    expect(getBayerThreshold(5, 6)).toBe(getBayerThreshold(1, 2));
  });

  it("keeps the Canvas fallback field sensitive to ripple and distortion", () => {
    const baseline = proceduralFieldLuminance(0.31, 0.67, 640, 480, 0, 0);
    const changed = proceduralFieldLuminance(0.31, 0.67, 640, 480, 1, 1);

    expect(changed).not.toBe(baseline);
  });

  it("exports stable, explicit evidence without inferring unsupported proof", () => {
    const evidence = createAuditEvidence({
      state: DEFAULT_LAB_STATE,
      reducedMotion: true,
      renderer: "webgl2",
      performance: {
        medianSubmissionMs: 1.25,
        sampleCount: 120,
        browser: "Chromium test",
        hardwareConcurrency: 8,
        frameCadenceMedianMs: 16.6,
        frameCadenceP95Ms: 16.9,
        frameCadenceSampleCount: 90,
        gpuTimer: "EXT_disjoint_timer_query_webgl2",
        medianGpuDrawPassMs: 2.4,
        gpuDrawPassSampleCount: 30,
      },
      rendering: {
        requestedColorSpace: "display-p3",
        colorSpaceSupport: "native",
        alphaContext: false,
        alphaBits: 0,
        sampledAlpha: 255,
        drawingBufferColorSpace: "display-p3",
        powerPreference: "low-power",
        renderer: "ANGLE Metal Renderer: Apple M3 Pro",
        vendor: "Google Inc. (Apple)",
        rendererClassification: "hardware",
        rendererInfoSource: "unmasked",
      },
    });

    expect(evidence).toMatchObject({
      schemaVersion: "1.1.0",
      route: "/labs/shaders",
      deterministic: false,
      determinism: {
        seededSpatialNoise: true,
        staticFrame: false,
        reason: "Animation is time-dependent; only the seeded spatial noise is deterministic.",
      },
      reducedMotion: true,
      renderer: "webgl2",
      algorithms: ["bayer-4x4", "seeded-noise", "ripple-distortion"],
      performance: {
        measurement: "webgl-render-loop",
        budgetMs: 16.7,
        mainThreadSubmission: {
          medianMs: 1.25,
          sampleCount: 120,
        },
        animationFrameCadence: {
          medianIntervalMs: 16.6,
          p95IntervalMs: 16.9,
          sampleCount: 90,
          passesBudget: true,
        },
        gpuDrawPass: {
          timer: "EXT_disjoint_timer_query_webgl2",
          medianMs: 2.4,
          sampleCount: 30,
          passesBudget: true,
        },
      },
      rendering: {
        requestedColorSpace: "display-p3",
        colorSpaceSupport: "native",
        alphaContext: false,
        alphaBits: 0,
        sampledAlpha: 255,
        drawingBufferColorSpace: "display-p3",
        powerPreference: "low-power",
        rendererClassification: "hardware",
        rendererInfoSource: "unmasked",
      },
    });
    expect(evidence.assessedDimensions).toContain("gpu-draw-pass-duration");
    expect(evidence.assessedDimensions).toContain("animation-frame-cadence");
    expect(evidence.assessedDimensions).toContain("opaque-alpha-contract");
    expect(evidence.assessedDimensions).toContain(
      "wide-gamut-output-contract",
    );
    expect(evidence.assessedDimensions).toContain("low-power-context");
    expect(evidence.assessedDimensions).not.toContain("gpu-frame-time");
    expect(evidence.unassessedDimensions).toContain("static-frame-determinism");
  });

  it("exports static evidence without inventing a timing measurement", () => {
    const evidence = createAuditEvidence({
      state: { ...DEFAULT_LAB_STATE, animate: false },
      reducedMotion: true,
      renderer: "webgl2",
      performance: null as never,
      rendering: null,
    });

    expect(evidence.performance).toEqual({
      measurement: "unassessed-static-mode",
      budgetMs: 16.7,
      reason: "Static mode does not collect animation performance samples.",
    });
    expect(evidence.deterministic).toBe(true);
    expect(evidence.determinism).toMatchObject({
      seededSpatialNoise: true,
      staticFrame: true,
    });
    expect(evidence.assessedDimensions).toContain("static-frame-determinism");
    expect(evidence.unassessedDimensions).toContain(
      "main-thread-webgl-submission",
    );
  });

  it("does not count software-renderer timing as hardware GPU proof", () => {
    const evidence = createAuditEvidence({
      state: DEFAULT_LAB_STATE,
      reducedMotion: false,
      renderer: "webgl2",
      performance: {
        medianSubmissionMs: 0.2,
        sampleCount: 60,
        browser: "Headless Chromium",
        hardwareConcurrency: 4,
        frameCadenceMedianMs: 16.6,
        frameCadenceP95Ms: 17,
        frameCadenceSampleCount: 45,
        gpuTimer: "EXT_disjoint_timer_query_webgl2",
        medianGpuDrawPassMs: 0.4,
        gpuDrawPassSampleCount: 30,
      },
      rendering: {
        requestedColorSpace: "srgb",
        colorSpaceSupport: "native",
        alphaContext: false,
        alphaBits: 0,
        sampledAlpha: 255,
        drawingBufferColorSpace: "srgb",
        powerPreference: "low-power",
        renderer: "ANGLE Vulkan SwiftShader",
        vendor: "Google Inc.",
        rendererClassification: "software",
        rendererInfoSource: "unmasked",
      },
    });

    expect(evidence.performance).not.toHaveProperty("gpuDrawPass");
    expect(evidence.assessedDimensions).not.toContain("gpu-draw-pass-duration");
    expect(evidence.unassessedDimensions).toContain("gpu-draw-pass-duration");
  });

  it("does not treat an unknown renderer as hardware proof", () => {
    const evidence = createAuditEvidence({
      state: DEFAULT_LAB_STATE,
      reducedMotion: false,
      renderer: "webgl2",
      performance: {
        medianSubmissionMs: 0.2,
        sampleCount: 60,
        browser: "Masked WebKit",
        hardwareConcurrency: 4,
        frameCadenceMedianMs: 16.6,
        frameCadenceP95Ms: 16.8,
        frameCadenceSampleCount: 45,
        gpuTimer: "EXT_disjoint_timer_query_webgl2",
        medianGpuDrawPassMs: 0.4,
        gpuDrawPassSampleCount: 30,
      },
      rendering: {
        requestedColorSpace: "srgb",
        colorSpaceSupport: "native",
        alphaContext: false,
        alphaBits: 0,
        sampledAlpha: 255,
        drawingBufferColorSpace: "srgb",
        powerPreference: "low-power",
        renderer: "WebKit WebGL",
        vendor: "WebKit",
        rendererClassification: "unknown",
        rendererInfoSource: "masked",
      },
    });

    expect(evidence.performance).not.toHaveProperty("gpuDrawPass");
    expect(evidence.unassessedDimensions).toContain("gpu-draw-pass-duration");
  });

  it("keeps the wide-gamut output contract unassessed when the platform rejects it", () => {
    const evidence = createAuditEvidence({
      state: { ...DEFAULT_LAB_STATE, colorSpace: "display-p3" },
      reducedMotion: false,
      renderer: "webgl2",
      performance: null,
      rendering: {
        requestedColorSpace: "display-p3",
        colorSpaceSupport: "unsupported",
        alphaContext: false,
        alphaBits: 0,
        sampledAlpha: 255,
        drawingBufferColorSpace: null,
        powerPreference: "low-power",
        renderer: "WebKit WebGL",
        vendor: "WebKit",
        rendererClassification: "unknown",
        rendererInfoSource: "masked",
      },
    });

    expect(evidence.assessedDimensions).not.toContain(
      "wide-gamut-output-contract",
    );
    expect(evidence.unassessedDimensions).toContain(
      "wide-gamut-output-contract",
    );
  });

  it("reports the Canvas 2D fallback instead of an unavailable WebGL renderer", () => {
    const evidence = createAuditEvidence({
      state: { ...DEFAULT_LAB_STATE, animate: false },
      reducedMotion: true,
      renderer: "canvas-2d",
      rendererStatus: "fallback",
      performance: null,
      rendering: null,
    } as never);

    expect(evidence).toMatchObject({
      renderer: "canvas-2d",
      rendererStatus: "fallback",
    });
    expect(evidence.assessedDimensions).toContain("canvas-2d-fallback");
    expect(evidence.unassessedDimensions).toContain("webgl2-rendering");
  });
});
