# Tool Permissions

## Safe (all agents)
- Read specs, tokens, design system
- Analyze and report
- Generate code to output/
- Run `pnpm memi:diagnose`, `pnpm memi:ux`, `pnpm memi:tokens`
- Run `pnpm typecheck`, `pnpm lint`, `pnpm check:hex`
- Run `memi agent install --dry-run --json --project .`

## Gated (requires confirmation)
- Write/modify specs
- Update design tokens
- Push to Figma
- Delete files
- Install new runtime packages beyond shadcn primitives

## Blocked
- Modify .memoire/SOUL.md (human-only)
- Delete specs without backup
- Force-push to Figma without screenshot validation
- Start long-running MCP or dev servers without telling the user which port is active
