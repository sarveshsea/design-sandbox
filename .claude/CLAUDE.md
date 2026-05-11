# design2code.ground — design sandbox operating manual

## What this repo is
A general-purpose design sandbox. Empty Next.js 16 + Tailwind 4 + shadcn surface, pre-warmed
with Memoire and Claude Code subagents. Use it to explore design ideas for any project —
sketch concepts, decode screenshots, prototype flows, prove out a UI before pulling it into
the real codebase. Not tied to any specific deliverable or deadline.

You scaffold into `src/app/sandbox/page.tsx`. Everything else is plumbing.

## The default loop
1. User pastes a screenshot, drops a Figma URL, or types an idea.
2. If there's an image or URL → hand it to the **screenshot-decoder** subagent first.
3. Take the spec (or the user's brief) → invoke **component-scaffolder**.
4. Once static composition is rendering → invoke **motion-director** if motion is part of the idea.
5. Iterate. One focused change per turn for visual work.

## Hard rules
- **shadcn-first.** Before hand-rolling any component, try `pnpm dlx shadcn@latest add <name>`. If unsure which to pull, list them with `pnpm dlx shadcn@latest add` and grep.
- **Theme tokens only.** Never hardcode hex. Use Tailwind utility classes that reference CSS variables (`bg-background`, `text-foreground`, etc.) or extend variables in `src/app/globals.css`.
- **Scaffold target.** Default route is `src/app/sandbox/page.tsx`. Don't sprawl across files unless the idea is multi-screen.
- **Animation budget.** UI animations <400ms. Always honor `prefers-reduced-motion`.
- **One change per turn for visual work.** No stacking effects before the user verifies.
- **Don't invent constraints the user didn't state.** Ask if ambiguous.

## What's available
- **shadcn** registry — all primitives one `add` away
- **Memoire MCP** — `mcp__memoire__*` tools for tokens, diagnose, generate, registry search
- **Lucide icons** — pre-installed
- **Tailwind 4** — CSS variables already wired in `globals.css`

## What's NOT pre-installed (add on demand)
- `framer-motion` — motion-director will install when needed
- `recharts` — install when an idea involves charts
- Remotion — install only if the idea explicitly involves video composition

## Branching
Each exploration on its own branch (`explore/<topic>`). `main` stays the empty baseline.
Reset = delete the branch.

## Verification before claiming done (per global rules)
- `pnpm typecheck` exit 0
- Actually loaded `/sandbox` in the browser and confirmed render
- No `#[0-9a-f]{3,6}` hex literals in `src/app/sandbox/**`

## Memoire as the design memory
- `.memoire/SOUL.md` — sandbox voice (override per exploration in chat, not in the file)
- `.memoire/AGENTS.md` — the agent roster mirrored in `.claude/agents/`
- `.memoire/HEARTBEAT.md` — light end-of-exploration checks
- `specs/` — drop a JSON spec here when an exploration is complex enough to warrant one
- `generated/` — Memoire's `memi generate` target; usually overlaps with `src/components/` so prefer scaffolding straight into `src/`
