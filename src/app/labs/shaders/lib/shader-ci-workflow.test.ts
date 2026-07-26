import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const WORKFLOW_PATH = resolve(
  process.cwd(),
  ".github/workflows/shader-lab-proof.yml",
);

function readWorkflow(): string {
  return readFileSync(WORKFLOW_PATH, "utf8");
}

describe("shader lab CI workflow", () => {
  it("pins every reusable action to an immutable commit", () => {
    const workflow = readWorkflow();
    const actionReferences = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map(
      ([, reference]) => reference,
    );

    expect(actionReferences.length).toBeGreaterThanOrEqual(3);
    expect(actionReferences).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^actions\/checkout@[a-f0-9]{40}$/),
        expect.stringMatching(/^actions\/setup-node@[a-f0-9]{40}$/),
        expect.stringMatching(/^actions\/upload-artifact@[a-f0-9]{40}$/),
      ]),
    );
    expect(actionReferences.every((reference) => /@[a-f0-9]{40}$/.test(reference))).toBe(
      true,
    );
  });

  it("runs every blocking shader proof gate after a frozen install", () => {
    const workflow = readWorkflow();
    const commands = [
      "pnpm install --frozen-lockfile",
      "pnpm audit --prod",
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test:coverage",
      "pnpm build",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:e2e",
    ];

    for (const command of commands) {
      expect(workflow).toContain(`run: ${command}`);
    }

    const positions = commands.map((command) => workflow.indexOf(`run: ${command}`));
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(workflow).not.toMatch(
      /name:\s+Run Chromium shader proof[\s\S]*?continue-on-error:\s+true/,
    );
  });

  it("retains deterministic screenshots and diagnostics when a gate fails", () => {
    const workflow = readWorkflow();

    expect(workflow).toContain("if: failure() && !cancelled()");
    expect(workflow).toContain("test-results/");
    expect(workflow).toContain("playwright-report/");
    expect(workflow).toContain("coverage/");
    expect(workflow).toContain("if-no-files-found: ignore");
  });
});
