# design2code.ground — playground operating manual

## What this repo is
An empty, pre-warmed Next.js 16 + Tailwind 4 + shadcn surface for design-challenge interviews.
You scaffold into `src/app/challenge/page.tsx`. Everything else is plumbing.

## The default loop
1. User pastes a screenshot, drops a Figma URL, or types a brief.
2. If there's an image or URL → hand it to the **screenshot-decoder** subagent first.
3. Take the spec (or the user's brief) → invoke **component-scaffolder**.
4. Once static composition is rendering → invoke **motion-director** if motion is part of the brief.
5. Iterate. One focused change per turn for visual work.

## Hard rules
- **shadcn-first.** Before hand-rolling any component, try `pnpm dlx shadcn@latest add <name>`. If unsure which to pull, list them with `pnpm dlx shadcn@latest add` and grep.
- **Theme tokens only.** Never hardcode hex. Use Tailwind utility classes that reference CSS variables (`bg-background`, `text-foreground`, etc.) or extend variables in `src/app/globals.css`.
- **Scaffold target.** Default route is `src/app/challenge/page.tsx`. Don't sprawl across files unless the brief is multi-screen.
- **Animation budget.** UI animations <400ms. Always honor `prefers-reduced-motion`.
- **One change per turn for visual work.** No stacking effects before the user verifies.
- **Never invent constraints the recruiter didn't state.** Ask if ambiguous.

## What's available
- **shadcn** registry — all primitives one `add` away
- **Memoire MCP** — `mcp__memoire__*` tools for tokens, diagnose, generate, registry search
- **Lucide icons** — pre-installed
- **Tailwind 4** — CSS variables already wired in `globals.css`

## What's NOT pre-installed (add on demand)
- `framer-motion` — motion-director will install when needed
- `recharts` — install when a brief involves charts
- Remotion — install only if the brief explicitly demands video composition

## Reset between challenges
```bash
git checkout main
git branch -D challenge/<previous>
git checkout -b challenge/<company>-<YYYY-MM-DD>
```
The `main` branch should always be the empty playground.

## Verification before claiming done (per global rules)
- `pnpm typecheck` exit 0
- Actually loaded `/challenge` in the browser and confirmed render
- No `#[0-9a-f]{3,6}` hex literals in `src/app/challenge/**`

## Memoire as the design memory
- `.memoire/SOUL.md` — playground voice (override per challenge in chat, not in the file)
- `.memoire/AGENTS.md` — the agent roster mirrored in `.claude/agents/`
- `.memoire/HEARTBEAT.md` — end-of-challenge checks
- `specs/` — drop a JSON spec here when a challenge is complex enough to warrant one
- `generated/` — Memoire's `memi generate` target; usually overlaps with `src/components/` so prefer scaffolding straight into `src/`
