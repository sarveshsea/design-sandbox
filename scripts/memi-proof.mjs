#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const releaseManifest = JSON.parse(
  readFileSync(new URL("../memi-proof.manifest.json", import.meta.url), "utf8"),
);
const MEMI_VERSION = releaseManifest.version;
const MEMI_PACKAGE = `${releaseManifest.package}@${MEMI_VERSION}`;
const registryBaseUrl = "https://raw.githubusercontent.com/sarveshsea/design-sandbox/main/public";
const retainArtifacts = process.env.MEMI_PROOF_RETAIN_ARTIFACTS === "1";
const proofRoot = retainArtifacts
  ? process.cwd()
  : mkdtempSync(join(process.cwd(), ".memi-proof-tmp-"));
const tokenOutput = retainArtifacts
  ? "generated/memi-proof/tokens"
  : join(proofRoot, "tokens");
const registryOutput = retainArtifacts ? "public/r" : join(proofRoot, "registry");

if (!retainArtifacts) {
  process.on("exit", () => rmSync(proofRoot, { recursive: true, force: true }));
}

const task = process.argv[2] ?? "all";

const tasks = {
  version: [
    {
      label: "memi version",
      args: ["--version"],
      verify: (result) => result.stdout.trim() === MEMI_VERSION,
    },
  ],
  diagnose: [
    {
      label: "design diagnosis",
      args: ["diagnose", ".", "--json", "--no-write", "--fail-on", "none"],
      verifyJson: true,
    },
  ],
  ux: [
    {
      label: "UX tenets audit",
      args: ["ux", "audit", ".", "--json", "--no-write"],
      verifyJson: true,
    },
  ],
  tokens: [
    {
      label: "token extraction",
      args: [
        "tokens",
        "--from",
        "./src",
        "--output",
        tokenOutput,
        "--format",
        "css,json",
        "--report",
        "--json",
      ],
      verifyJson: true,
    },
  ],
  shadcn: [
    {
      label: "shadcn registry export",
      args: [
        "shadcn",
        "export",
        "--out",
        registryOutput,
        "--name",
        "design-sandbox",
        "--homepage",
        registryBaseUrl,
        "--json",
      ],
      verifyJson: true,
    },
    {
      label: "shadcn registry doctor",
      args: ["shadcn", "doctor", "--out", registryOutput, "--json"],
      verifyJson: true,
    },
  ],
  mcp: [
    {
      label: "MCP no-Figma config",
      args: ["mcp", "config", "--target", "generic"],
      verify: (result) => {
        const output = result.stdout;
        return output.includes('"command": "memi"')
          && output.includes('"mcp"')
          && output.includes('"start"')
          && output.includes('"--no-figma"');
      },
    },
  ],
  agent: [
    {
      label: "Agent Skills install plan",
      args: ["agent", "install", "universal", "--dry-run", "--json", "--project", "."],
      verify: (result) => {
        const payload = parseJson(result.stdout, "Agent Skills install plan");
        return payload?.status === "planned"
          && payload?.target === "universal"
          && payload?.plans?.some((plan) => plan.destination === ".agents/skills/memoire-design-tooling");
      },
    },
  ],
};

const allTasks = ["version", "diagnose", "ux", "tokens", "shadcn", "mcp", "agent"];

if (task !== "all" && !tasks[task]) {
  console.error(`Unknown proof task "${task}". Use one of: all, ${Object.keys(tasks).join(", ")}`);
  process.exit(1);
}

const selectedTasks = task === "all" ? allTasks : [task];

if (!process.env.MEMI_BIN) verifyPublishedPackage();

for (const name of selectedTasks) {
  for (const step of tasks[name]) {
    runStep(step);
  }
}

console.log(`memi ${MEMI_VERSION} proof passed for ${selectedTasks.join(", ")}.`);

function verifyPublishedPackage() {
  const result = spawnSync(
    "npm",
    ["view", MEMI_PACKAGE, "dist.integrity", "--json"],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.status !== 0) fail("npm package integrity", result);
  const integrity = parseJson(result.stdout, "npm package integrity");
  if (integrity !== releaseManifest.npmIntegrity) {
    fail(
      "npm package integrity",
      result,
      `Expected ${releaseManifest.npmIntegrity}, received ${integrity}.`,
    );
  }
  console.log(`ok: npm package integrity (${releaseManifest.npmIntegrity})`);
}

function runStep(step) {
  const invocation = buildInvocation(step.args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    env: { ...process.env, npm_config_ignore_scripts: "true" },
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.status !== 0) {
    fail(step.label, result);
  }

  if (step.verifyJson) {
    parseJson(result.stdout, step.label);
  }

  if (step.verify && !step.verify(result)) {
    fail(step.label, result, "Output verification failed.");
  }

  console.log(`ok: ${step.label}`);
}

function buildInvocation(args) {
  const localBin = process.env.MEMI_BIN;
  if (localBin) {
    if (localBin.endsWith(".js")) return { command: process.execPath, args: [localBin, ...args] };
    return { command: localBin, args };
  }

  return {
    command: "npm",
    args: ["exec", "--yes", "--package", MEMI_PACKAGE, "--", "memi", ...args],
  };
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    console.error(output);
    throw new Error(`${label} did not emit JSON`);
  }
}

function fail(label, result, message = "Command failed.") {
  console.error(`\n${label}: ${message}`);
  if (result.stdout) console.error(result.stdout.trim());
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(result.status ?? 1);
}
