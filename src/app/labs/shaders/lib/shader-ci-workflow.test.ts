import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const WORKFLOW_PATH = resolve(
  process.cwd(),
  ".github/workflows/shader-lab-proof.yml",
);
const PLAYWRIGHT_CONFIG_PATH = resolve(process.cwd(), "playwright.config.ts");

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
        expect.stringMatching(/^pnpm\/action-setup@[a-f0-9]{40}$/),
        expect.stringMatching(/^actions\/setup-node@[a-f0-9]{40}$/),
        expect.stringMatching(/^actions\/upload-artifact@[a-f0-9]{40}$/),
      ]),
    );
    expect(actionReferences.every((reference) => /@[a-f0-9]{40}$/.test(reference))).toBe(
      true,
    );
    expect(workflow).toContain("runs-on: ubuntu-24.04");
    expect(workflow).toContain("version: 10.17.0");
    expect(workflow).toContain("node-version: 22.22.0");
    expect(workflow).toContain("fetch-depth: 0");
  });

  it("runs every blocking shader proof gate after a frozen install", () => {
    const workflow = readWorkflow();
    const commands = [
      "pnpm install --frozen-lockfile",
      "pnpm audit --prod",
      "pnpm exec playwright install --with-deps chromium webkit",
      "pnpm verify:ci",
    ];

    for (const command of commands) {
      expect(workflow).toContain(`run: ${command}`);
    }

    const positions = commands.map((command) => workflow.indexOf(`run: ${command}`));
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(workflow).not.toContain("continue-on-error: true");
  });

  it("reruns when public proof, source policy, or durable evidence changes", () => {
    const workflow = readWorkflow();
    const protectedPaths = [
      '"docs/evidence/**"',
      '"src/app/globals.css"',
      '"src/app/layout.tsx"',
      '"src/app/page.tsx"',
      '"scripts/memi-proof.mjs"',
      '"memi-proof.manifest.json"',
      '"README.md"',
      '"LICENSE"',
      '"NOTICE"',
    ];

    for (const protectedPath of protectedPaths) {
      expect(workflow).toContain(protectedPath);
    }
  });

  it("retains deterministic cross-browser evidence on every completed run", () => {
    const workflow = readWorkflow();

    expect(workflow).toContain("if: always() && !cancelled()");
    expect(workflow).toContain("shader-lab-proof-${{ github.run_id }}");
    expect(workflow).toContain("test-results/");
    expect(workflow).toContain("playwright-report/");
    expect(workflow).toContain("coverage/");
    expect(workflow).toContain("if-no-files-found: error");
    expect(workflow).toContain("retention-days: 30");
  });

  it("captures retained hardware screenshots from a production build", () => {
    const config = readFileSync(PLAYWRIGHT_CONFIG_PATH, "utf8");

    expect(config).toContain(
      'hardwareProof\n      ? "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100"',
    );
  });
});
