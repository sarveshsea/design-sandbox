# Heartbeat Tasks

Light checks for an interview playground — most heartbeat work is overkill here.

## Per challenge (run once at the end, before screen-share wrap)
- [ ] `pnpm typecheck` clean
- [ ] No hardcoded hex in `src/app/challenge/**` (grep `#[0-9a-fA-F]{3,6}`)
- [ ] Reduced-motion path doesn't break the layout
- [ ] Page actually renders at `/challenge` in the browser

## Skipped intentionally
- Drift checks, spec backups, Figma sync — irrelevant for one-hour challenges
