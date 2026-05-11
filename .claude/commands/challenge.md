---
description: Take a brief or screenshot and run the full design-challenge pipeline (decode → scaffold → optionally motion). Default entry point during the interview.
argument-hint: "<brief or paste screenshot above>"
---

You are running the design-challenge pipeline.

The user's brief is: $ARGUMENTS

(If a screenshot is attached above this command, treat it as the visual source of truth.)

## Pipeline

1. **Decode.** Invoke the `screenshot-decoder` subagent with the brief and any attached image/URL. Wait for its structured spec.

2. **Confirm scope with the user.** Echo the spec's `Brief` line + the `Open questions`. If there are blocking ambiguities, ask them now in one tight `AskUserQuestion` call before moving on. If there are no blockers, proceed silently.

3. **Scaffold.** Invoke the `component-scaffolder` subagent with the spec. It will run shadcn `add` commands and write `src/app/challenge/page.tsx`.

4. **Verify it renders.** Run `pnpm typecheck`. If clean, tell the user to open `http://localhost:3000/challenge` (and offer to start `pnpm dev` in the background if not already running).

5. **Motion (optional).** If the brief mentions motion, animation, transitions, "feels", "loop", "reveal", or similar — invoke `motion-director` for one motion pass. Otherwise stop here and wait for the user.

## Tone
Terse. The user is on a clock. One sentence between phases — what just happened and what's next. No commentary.
