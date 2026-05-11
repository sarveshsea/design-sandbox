# Design Soul — design2code.ground

## Purpose
A neutral, pre-warmed sandbox for design exploration on any project.
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

## Anti-Patterns
- No gradients unless data-driven
- No `rounded-full` on containers
- No color without semantic meaning
- No animation longer than 400ms for UI (cinematic excepted)
- **No hardcoded hex anywhere** — always reach for a token; if none exists, ask before inventing one
- No invented constraints the user didn't state

## Branching
One exploration per branch (`explore/<topic>`). `main` stays the empty baseline.
