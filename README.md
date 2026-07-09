# design-sandbox

Canonical proof repo for **memi 2.4**: a pre-warmed Next.js 16 + Tailwind 4 + shadcn workspace where AI coding agents can run interface-understanding checks before touching UI code.

Use it to verify the public Memi loop: diagnose design debt, audit UX tenets, extract Tailwind tokens, export a shadcn registry, print MCP no-Figma config, and dry-run Agent Skills installation.

## Stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind 4** + **shadcn/ui** (radix-nova, neutral, CSS variables) — *config only, zero components installed*
- **memi** (`@memi-design/cli@2.4.0`) — interface understanding, design-system memory, MCP, Agent Skills, and shadcn registry export
- **Claude Code** subagents: `screenshot-decoder`, `component-scaffolder`, `motion-director`

## Quick proof

After `@memi-design/cli@2.4.0` is published:

```bash
pnpm install
pnpm verify
```

Before npm publish, test against a local Memi checkout:

```bash
MEMI_BIN=../memi/dist/index.js pnpm verify
```

The proof runner covers:

- `memi --version`
- `memi diagnose . --json --no-write --fail-on none`
- `memi ux audit . --json --no-write`
- `memi tokens --from ./src --output generated/memi-proof/tokens --format css,json --report --json`
- `memi shadcn export --out public/r --name design-sandbox --homepage https://raw.githubusercontent.com/sarveshsea/design-sandbox/main/public --json`
- `memi shadcn doctor --out public/r --json`
- `memi mcp config --target generic` with `mcp start --no-figma`
- `memi agent install universal --dry-run --json --project .`

Raw registry URL after push:

```text
https://raw.githubusercontent.com/sarveshsea/design-sandbox/main/public/r/registry.json
```

## Agent workflow

```text
idea / screenshot / figma url -> /sandbox -> memi proof -> page.tsx renders
```

In Claude Code:

```text
/sandbox "what would a calmer settings panel for [project] look like?"
```

The slash command sequence is:

1. **screenshot-decoder** → structured spec (layout, components, tokens, motion)
2. **component-scaffolder** → `pnpm dlx shadcn add ...` + writes `src/app/sandbox/page.tsx`
3. **motion-director** (only if motion is in scope) → installs `framer-motion`, layers one motion pass
4. **memi proof** → run the design diagnosis, UX audit, token extraction, and registry export before sharing

Open `http://localhost:3000/sandbox` to see the result.

## Branching

```bash
git checkout main
git checkout -b explore/<topic>
```

`main` always stays the empty playground. Each exploration is its own branch — keep, merge, or delete.

## What's in the box

```
.claude/                         # Claude Code agentic layer
  CLAUDE.md                      # operating manual
  agents/                        # 3 specialized subagents
    screenshot-decoder.md
    component-scaffolder.md
    motion-director.md
  commands/sandbox.md            # /sandbox slash command
  settings.json                  # pre-allowed shell calls (no popups mid-spike)
.memoire/                        # memi design memory
  SOUL.md                        # voice + visual baseline
  AGENTS.md                      # agent roster (mirrors .claude/agents/)
  TOOLS.md                       # tool permission policy
  HEARTBEAT.md                   # end-of-exploration checks
  project.json                   # auto-detected stack snapshot
.mcp.json                        # memi MCP wired to Claude Code
specs/                           # drop JSON specs here for complex explorations
generated/                       # memi generate target
generated/memi-proof/tokens/     # token extraction proof artifacts
public/r/                        # shadcn registry export proof
research/                        # for memi research output
prototype/                       # scratch space
src/
  app/
    page.tsx                     # landing → /sandbox
    sandbox/page.tsx             # the canvas (currently blank)
    layout.tsx
    globals.css                  # shadcn CSS variables (neutral, light + dark)
  components/ui/                 # empty — fills as shadcn add runs
  lib/utils.ts                   # cn() helper
components.json                  # shadcn config
```

## Local commands

```bash
pnpm dev          # http://localhost:3000
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
pnpm memi:diagnose # design debt JSON proof
pnpm memi:ux       # UX tenets JSON proof
pnpm memi:tokens   # token extraction report
pnpm memi:shadcn   # shadcn registry export + doctor
pnpm memi:mcp      # no-Figma MCP config proof
pnpm memi:agent    # Agent Skills dry-run proof
pnpm verify        # typecheck + lint + build + every memi proof
```

## Hard rules (also in `.claude/CLAUDE.md`)
- shadcn-first; never recreate a primitive that exists
- theme tokens only; **no hex literals anywhere**
- one focused change per turn for visual work
- UI animations <400ms, `prefers-reduced-motion` always honored
- never invent constraints the user didn't state
