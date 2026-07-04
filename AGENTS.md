<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# design-sandbox

General design sandbox and memi v2 proof workspace. The full Claude Code operating manual is **`.claude/CLAUDE.md`**. Universal agent instructions also live in **`.agents/skills/memoire-design-tooling/SKILL.md`**.

## Quick orientation
- Scaffold target: `src/app/sandbox/page.tsx`
- shadcn-first; theme tokens only; no hex literals
- Subagents: `screenshot-decoder` → `component-scaffolder` → `motion-director`
- Slash command: `/sandbox "<idea>"` (or paste screenshot then `/sandbox`)
- memi MCP available as `mcp__memoire__*`
- Pre-patch evidence commands: `pnpm memi:diagnose`, `pnpm memi:ux`, `pnpm memi:tokens`
- Verification command: `pnpm verify`

## Pointers for non-Claude tools
- Codex / Cursor / OpenCode / Hermes / OpenClaw: read this file, `.agents/skills/memoire-design-tooling/SKILL.md`, `.memoire/SOUL.md`, `.memoire/AGENTS.md`, and `memoire.agent.yaml`.
- The memi daemon (`memi daemon start --project . --port auto`) exposes the same context via MCP.
- Keep Figma optional. Default MCP path is `memi mcp start --no-figma`.
