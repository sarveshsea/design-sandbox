#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const scanRoots = ["src/app/sandbox", "src/app/page.tsx"];
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
const failures = [];

for (const target of scanRoots) {
  await scan(join(root, target));
}

if (failures.length > 0) {
  console.error("Raw hex literals are not allowed in sandbox UI files:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("No raw hex literals found in sandbox UI files.");

async function scan(path) {
  const entries = await readdir(path, { withFileTypes: true }).catch(async () => {
    const text = await readFile(path, "utf-8");
    checkFile(path, text);
    return [];
  });

  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      await scan(child);
      continue;
    }
    if (!/\.(tsx?|css)$/.test(entry.name)) continue;
    checkFile(child, await readFile(child, "utf-8"));
  }
}

function checkFile(path, text) {
  const matches = text.match(hexPattern);
  if (!matches) return;
  failures.push(`${path.slice(root.length + 1)}: ${Array.from(new Set(matches)).join(", ")}`);
}
