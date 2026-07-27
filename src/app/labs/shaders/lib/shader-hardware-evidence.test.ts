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
    const digest = createHash("sha256").update(raw).digest("hex");
    const result = summary.result as Record<string, unknown>;
    const privacy = summary.privacy as Record<string, unknown>;

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
