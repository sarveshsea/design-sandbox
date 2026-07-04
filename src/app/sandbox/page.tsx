import {
  Activity,
  ArrowLeft,
  Blocks,
  CheckCircle2,
  CircleDashed,
  FileText,
  Gauge,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const runSteps = [
  ["Collect", "memi diagnose . --json", "App graph, routes, Tailwind drift"],
  ["Audit", "memi ux audit . --json", "UX tenets, traps, accessibility risk"],
  ["Extract", "memi tokens --from ./src --report", "Modes, aliases, token gaps"],
  ["Scaffold", "/sandbox <brief>", "shadcn-first composition"],
  ["Verify", "pnpm verify", "Typecheck, lint, build, no raw hex"],
];

const memorySources = [
  "README.md",
  "AGENTS.md",
  ".agents/skills",
  ".memoire/SOUL.md",
  "memoire.agent.yaml",
  ".mcp.json",
];

const handoffItems = [
  "Atomic level named for every extracted component",
  "Token-only Tailwind classes, no raw color literals",
  "UX findings connected to the final composition",
  "Registry export ready when a pattern should be reused",
];

export default function Sandbox() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Link>
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                design-sandbox / memi v2
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">
                Design evidence workbench
              </h1>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3 md:min-w-[32rem]">
            <StatusPill label="MCP" value="no-figma" />
            <StatusPill label="Skills" value=".agents ready" />
            <StatusPill label="Surface" value="/sandbox" />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr_0.9fr]">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Gauge className="size-5" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Run protocol</h2>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {runSteps.map(([title, command, detail], index) => (
                <div key={title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="grid size-7 place-items-center rounded-md bg-muted font-mono text-xs">
                      {index + 1}
                    </div>
                    {index < runSteps.length - 1 ? (
                      <div className="my-2 h-full w-px bg-border" />
                    ) : null}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">{title}</p>
                    <code className="mt-1 block rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      {command}
                    </code>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers3 className="size-5" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Interface model</h2>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                token-only
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <EvidencePanel
                icon={<Activity className="size-4" aria-hidden="true" />}
                title="App quality"
                value="Routes, states, layout debt"
                detail="Diagnose before editing so the agent knows the product surface."
              />
              <EvidencePanel
                icon={<ShieldCheck className="size-4" aria-hidden="true" />}
                title="UX audit"
                value="Tenets and traps"
                detail="Clarity, feedback, control, accessibility, trust, and recovery."
              />
              <EvidencePanel
                icon={<Blocks className="size-4" aria-hidden="true" />}
                title="Registry"
                value="shadcn output"
                detail="Export reusable registry items when a pattern graduates."
              />
              <EvidencePanel
                icon={<FileText className="size-4" aria-hidden="true" />}
                title="Research"
                value="Specs and FigJam"
                detail="Use research design when the brief needs evidence, not taste."
              />
            </div>

            <div className="mt-5 rounded-md border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">Current sandbox brief</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Replace this panel with the next exploration. Keep the scaffold in this
                route until the pattern is verified, then export the registry or copy
                the component into its destination repo.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <CircleDashed className="size-5" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Memory loaded</h2>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {memorySources.map((source) => (
                <div
                  key={source}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <CheckCircle2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-mono text-xs">{source}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Handoff requirements</h2>
            <div className="mt-4 grid gap-2">
              {handoffItems.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Next command</h2>
            <code className="mt-4 block rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
              pnpm memi:diagnose && pnpm memi:ux && pnpm verify
            </code>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Use this route as the visual target for browser checks after an agent
              changes the composition.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function EvidencePanel({
  icon,
  title,
  value,
  detail,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="font-mono text-xs uppercase">{title}</p>
      </div>
      <p className="mt-3 text-sm font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
