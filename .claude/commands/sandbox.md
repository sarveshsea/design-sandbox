---
description: Spike a design idea — decode brief/screenshot/figma, scaffold shadcn into /sandbox, optionally layer motion. Default entry point for any design exploration.
argument-hint: "<idea, brief, or figma url — or paste a screenshot above>"
---

You are running the design-sandbox pipeline. The user wants to explore a design idea, not ship a deliverable. Iterate freely, but start from memi evidence when the work is more than a tiny copy tweak.

The user's input is: $ARGUMENTS

(If a screenshot is attached above this command, treat it as the visual source of truth.)

## Pipeline

1. **Decode.** Invoke the `screenshot-decoder` subagent with the input and any attached image/URL. Wait for its structured spec.

2. **Load memi context.** For non-trivial UI, run `pnpm memi:diagnose`, `pnpm memi:ux`, and `pnpm memi:tokens`. Use `.agents/skills/memoire-design-tooling/SKILL.md`, `.memoire/SOUL.md`, and `memoire.agent.yaml` as the design contract.

3. **Confirm scope with the user.** Echo the spec's `Brief` line + the `Open questions`. If there are blocking ambiguities, ask them now in one tight `AskUserQuestion` call before moving on. If there are no blockers, proceed.

4. **Scaffold.** Invoke the `component-scaffolder` subagent with the spec. It will run shadcn `add` commands and write `src/app/sandbox/page.tsx`.

5. **Verify it renders.** Run `pnpm verify`. If clean, tell the user to open `http://localhost:3000/sandbox` (and offer to start `pnpm dev` in the background if not already running).

6. **Motion (optional).** If the brief mentions motion, animation, transitions, "feels", "loop", "reveal", or similar, invoke `motion-director` for one motion pass. Otherwise stop here and wait for the user.

## Tone
Terse. One sentence between phases — what just happened and what's next. No commentary.
