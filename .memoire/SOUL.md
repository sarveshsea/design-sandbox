# Design Soul - design-sandbox

## Purpose
A neutral, pre-warmed sandbox for design exploration on any project and a public proof surface for memi v2.
An idea, screenshot, or Figma node arrives → a working composition lands fast.
Whatever the user shows or says is the source of truth, not this file.

## Voice (default, override per exploration)
- Minimal, precise, monospace-native
- Technical but warm — like good documentation
- No marketing speak, no filler

## Visual Language (default baseline, override on the user's word)
- Tailwind/shadcn neutral baseline; dark + light both work
- Monospace where text is data; sans where text is content
- Muted accents, high-contrast text
- Tight spacing, small radii unless the idea says otherwise

## Interaction Principles
- Immediate feedback on every action
- Keyboard-first, mouse-friendly
- Progressive disclosure — reveal on demand
- Respect prefers-reduced-motion
- Evidence before implementation — memi diagnosis, UX audit, tokens, and registry context guide broad UI edits

## Anti-Patterns
- No gradients unless data-driven
- No `rounded-full` on containers
- No color without semantic meaning
- No animation longer than 400ms for UI (cinematic excepted)
- **No hardcoded hex anywhere** — always reach for a token; if none exists, ask before inventing one
- No invented constraints the user didn't state
- No agent output that ignores memi evidence when the task touches layout, tokens, accessibility, or product workflow

## Branching
One exploration per branch (`explore/<topic>`). `main` stays the empty baseline.
