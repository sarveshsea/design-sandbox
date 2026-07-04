# design-sandbox

Public proof repo for memi v2 interface understanding.

`design-sandbox` is a pre-warmed Next.js 16 + Tailwind 4 + shadcn workspace for design-to-code exploration. It is intentionally small: one sandbox route, one design memory contract, one agent workflow, and a clean path from brief or screenshot to a working UI composition.

Use it to prove how `@memi-design/cli` should feel inside a real design stack:

- Run UX and app-quality audits before coding.
- Extract Tailwind tokens and shadcn registry context.
- Give Codex, Claude Code, Cursor, Hermes, OpenCode, OpenClaw, and Agent Skills the same design memory.
- Spike product UI safely without polluting a production app.
- Preserve receipts: commands, artifacts, screenshots, and component decisions.

## Five-minute setup

```bash
pnpm install
npm i -g @memi-design/cli

pnpm memi:agent
pnpm memi:diagnose
pnpm memi:ux
pnpm memi:tokens
pnpm dev
```

Open `http://localhost:3000/sandbox`.

## What this repo proves

| Layer | Proof in this repo |
| --- | --- |
| Next.js 16 App Router | `src/app/page.tsx`, `src/app/sandbox/page.tsx`, `src/app/layout.tsx` |
| Tailwind 4 + shadcn | `src/app/globals.css`, `components.json`, token-only sandbox UI |
| memi v2 CLI | `pnpm memi:diagnose`, `pnpm memi:ux`, `pnpm memi:tokens`, `pnpm memi:registry` |
| MCP | `.mcp.json` runs `memi mcp start --no-figma` |
| Agent Skills | `.agents/skills/memoire-design-tooling/SKILL.md` |
| Claude Code | `.claude/CLAUDE.md`, `.claude/commands/sandbox.md`, specialized agents |
| Shared agent contract | `memoire.agent.yaml`, `.memoire/*`, `AGENTS.md` |
| Verification | `pnpm verify`, `pnpm check:hex` |

Deeper docs:

- [memi integration architecture](docs/MEMI_INTEGRATION.md)
- [public repo playbook](docs/PUBLICATION.md)

## Core workflow

```text
brief / screenshot / Figma URL
  -> memi diagnose + UX audit
  -> screenshot-decoder spec
  -> shadcn-first component scaffold
  -> /sandbox render
  -> no-hex + typecheck + build
  -> copy the proven pattern into the real product
```

In Claude Code:

```text
/sandbox "design a calmer billing command center for a B2B SaaS"
```

For Codex, Cursor, OpenCode, Hermes, OpenClaw, or any `.agents/skills` reader:

```bash
memi agent install universal --project .
npx skills add sarveshsea/memi --skill memoire-design-tooling
```

Then tell the agent:

```text
Use the memoire-design-tooling skill. Run memi diagnose, memi ux audit, and memi tokens before changing the sandbox UI. Keep the result shadcn-first, token-only, and verified with pnpm verify.
```

## Local commands

```bash
pnpm dev             # http://localhost:3000
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
pnpm build           # production build
pnpm verify          # typecheck + lint + build + no-hex scan
pnpm check:hex       # block raw hex literals in sandbox source

pnpm memi:status     # memi workspace status
pnpm memi:agent      # dry-run all agent kit writes
pnpm memi:diagnose   # app-quality diagnosis
pnpm memi:ux         # UX tenets and traps
pnpm memi:tokens     # Tailwind token extraction report
pnpm memi:registry   # shadcn registry export to public/r
pnpm memi:research   # research-backed spec package path
```

## memi integration

### MCP

`.mcp.json` is already wired for a registry-safe MCP server:

```json
{
  "mcpServers": {
    "memoire": {
      "command": "memi",
      "args": ["mcp", "start", "--no-figma"]
    }
  }
}
```

Use `--no-figma` by default so agents, registries, and CI can inspect the sandbox without desktop Figma.

### Agent Skills

The repo ships `.agents/skills/memoire-design-tooling/SKILL.md`, installed from the local memi v2 package. Refresh it after memi updates:

```bash
memi agent install universal --project . --force
```

### Suite manifest

`memoire.agent.yaml` declares the shared contract for memory, harnesses, skills, and repeatable recipes. Agents should read it before editing UI.

Key recipes:

- `design-audit`: app quality, UX traps, token scan.
- `sandbox-readiness`: checks `/sandbox` before sharing.
- `research-vibe-design`: turns research into specs and FigJam-ready source.
- `registry-export`: exports shadcn registry items for reuse.

## Design rules

- Use shadcn primitives before custom UI.
- Use Tailwind tokens only; no raw hex literals in `src/app/sandbox/**`.
- Keep components at Atomic Design levels when a composition gets complex.
- Prefer dense, useful workbench UI over landing-page decoration.
- Build in one route by default: `src/app/sandbox/page.tsx`.
- Respect `prefers-reduced-motion` for any motion pass.
- Verify on desktop and mobile before sharing screenshots.

## Branching

```bash
git checkout main
git checkout -b explore/<topic>
```

`main` stays the clean baseline. Each exploration branch can be kept, merged, copied into another product, or deleted.

## Public positioning

Use these tags when linking this repo from memi docs, GitHub topics, or launch posts:

```text
#InterfaceUnderstanding #DesignSystems #AICodingAgents #shadcn #TailwindCSS #MCP #AgentSkills #Codex #ClaudeCode #UXAudit #FigmaToCode #DesignEngineering
```

## Relationship to memi

`@memi-design/cli` is the engine. `design-sandbox` is the proof surface.

Publish memi first, then keep this repo as the public example that shows how a product team should wire design memory, MCP, skills, shadcn, Tailwind, and UX auditing into a real workspace.
