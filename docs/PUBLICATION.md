# Public Repo Playbook

Use this checklist before linking `design-sandbox` from memi launch posts, npm docs, MCP directories, or GitHub profile surfaces.

## GitHub description

```text
memi-ready Next.js, Tailwind, shadcn, MCP, and Agent Skills sandbox for interface understanding and design-to-code exploration.
```

## Topics

```text
interface-understanding
design-systems
ai-coding-agents
shadcn
tailwindcss
mcp
agent-skills
codex
claude-code
ux-audit
figma-to-code
design-engineering
nextjs
```

## Social tags

```text
#InterfaceUnderstanding #DesignSystems #AICodingAgents #shadcn #TailwindCSS #MCP #AgentSkills #Codex #ClaudeCode #UXAudit #FigmaToCode #DesignEngineering
```

## Link targets

- npm: `https://www.npmjs.com/package/@memi-design/cli`
- memi repo: `https://github.com/sarveshsea/memi`
- design sandbox: `https://github.com/sarveshsea/design-sandbox`
- MCP server name: `io.github.sarveshsea/memi`
- Agent Skills install: `npx skills add sarveshsea/memi --skill memoire-design-tooling`

## Launch proof commands

```bash
pnpm install
pnpm verify
pnpm memi:agent
pnpm memi:diagnose
pnpm memi:ux
pnpm memi:tokens
```

## Acceptance criteria

- README first screen says this is the public proof repo for memi v2.
- `/sandbox` is not blank.
- `.agents/skills/memoire-design-tooling/SKILL.md` exists.
- `.mcp.json` uses `memi mcp start --no-figma`.
- `memoire.agent.yaml` includes design, readiness, research, registry, cost, and compatibility recipes.
- `pnpm verify` passes.
- No stale `@sarveshsea/memoire` install command remains.
