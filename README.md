# design-sandbox

A pre-warmed Next.js 16 + Tailwind 4 + shadcn surface for **design exploration on any project**.
Drop in an idea, screenshot, or Figma URL — get a working composition out the other side.

Not a deliverable, not a starter kit, not interview prep. A scratchpad for design-to-code spikes.

## Stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind 4** + **shadcn/ui** (radix-nova, neutral, CSS variables) — *config only, zero components installed*
- **Memoire** (`@sarveshsea/memoire`) — design memory + MCP server for Claude Code
- **Claude Code** subagents: `screenshot-decoder`, `component-scaffolder`, `motion-director`

## Workflow

```
idea / screenshot / figma url → /sandbox → page.tsx renders
```

In Claude Code:

```
/sandbox "what would a calmer settings panel for [project] look like?"
```

Or paste a screenshot, then:

```
/sandbox
```

The `/sandbox` slash command runs:
1. **screenshot-decoder** → structured spec (layout, components, tokens, motion)
2. **component-scaffolder** → `pnpm dlx shadcn add ...` + writes `src/app/sandbox/page.tsx`
3. **motion-director** (only if motion is in scope) → installs `framer-motion`, layers one motion pass

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
.memoire/                        # Memoire design memory
  SOUL.md                        # voice + visual baseline
  AGENTS.md                      # agent roster (mirrors .claude/agents/)
  TOOLS.md                       # tool permission policy
  HEARTBEAT.md                   # end-of-exploration checks
  project.json                   # auto-detected stack snapshot
.mcp.json                        # Memoire MCP wired to Claude Code
specs/                           # drop JSON specs here for complex explorations
generated/                       # memi generate target
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
memoire status    # workspace state
memoire doctor    # health check
memoire add <c>   # alternate path to install components
```

## Hard rules (also in `.claude/CLAUDE.md`)
- shadcn-first; never recreate a primitive that exists
- theme tokens only; **no hex literals anywhere**
- one focused change per turn for visual work
- UI animations <400ms, `prefers-reduced-motion` always honored
- never invent constraints the user didn't state
