<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# design2code.ground

General design sandbox. The full operating manual is **`.claude/CLAUDE.md`**.

## Quick orientation
- Scaffold target: `src/app/sandbox/page.tsx`
- shadcn-first; theme tokens only; no hex literals
- Subagents: `screenshot-decoder` → `component-scaffolder` → `motion-director`
- Slash command: `/sandbox "<idea>"` (or paste screenshot then `/sandbox`)
- Memoire MCP available as `mcp__memoire__*`

## Pointers for non-Claude tools
- Codex / Cursor / OpenCode: read this file + `.memoire/SOUL.md` + `.memoire/AGENTS.md`
- The Memoire daemon (`memi daemon start`) exposes the same context via MCP
