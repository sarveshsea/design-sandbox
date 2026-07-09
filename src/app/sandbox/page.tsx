import { CheckCircle2, FileJson2, PackageCheck } from "lucide-react";

export default function Sandbox() {
  const checks = [
    ["diagnose", "Design debt scan with no write gate"],
    ["ux", "UX tenets and traps audit"],
    ["tokens", "CSS token extraction report"],
    ["shadcn", "Registry export and doctor"],
    ["mcp", "Generic no-Figma MCP config"],
    ["agent", "Universal Agent Skills dry-run"],
  ];

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">/sandbox</p>
            <h1 className="text-2xl font-semibold tracking-normal">Agent-ready UI canvas</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use this route for design-to-code spikes after memi has loaded the product memory, token context, and registry proof.
            </p>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium">
              <PackageCheck className="size-4" aria-hidden="true" />
              Pre-publish local proof
            </div>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs leading-5 text-secondary-foreground">
              <code>{`MEMI_BIN=../memi/dist/index.js pnpm verify`}</code>
            </pre>
          </div>
        </aside>

        <section className="rounded-md border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-5">
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">memi 2.4</p>
              <h2 className="text-xl font-semibold">Verification matrix</h2>
            </div>
            <FileJson2 className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {checks.map(([name, description]) => (
              <article key={name} className="rounded-md border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="font-mono text-sm">{name}</h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium">Token proof</p>
              <p className="mt-1 text-muted-foreground">generated/memi-proof/tokens</p>
            </div>
            <div>
              <p className="font-medium">Registry proof</p>
              <p className="mt-1 text-muted-foreground">public/r/registry.json</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
