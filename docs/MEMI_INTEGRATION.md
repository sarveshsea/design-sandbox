# memi Integration Architecture

This repo is the smallest public proof that memi v2 can wire design evidence into a real app workspace.

## Architecture

```text
User brief / screenshot / Figma URL
  -> memi evidence commands
  -> Agent Skills / MCP context
  -> shadcn-first sandbox scaffold
  -> verification
  -> registry export or product handoff
```

## Surfaces

| Surface | File | Purpose |
| --- | --- | --- |
| App shell | `src/app/page.tsx` | Public proof landing page. |
| Sandbox canvas | `src/app/sandbox/page.tsx` | The route agents rewrite during explorations. |
| Design memory | `.memoire/*` | Voice, agent roster, tool policy, heartbeat checks. |
| Agent contract | `memoire.agent.yaml` | Recipes, harnesses, skills, and memory sources. |
| Universal skill | `.agents/skills/memoire-design-tooling/SKILL.md` | Cross-agent memi v2 protocol. |
| MCP config | `.mcp.json` | Figma-independent memi MCP server. |
| Claude workflow | `.claude/*` | Claude Code slash command and subagents. |

## Cost model

Default path is local and cheap:

- No hosted service required.
- No Figma required for first-run proof.
- No model calls required for `memi diagnose`, `memi ux audit`, token extraction, or no-hex verification.
- MCP runs locally over stdio with `memi mcp start --no-figma`.
- The sandbox route can be verified with `pnpm verify`.

Costs appear only when the user opts into them:

- Agent model usage in Codex, Claude Code, Cursor, Hermes, OpenCode, or OpenClaw.
- Figma API usage if `FIGMA_TOKEN` and `FIGMA_FILE_KEY` are configured.
- Extra packages such as charting, animation, Remotion, or browser automation.

## Compatibility

| Tool | Integration |
| --- | --- |
| Codex | Reads `AGENTS.md` and `.agents/skills/memoire-design-tooling/SKILL.md`. |
| Claude Code | Uses `.claude/commands/sandbox.md`, `.claude/agents/*`, and `.mcp.json`. |
| Cursor | Can read `.mcp.json` and the README workflow. |
| OpenCode | Reads workspace instructions and `.agents/skills`. |
| Hermes | Uses the memi skill protocol and suite manifest. |
| OpenClaw | Uses workspace skills and memi CLI commands. |
| Generic MCP clients | Start with `memi mcp start --no-figma`. |

## Upgrade memi

After publishing a new memi package:

```bash
npm i -g @memi-design/cli@latest
memi agent install universal --project . --force
pnpm memi:agent
pnpm verify
```

If the public package is not published yet, use the local built binary from the memi repo:

```bash
node ../ark/dist/index.js agent install universal --project . --force
```

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm check:hex
pnpm build
pnpm memi:agent
```

Use browser verification for visual changes to `src/app/sandbox/page.tsx`.
