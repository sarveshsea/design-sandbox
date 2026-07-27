import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const summaryPath = path.join(
  root,
  "docs/evidence/shader-lab-hardware-2026-07-27.json",
);

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

function digest(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

describe("durable shader hardware evidence", () => {
  it("binds every semantic claim to retained run, raw, and image artifacts", () => {
    const summary = readJson(summaryPath);
    const artifacts = summary.artifacts as Record<
      string,
      { path: string; sha256: string; byteLength: number }
    >;
    const requiredArtifacts = [
      "runReport",
      "rawEvidence",
      "staticFrame",
      "reducedMotionFrame",
      "fullPageScreenshot",
    ];

    expect(Object.keys(artifacts)).toEqual(
      expect.arrayContaining(requiredArtifacts),
    );

    for (const key of requiredArtifacts) {
      const artifact = artifacts[key];
      expect(artifact.path).toMatch(/^docs\/evidence\/[a-z0-9.-]+$/);
      const absolutePath = path.resolve(root, artifact.path);
      expect(absolutePath.startsWith(path.join(root, "docs/evidence/"))).toBe(
        true,
      );
      expect(statSync(absolutePath).isFile()).toBe(true);
      expect(statSync(absolutePath).size).toBe(artifact.byteLength);
      expect(digest(absolutePath)).toBe(artifact.sha256);
    }

    const runReport = readJson(path.resolve(root, artifacts.runReport.path));
    const rawEvidence = readJson(path.resolve(root, artifacts.rawEvidence.path));
    const result = summary.result as Record<string, unknown>;
    const summaryPerformance = result.performance as Record<string, unknown>;
    const rawPerformance = rawEvidence.performance as Record<string, unknown>;
    const runArtifacts = runReport.artifacts as Record<
      string,
      { sha256: string }
    >;

    expect(summary.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(runReport.sourceCommit).toBe(summary.sourceCommit);
    const sourceCommit = String(summary.sourceCommit);
    const latestNonEvidenceCommit = execFileSync(
      "git",
      [
        "log",
        "-1",
        "--format=%H",
        "--",
        ".",
        ":(exclude)docs/evidence/shader-lab-hardware-*",
      ],
      { encoding: "utf8" },
    ).trim();
    expect(sourceCommit).toBe(latestNonEvidenceCommit);
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

    expect(runArtifacts.rawEvidence.sha256).toBe(
      artifacts.rawEvidence.sha256,
    );
    expect(runArtifacts.staticFrame.sha256).toBe(artifacts.staticFrame.sha256);
    expect(runArtifacts.reducedMotionFrame.sha256).toBe(
      artifacts.reducedMotionFrame.sha256,
    );
    expect(runArtifacts.fullPageScreenshot.sha256).toBe(
      artifacts.fullPageScreenshot.sha256,
    );
    expect(runReport.auditEvidenceSha256).toBe(artifacts.rawEvidence.sha256);
    expect(runReport.deterministicFrame).toMatchObject({
      repeatMatched: true,
      sha256: artifacts.staticFrame.sha256,
    });
    expect(runReport.reducedMotionFrame).toMatchObject({
      repeatMatched: true,
      sha256: artifacts.reducedMotionFrame.sha256,
    });
    expect(summaryPerformance).toMatchObject({
      budgetMs: rawPerformance.budgetMs,
      mainThreadSubmission: rawPerformance.mainThreadSubmission,
      animationFrameCadence: rawPerformance.animationFrameCadence,
      gpuDrawPass: rawPerformance.gpuDrawPass,
    });
    expect(summaryPerformance).not.toHaveProperty("gpuFrameMedianMs");
    expect(summary.assessedDimensions).toEqual(
      expect.arrayContaining([
        "animation-frame-cadence",
        "gpu-draw-pass-duration",
        "static-frame-determinism",
        "automated-wcag-a-aa",
        "durable-artifact-binding",
      ]),
    );
    expect(summary.unassessedDimensions).toEqual([
      "power-consumption",
      "wide-gamut-color-accuracy",
    ]);
  });

  it("keeps unsupported claims open and stores no direct personal identifiers", () => {
    const summary = readJson(summaryPath);
    const result = summary.result as Record<string, unknown>;
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(result.status).toBe("partial");
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
    expect(summary.privacy).toEqual({
      serialNumberRecorded: false,
      hardwareUuidRecorded: false,
      personalIdentifiersRecorded: false,
    });
    expect(serialized).not.toMatch(/serial_number|hardware_uuid|username|home\//);
  });
});
