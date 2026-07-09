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
- memi MCP available as `mcp__memoire__*`
- Proof gate: `pnpm verify`
- Pre-publish local proof: `MEMI_BIN=../memi/dist/index.js pnpm verify`

## Pointers for non-Claude tools
- Codex / Cursor / OpenCode: read this file + `.memoire/SOUL.md` + `.memoire/AGENTS.md`
- The memi CLI/MCP package is `@memi-design/cli@2.4.0`.
- Use `memi mcp config --target generic` to verify the no-Figma MCP command before configuring a client.
