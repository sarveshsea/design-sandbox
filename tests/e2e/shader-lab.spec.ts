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
  expect(evidence.controls).toMatchObject({ mode: "noise", seed: 404 });
  expect(evidence.deterministic).toBe(true);
  expect(evidence.performance.medianMs).toBeLessThanOrEqual(16.7);
  expect(evidence.performance.sampleCount).toBeGreaterThanOrEqual(30);

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
