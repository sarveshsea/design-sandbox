# Agent Roles

These map to the Claude Code subagents in `.claude/agents/`. Memoire uses these as the
"team on standby" — invoked by the `/sandbox` flow or directly.

## screenshot-decoder
Read-only. Input: a screenshot, image URL, Figma node, or written brief.
Output: a structured spec (layout regions, component inventory mapped to shadcn primitives,
color/spacing observations, motion cues, open questions). **Never writes code.**

## component-scaffolder
Write. Input: a spec (from `screenshot-decoder` or the user directly).
Output: shadcn `add` commands + a single React composition in `src/app/sandbox/page.tsx`.
Enforces: shadcn-first, theme tokens only, no hex literals, atomic composition.

## motion-director
Write. Input: a static composition.
Output: minimal Framer Motion (or CSS) layer. Installs `framer-motion` on demand.
Enforces: <400ms UI animations, `prefers-reduced-motion` respected, one effect per turn.

## (reserved) token-engineer
Owns design tokens when an exploration demands a custom palette. Prefer extending CSS
variables in `src/app/globals.css` over inventing a new system.

## (reserved) dataviz-specialist
Owns chart specs when an exploration involves data. Prefer Recharts; reach for D3 only
if the brief explicitly requires custom interactions.
