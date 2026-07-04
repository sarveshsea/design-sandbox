# Heartbeat Tasks

Light checks for an exploration sandbox — most heartbeat work is overkill here.

## Per exploration (run before merging or sharing)
- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] No hardcoded hex in `src/app/sandbox/**` (grep `#[0-9a-fA-F]{3,6}`)
- [ ] `pnpm check:hex` clean
- [ ] memi evidence captured or intentionally skipped for a tiny change
- [ ] Reduced-motion path doesn't break the layout
- [ ] Page actually renders at `/sandbox` in the browser
- [ ] Final handoff names commands run and artifacts produced

## Skipped intentionally
- Drift checks, spec backups, Figma sync — irrelevant for short design spikes
