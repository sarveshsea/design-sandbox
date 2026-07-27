import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

function sha256(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

test("offers an accessible deterministic shader comparison and evidence export", async ({
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
    drawingBufferColorSpace: "display-p3",
    colorSpaceSupport: "native",
    powerPreference: "low-power",
    alphaContext: false,
    alphaBits: 0,
    sampledAlpha: 255,
  });

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
  await page.screenshot({
    path: testInfo.outputPath("shader-lab.png"),
    fullPage: true,
  });
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
  await page.keyboard.press("ArrowDown");
  await expect(dither).toHaveValue("noise");
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
  await page.goto("/labs/shaders");
  const fallback = page.getByTestId("fallback-renderer");
  const initial = await fallback.screenshot();

  await page.getByLabel("Ripple strength").fill("1");
  await page.getByLabel("Distortion").fill("1");
  await expect(page.getByText("100%")).toHaveCount(2);
  const changed = await fallback.screenshot();

  expect(changed).not.toEqual(initial);
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
