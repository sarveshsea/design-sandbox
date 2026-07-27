import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("public shader proof contract", () => {
  it("binds every public surface to the verified Memi release", () => {
    const manifest = JSON.parse(read("memi-proof.manifest.json")) as {
      package: string;
      version: string;
      npmIntegrity: string;
    };
    const proofScript = read("scripts/memi-proof.mjs");
    const gitignore = read(".gitignore");
    const home = read("src/app/page.tsx");
    const readme = read("README.md");

    expect(manifest).toMatchObject({
      package: "@memi-design/cli",
      version: "2.6.2",
      npmIntegrity:
        "sha512-cvWfRIVQhAr6m26ySFO7ZyFlaaexeWPXJZCmiiKMaeSZUWXlyvWQGTjBUZzsJNh8+uj9k6CDgOdX4r8V9VPJIA==",
    });
    expect(proofScript).toContain("memi-proof.manifest.json");
    expect(proofScript).not.toContain('"2.4.0"');
    expect(proofScript).toContain(".memi-proof-tmp-");
    expect(proofScript).not.toContain("tmpdir()");
    expect(proofScript).not.toContain("mkdtempSync(join(process.cwd()");
    expect(gitignore).toContain("/.memi-proof-tmp-*");
    expect(home).toContain("releaseManifest.version");
    expect(readme).toContain("@memi-design/cli@2.6.2");
  });

  it("makes the public verification command cover Memi, unit, build, and browser proof", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    const verify = packageJson.scripts.verify;
    const verifyCi = packageJson.scripts["verify:ci"];

    for (const command of [
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test:coverage",
      "pnpm build",
      "pnpm memi:proof",
      "pnpm test:e2e",
    ]) {
      expect(verify).toContain(command);
      expect(verifyCi).toContain(command);
    }
    expect(verify).toContain("playwright install chromium webkit");
  });

  it("publishes an explicit license, attribution notice, and shader source policy", () => {
    const license = read("LICENSE");
    const notice = read("NOTICE");
    const sources = read("docs/evidence/shader-lab-sources.md");

    expect(license).toMatch(/^MIT License/);
    expect(notice).toContain("xxHash");
    expect(notice).toContain("BSD 2-Clause");
    expect(sources).toContain("https://thebookofshaders.com/");
    expect(sources).toContain("https://registry.khronos.org/webgl/");
    expect(sources).toContain("external shader code copied: no");
    expect(sources).toContain("external media copied: no");
  });
});
