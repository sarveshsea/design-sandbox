import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-start gap-8 max-w-md px-8">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            design2code.ground
          </p>
          <h1 className="font-mono text-3xl tracking-tight">ready.</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            empty playground. shadcn + memoire + claude wired. drop a brief or screenshot,
            then run <code className="font-mono text-foreground">/challenge</code>.
          </p>
        </div>
        <Link
          href="/challenge"
          className="font-mono text-sm border border-border rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          → /challenge
        </Link>
      </div>
    </main>
  );
}
