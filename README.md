# design2code.ground

Empty agentic-design playground. Pre-warmed for one-hour design-challenge interviews.

## Stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind 4** + **shadcn/ui** (radix-nova base, neutral, CSS variables) — *config only, zero components installed*
- **Memoire** (`@sarveshsea/memoire`) — design memory + MCP server for Claude Code
- **Claude Code** subagents: `screenshot-decoder`, `component-scaffolder`, `motion-director`

## Workflow

```
brief or screenshot → /challenge → page.tsx renders
```

In Claude Code:

```
/challenge "build a settings panel with a theme toggle"
```

Or paste a screenshot, then:

```
/challenge
```

The `/challenge` slash command runs:
1. **screenshot-decoder** → structured spec (layout, components, tokens, motion)
2. **component-scaffolder** → `pnpm dlx shadcn add ...` + writes `src/app/challenge/page.tsx`
3. **motion-director** (only if motion is in scope) → installs `framer-motion`, layers one motion pass

Open `http://localhost:3000/challenge` to see the result.

## Reset between challenges

```bash
git checkout main
git checkout -b challenge/<company>-$(date +%Y-%m-%d)
```

`main` always stays empty. Each challenge is its own branch — delete when done.

## What's in the box

```
.claude/                         # Claude Code agentic layer
  CLAUDE.md                      # operating manual
  agents/                        # 3 specialized subagents
    screenshot-decoder.md
    component-scaffolder.md
    motion-director.md
  commands/challenge.md          # /challenge slash command
  settings.json                  # pre-allowed shell calls (no popups mid-challenge)
.memoire/                        # Memoire design memory
  SOUL.md                        # voice + visual baseline
  AGENTS.md                      # agent roster (mirrors .claude/agents/)
  TOOLS.md                       # tool permission policy
  HEARTBEAT.md                   # end-of-challenge checks
  project.json                   # auto-detected stack snapshot
.mcp.json                        # Memoire MCP wired to Claude Code
specs/                           # drop JSON specs here for complex challenges
generated/                       # memi generate target
research/                        # for memi research output
prototype/                       # scratch space
src/
  app/
    page.tsx                     # landing → /challenge
    challenge/page.tsx           # the canvas (currently blank)
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
- never invent constraints the recruiter didn't state
