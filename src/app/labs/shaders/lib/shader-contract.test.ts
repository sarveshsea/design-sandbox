import { describe, expect, it } from "vitest";

import {
  BAYER_4X4,
  DEFAULT_LAB_STATE,
  createAuditEvidence,
  getBayerThreshold,
  normalizeLabState,
  seededNoise,
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

  it("normalizes external control values at the shader boundary", () => {
    expect(
      normalizeLabState({
        mode: "unsupported",
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
        seed: 44.6,
        ripple: -3,
        distortion: 0.7,
        animate: false,
      }),
    ).toEqual({
      mode: "noise",
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
      },
    });

    expect(evidence).toMatchObject({
      schemaVersion: "1.0.0",
      route: "/labs/shaders",
      deterministic: true,
      reducedMotion: true,
      renderer: "webgl2",
      algorithms: ["bayer-4x4", "seeded-noise", "ripple-distortion"],
      performance: {
        measurement: "main-thread-webgl-submission",
        budgetMs: 16.7,
        medianMs: 1.25,
        passesBudget: true,
        sampleCount: 120,
      },
    });
    expect(evidence.unassessedDimensions).toContain("gpu-frame-time");
  });
});
