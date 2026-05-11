# Design Soul — design2code playground

## Purpose
A neutral, pre-warmed surface for design-challenge interviews. Brief arrives → scaffold lands fast.
Whatever the recruiter shows or says is the source of truth, not this file.

## Voice (default, override per challenge)
- Minimal, precise, monospace-native
- Technical but warm — like good documentation
- No marketing speak, no filler

## Visual Language (default baseline, override on the recruiter's word)
- Tailwind/shadcn neutral baseline; dark + light both work
- Monospace where text is data; sans where text is content
- Muted accents, high-contrast text
- Tight spacing, small radii unless the brief says otherwise

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
- No invented constraints the recruiter didn't state

## Reset between challenges
Branch per challenge (`challenge/<company>-<date>`). Reset = delete branch.
