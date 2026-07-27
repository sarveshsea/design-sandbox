import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cpus, platform, release, totalmem } from "node:os";
import { resolve } from "node:path";

function sha256(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function artifact(path: string, body: Buffer) {
  return {
    path,
    sha256: sha256(body),
    byteLength: body.byteLength,
  };
}

interface ExportedAuditEvidence {
  performance: {
    budgetMs: number;
    mainThreadSubmission: Record<string, unknown>;
    animationFrameCadence: Record<string, unknown>;
    gpuDrawPass?: Record<string, unknown>;
  };
  rendering: {
    renderer: string;
    vendor: string;
    rendererClassification: string;
    rendererInfoSource: string;
  };
  assessedDimensions: string[];
}

async function writeDurableHardwareEvidence(input: {
  auditEvidence: ExportedAuditEvidence;
  browserBinaryVersion: string;
  emulatedUserAgent: string;
  staticFrame: Buffer;
  reducedMotionFrame: Buffer;
  fullPageScreenshot: Buffer;
  accessibilityViolations: number;
}) {
  const configuredDirectory = process.env.SHADER_EVIDENCE_DIR;
  if (!configuredDirectory) return;

  const evidenceDirectory = resolve(process.cwd(), configuredDirectory);
  await mkdir(evidenceDirectory, { recursive: true });
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const capturedAt = new Date().toISOString();
  const names = {
    rawEvidence: "shader-lab-hardware-raw-2026-07-27.json",
    staticFrame: "shader-lab-hardware-static-2026-07-27.png",
    reducedMotionFrame:
      "shader-lab-hardware-reduced-motion-2026-07-27.png",
    fullPageScreenshot: "shader-lab-hardware-full-page-2026-07-27.png",
    runReport: "shader-lab-hardware-run-2026-07-27.json",
    summary: "shader-lab-hardware-2026-07-27.json",
  } as const;
  const relativePath = (name: string) => `docs/evidence/${name}`;
  const absolutePath = (name: string) => resolve(evidenceDirectory, name);
  const rawBody = Buffer.from(
    `${JSON.stringify(input.auditEvidence, null, 2)}\n`,
  );
  await writeFile(absolutePath(names.rawEvidence), rawBody);
  await writeFile(absolutePath(names.staticFrame), input.staticFrame);
  await writeFile(
    absolutePath(names.reducedMotionFrame),
    input.reducedMotionFrame,
  );
  await writeFile(
    absolutePath(names.fullPageScreenshot),
    input.fullPageScreenshot,
  );

  const runArtifacts = {
    rawEvidence: artifact(relativePath(names.rawEvidence), rawBody),
    staticFrame: artifact(relativePath(names.staticFrame), input.staticFrame),
    reducedMotionFrame: artifact(
      relativePath(names.reducedMotionFrame),
      input.reducedMotionFrame,
    ),
    fullPageScreenshot: artifact(
      relativePath(names.fullPageScreenshot),
      input.fullPageScreenshot,
    ),
  };
  const runReport = {
    schemaVersion: "1.0.0",
    capturedAt,
    sourceCommit,
    route: "/labs/shaders",
    project: "chrome-hardware",
    browserBinaryVersion: input.browserBinaryVersion,
    emulatedUserAgent: input.emulatedUserAgent,
    auditEvidenceSha256: runArtifacts.rawEvidence.sha256,
    deterministicFrame: {
      repeatMatched: true,
      sha256: runArtifacts.staticFrame.sha256,
    },
    reducedMotionFrame: {
      repeatMatched: true,
      sha256: runArtifacts.reducedMotionFrame.sha256,
    },
    accessibility: {
      standard: "WCAG 2 A/AA and WCAG 2.1 A/AA",
      violations: input.accessibilityViolations,
    },
    artifacts: runArtifacts,
  };
  const runReportBody = Buffer.from(`${JSON.stringify(runReport, null, 2)}\n`);
  await writeFile(absolutePath(names.runReport), runReportBody);

  const rawPerformance = input.auditEvidence.performance;
  const rawRendering = input.auditEvidence.rendering;
  const assessedDimensions = [
    ...new Set([
      ...input.auditEvidence.assessedDimensions,
      "static-frame-determinism",
      "reduced-motion-active",
      "automated-wcag-a-aa",
      "durable-artifact-binding",
    ]),
  ];
  const summary = {
    schemaVersion: "1.1.0",
    capturedAt,
    sourceCommit,
    route: "/labs/shaders",
    command:
      'SHADER_HARDWARE_PROOF=1 SHADER_EVIDENCE_DIR=docs/evidence pnpm exec playwright test --project chrome-hardware --grep "accessible deterministic"',
    environment: {
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model ?? "unreported",
      cpuCores: cpus().length,
      memoryGb: Math.round(totalmem() / 1024 ** 3),
      browserBinaryVersion: input.browserBinaryVersion,
      emulatedUserAgent: input.emulatedUserAgent,
      renderer: rawRendering.renderer,
      vendor: rawRendering.vendor,
      rendererClassification: rawRendering.rendererClassification,
      rendererInfoSource: rawRendering.rendererInfoSource,
    },
    result: {
      status: "partial",
      testsPassed: 1,
      testsFailed: 0,
      performance: {
        budgetMs: rawPerformance.budgetMs,
        mainThreadSubmission: rawPerformance.mainThreadSubmission,
        animationFrameCadence: rawPerformance.animationFrameCadence,
        gpuDrawPass: rawPerformance.gpuDrawPass,
      },
      rendering: rawRendering,
      deterministicFrame: runReport.deterministicFrame,
      reducedMotionFrame: runReport.reducedMotionFrame,
      accessibility: runReport.accessibility,
    },
    artifacts: {
      runReport: artifact(relativePath(names.runReport), runReportBody),
      ...runArtifacts,
    },
    assessedDimensions,
    unassessedDimensions: [
      "power-consumption",
      "wide-gamut-color-accuracy",
    ],
    accessIssues: [
      {
        dimension: "power-consumption",
        status: "blocked",
        reason:
          "No supported unprivileged power instrument was available. No privilege escalation was attempted.",
      },
      {
        dimension: "wide-gamut-color-accuracy",
        status: "pending",
        reason:
          "The native WebGL drawing buffer reports Display P3, but no calibrated reference and physical capture path has been verified.",
      },
    ],
    privacy: {
      serialNumberRecorded: false,
      hardwareUuidRecorded: false,
      personalIdentifiersRecorded: false,
    },
    notes: [
      "The retained run report, raw export, static frame, reduced-motion frame, and full-page screenshot are bound by SHA-256.",
      "GPU timing measures the processed WebGL draw pass only. Animation-frame cadence is reported separately.",
      "This record must not be used to claim measured power consumption or calibrated wide-gamut accuracy.",
    ],
  };
  await writeFile(
    absolutePath(names.summary),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
}

test("offers an accessible deterministic shader comparison and evidence export", async ({
  browser,
  page,
}, testInfo) => {
  await page.goto("/labs/shaders");

  await expect(
    page.getByRole("heading", { level: 1, name: "Shader field notes" }),
  ).toBeVisible();
  await expect(page.getByLabel("Dither method")).toHaveValue("ordered");
  await expect(page.getByLabel("Deterministic seed")).toHaveValue("2026");
  await expect(page.getByTestId("original-renderer")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.getByTestId("processed-renderer")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.getByTestId("fallback-renderer")).toBeVisible();

  await page.getByLabel("Dither method").selectOption("noise");
  await page.getByLabel("Output color space").selectOption("display-p3");
  await page.getByLabel("Deterministic seed").fill("404");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audit evidence" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  const evidence = JSON.parse(
    await readFile(path!, "utf8"),
  );
  const evidencePath = testInfo.outputPath("shader-audit-evidence.json");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  await testInfo.attach("shader-audit-evidence", {
    path: evidencePath,
    contentType: "application/json",
  });
  expect(evidence.controls).toMatchObject({
    mode: "noise",
    colorSpace: "display-p3",
    seed: 404,
  });
  expect(evidence.deterministic).toBe(false);
  expect(evidence.determinism).toMatchObject({
    seededSpatialNoise: true,
    staticFrame: false,
  });
  expect(
    evidence.performance.mainThreadSubmission.medianMs,
  ).toBeLessThanOrEqual(16.7);
  expect(
    evidence.performance.mainThreadSubmission.sampleCount,
  ).toBeGreaterThanOrEqual(30);
  expect(
    evidence.performance.animationFrameCadence.sampleCount,
  ).toBeGreaterThanOrEqual(30);
  expect(evidence.performance).not.toHaveProperty("gpuFrameMedianMs");
  expect(evidence.rendering).toMatchObject({
    requestedColorSpace: "display-p3",
    powerPreference: "low-power",
    alphaContext: false,
    alphaBits: 0,
    sampledAlpha: 255,
  });
  if (evidence.rendering.colorSpaceSupport === "native") {
    expect(evidence.rendering.drawingBufferColorSpace).toBe("display-p3");
    expect(evidence.assessedDimensions).toContain(
      "wide-gamut-output-contract",
    );
    expect(evidence.unassessedDimensions).not.toContain(
      "wide-gamut-output-contract",
    );
  } else {
    expect(["unsupported", "rejected"]).toContain(
      evidence.rendering.colorSpaceSupport,
    );
    expect(evidence.assessedDimensions).not.toContain(
      "wide-gamut-output-contract",
    );
    expect(evidence.unassessedDimensions).toContain(
      "wide-gamut-output-contract",
    );
  }

  await page.getByLabel("Animate field").uncheck();
  await expect(page.getByText("Static frame active")).toBeVisible();
  const processed = page.getByTestId("processed-renderer");
  const firstFrame = await processed.screenshot();
  const secondFrame = await processed.screenshot();
  expect(secondFrame).toEqual(firstFrame);
  const frameDigest = {
    browser: testInfo.project.name,
    sha256: sha256(firstFrame),
    deterministicRepeat: true,
  };
  const digestPath = testInfo.outputPath("processed-static-frame.sha256.json");
  await writeFile(digestPath, `${JSON.stringify(frameDigest, null, 2)}\n`);
  await testInfo.attach("processed-static-frame", {
    body: firstFrame,
    contentType: "image/png",
  });
  await testInfo.attach("processed-static-frame-digest", {
    path: digestPath,
    contentType: "application/json",
  });
  await page.getByLabel("Animate field").check();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByLabel("Animate field")).toBeDisabled();
  await expect(page.getByText("Static frame active")).toBeVisible();
  const reducedMotionFrame = await processed.screenshot();
  await page.waitForTimeout(250);
  expect(await processed.screenshot()).toEqual(reducedMotionFrame);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const fullPageScreenshot = await page.screenshot({ fullPage: true });
  await writeFile(
    testInfo.outputPath("shader-lab.png"),
    fullPageScreenshot,
  );
  if (testInfo.project.name === "chrome-hardware") {
    await writeDurableHardwareEvidence({
      auditEvidence: evidence,
      browserBinaryVersion: browser.version(),
      emulatedUserAgent: await page.evaluate(() => navigator.userAgent),
      staticFrame: firstFrame,
      reducedMotionFrame,
      fullPageScreenshot,
      accessibilityViolations: accessibility.violations.length,
    });
  }
});

test("honors reduced motion and exports static evidence", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/labs/shaders");

  await expect(page.getByText("Static frame active")).toBeVisible();
  await expect(page.getByLabel("Animate field")).not.toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audit evidence" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  const evidence = JSON.parse(
    await readFile(path!, "utf8"),
  );
  const evidencePath = testInfo.outputPath(
    "reduced-motion-audit-evidence.json",
  );
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  await testInfo.attach("reduced-motion-audit-evidence", {
    path: evidencePath,
    contentType: "application/json",
  });
  expect(evidence.reducedMotion).toBe(true);
  expect(evidence.controls.animate).toBe(false);
  expect(evidence.performance).toMatchObject({
    measurement: "unassessed-static-mode",
  });
  const firstFrame = await page.getByTestId("processed-renderer").screenshot();
  await page.waitForTimeout(250);
  const secondFrame = await page.getByTestId("processed-renderer").screenshot();
  expect(secondFrame).toEqual(firstFrame);
  await testInfo.attach("reduced-motion-render", {
    body: await page.getByTestId("processed-renderer").screenshot(),
    contentType: "image/png",
  });
});

test("keeps the comparison usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/labs/shaders");

  await expect(page.getByRole("heading", { name: "Shader field notes" })).toBeVisible();
  await expect(page.getByLabel("Dither method", { exact: true })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("supports keyboard operation and has no automated WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/labs/shaders");
  await expect(
    page.getByRole("button", { name: "Export audit evidence" }),
  ).toBeEnabled();

  const dither = page.getByLabel("Dither method");
  await dither.focus();
  await expect(dither).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Output color space")).toBeFocused();

  const ripple = page.getByLabel("Ripple strength");
  await ripple.focus();
  const before = await ripple.inputValue();
  await page.keyboard.press("ArrowRight");
  expect(await ripple.inputValue()).not.toBe(before);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("Canvas fallback responds to ripple and distortion controls", async ({
  page,
}) => {
  const hydrationWarnings: string[] = [];
  page.on("console", (message) => {
    if (/hydrated|hydration mismatch/i.test(message.text())) {
      hydrationWarnings.push(message.text());
    }
  });
  await page.goto("/labs/shaders");
  await expect(
    page.getByRole("button", { name: "Export audit evidence" }),
  ).toBeEnabled();
  const fallback = page.getByTestId("fallback-renderer");
  const initial = await fallback.screenshot();

  await page.getByLabel("Ripple strength").fill("1");
  await page.getByLabel("Distortion").fill("1");
  await expect(page.getByText("100%")).toHaveCount(2);
  const changed = await fallback.screenshot();

  expect(changed).not.toEqual(initial);
  expect(hydrationWarnings).toEqual([]);
});

test("exports Canvas 2D fallback evidence when WebGL2 is unavailable", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === "webgl2") return null;
      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof getContext;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/labs/shaders");

  await expect(page.getByTestId("processed-renderer")).toHaveAttribute(
    "data-status",
    "unavailable",
  );
  await expect(page.getByTestId("fallback-renderer")).toHaveAttribute(
    "data-status",
    "ready",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audit evidence" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const evidence = JSON.parse(
    await readFile(path!, "utf8"),
  );

  expect(evidence).toMatchObject({
    renderer: "canvas-2d",
    rendererStatus: "fallback",
    reducedMotion: true,
  });
  await testInfo.attach("canvas-2d-fallback", {
    body: await page.getByTestId("fallback-renderer").screenshot(),
    contentType: "image/png",
  });
});
