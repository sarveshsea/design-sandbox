import { expect, test } from "@playwright/test";

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
  await page.getByLabel("Deterministic seed").fill("404");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export audit evidence" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  const evidence = JSON.parse(
    await (await import("node:fs/promises")).readFile(path!, "utf8"),
  );
  await (await import("node:fs/promises")).writeFile(
    testInfo.outputPath("shader-audit-evidence.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  expect(evidence.controls).toMatchObject({ mode: "noise", seed: 404 });
  expect(evidence.deterministic).toBe(true);
  expect(evidence.performance.medianMs).toBeLessThanOrEqual(16.7);
  expect(evidence.performance.sampleCount).toBeGreaterThanOrEqual(30);

  await page.getByLabel("Animate field").uncheck();
  await expect(page.getByText("Static frame active")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("shader-lab.png"),
    fullPage: true,
  });
});

test("honors reduced motion with a static shader frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/labs/shaders");

  await expect(page.getByText("Static frame active")).toBeVisible();
  await expect(page.getByLabel("Animate field")).not.toBeChecked();
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
