# Heartbeat Tasks

Light checks for an exploration sandbox — most heartbeat work is overkill here.

## Per exploration (run before merging or sharing)
- [ ] `pnpm typecheck` clean
- [ ] No hardcoded hex in `src/app/sandbox/**` (grep `#[0-9a-fA-F]{3,6}`)
- [ ] Reduced-motion path doesn't break the layout
- [ ] Page actually renders at `/sandbox` in the browser

## Skipped intentionally
- Drift checks, spec backups, Figma sync — irrelevant for short design spikes
