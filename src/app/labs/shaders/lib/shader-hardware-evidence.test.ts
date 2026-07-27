import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidenceDirectory = path.resolve(process.cwd(), "docs/evidence");
const summaryPath = path.join(
  evidenceDirectory,
  "shader-lab-hardware-2026-07-27.json",
);
const rawPath = path.join(
  evidenceDirectory,
  "shader-lab-hardware-raw-2026-07-27.json",
);

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("durable shader hardware evidence", () => {
  it("binds the privacy-preserving summary to the raw export", () => {
    const summary = readJson(summaryPath);
    const raw = readFileSync(rawPath);
    const rawEvidence = JSON.parse(raw.toString("utf8")) as {
      performance: {
        browser: string;
        budgetMs: number;
        medianMs: number;
        sampleCount: number;
        gpuTimer: string;
        medianGpuFrameMs: number;
        gpuSampleCount: number;
        gpuPassesBudget: boolean;
      };
      rendering: {
        requestedColorSpace: string;
        alphaContext: boolean;
        alphaBits: number;
        sampledAlpha: number;
        drawingBufferColorSpace: string;
        powerPreference: string;
      };
      assessedDimensions: string[];
      unassessedDimensions: string[];
    };
    const digest = createHash("sha256").update(raw).digest("hex");
    const result = summary.result as Record<string, unknown>;
    const privacy = summary.privacy as Record<string, unknown>;
    const environment = summary.environment as Record<string, unknown>;
    const summaryPerformance = result.performance as Record<string, unknown>;
    const summaryRendering = result.rendering as Record<string, unknown>;

    expect(summary.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    const sourceCommit = String(summary.sourceCommit);
    expect(() =>
      execFileSync("git", ["cat-file", "-e", `${sourceCommit}^{commit}`], {
        stdio: "pipe",
      }),
    ).not.toThrow();
    expect(() =>
      execFileSync(
        "git",
        ["merge-base", "--is-ancestor", sourceCommit, "HEAD"],
        { stdio: "pipe" },
      ),
    ).not.toThrow();
    expect(result.rawEvidenceSha256).toBe(digest);
    expect(environment.browserBinaryVersion).toMatch(
      /^Google Chrome \d+\.\d+\.\d+\.\d+$/,
    );
    expect(environment.emulatedUserAgent).toBe(
      rawEvidence.performance.browser,
    );
    expect(summaryPerformance).toMatchObject({
      budgetMs: rawEvidence.performance.budgetMs,
      mainThreadSubmissionMedianMs: rawEvidence.performance.medianMs,
      mainThreadSampleCount: rawEvidence.performance.sampleCount,
      gpuTimer: rawEvidence.performance.gpuTimer,
      gpuFrameMedianMs: rawEvidence.performance.medianGpuFrameMs,
      gpuSampleCount: rawEvidence.performance.gpuSampleCount,
      gpuPassesBudget: rawEvidence.performance.gpuPassesBudget,
    });
    expect(summaryRendering).toEqual(rawEvidence.rendering);
    expect(
      (summary.assessedDimensions as string[]).every((dimension) =>
        rawEvidence.assessedDimensions.includes(dimension),
      ),
    ).toBe(true);
    expect(summary.unassessedDimensions).toEqual(
      rawEvidence.unassessedDimensions,
    );
    expect(privacy).toEqual({
      serialNumberRecorded: false,
      hardwareUuidRecorded: false,
      personalIdentifiersRecorded: false,
    });
  });

  it("keeps unsupported power and wide-gamut claims open", () => {
    const summary = readJson(summaryPath);
    const result = summary.result as Record<string, unknown>;

    expect(result.status).toBe("partial");
    expect(summary.unassessedDimensions).toEqual([
      "power-consumption",
      "wide-gamut-color-accuracy",
    ]);
    expect(summary.accessIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimension: "power-consumption",
          status: "blocked",
        }),
        expect.objectContaining({
          dimension: "wide-gamut-color-accuracy",
          status: "pending",
        }),
      ]),
    );
  });
});
