import { ArrowRight, Boxes, Radar, ShieldCheck } from "lucide-react";
import Link from "next/link";

const proofItems = [
  {
    label: "memi evidence",
    value: "diagnose + UX audit + tokens",
  },
  {
    label: "agent memory",
    value: ".agents skills + MCP + suite manifest",
  },
  {
    label: "design output",
    value: "shadcn-first /sandbox composition",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center gap-10 px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="flex flex-col gap-6">
            <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
              <Radar className="size-4" aria-hidden="true" />
              memi v2 proof workspace
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-none text-foreground md:text-6xl">
                Interface understanding before design-to-code.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                A public sandbox for proving how memi, MCP, Agent Skills, Tailwind,
                shadcn, and product-design agents should work together before UI code
                moves into a real app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sandbox"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open sandbox
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="https://www.npmjs.com/package/@memi-design/cli"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                @memi-design/cli
                <Boxes className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="grid gap-3">
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-border bg-card p-4 text-card-foreground"
              >
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <ShieldCheck className="size-5 text-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-sm font-semibold">Evidence first</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Run memi diagnosis, UX traps, token extraction, and registry checks
              before scaffolding components.
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <Boxes className="size-5 text-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-sm font-semibold">Agent portable</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The same context is available through MCP, `.agents/skills`,
              Claude Code, Codex, Cursor, Hermes, OpenCode, and OpenClaw.
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <Radar className="size-5 text-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-sm font-semibold">Sandbox only</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Prove the design, verify it, then copy the pattern into the product
              repo when the direction is worth keeping.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
