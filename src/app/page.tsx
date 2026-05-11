import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-start gap-8 max-w-md px-8">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            design2code.ground
          </p>
          <h1 className="font-mono text-3xl tracking-tight">sandbox.</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            shadcn + memoire + claude wired and waiting. drop a brief, screenshot, or
            figma url, then run <code className="font-mono text-foreground">/sandbox</code> to
            spike a design idea for any project.
          </p>
        </div>
        <Link
          href="/sandbox"
          className="font-mono text-sm border border-border rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          → /sandbox
        </Link>
      </div>
    </main>
  );
}
