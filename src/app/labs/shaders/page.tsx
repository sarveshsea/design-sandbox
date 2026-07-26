import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ShaderLab } from "./components/organisms/shader-lab";

export const metadata: Metadata = {
  title: "Shader field notes | design-sandbox",
  description:
    "An original WebGL2 proof for deterministic dithering, ripple distortion, accessible controls, and honest audit evidence.",
};

/** Atomic Design: page — the complete shader design-engineering proof route. */
export default function ShaderLabPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-[96rem] space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <header className="space-y-6 border-b border-border pb-7">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to design-sandbox
          </Link>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,42rem)_1fr] lg:items-end">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                page / labs / original implementation
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Shader field notes
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Compare a procedural field before and after deterministic dither.
                Every control is auditable, the fallback is explicit, and no
                external shader code or media is embedded.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
              <div className="bg-card p-4">
                <dt className="text-xs text-muted-foreground">Renderer</dt>
                <dd className="mt-1 font-mono">WebGL2 / GLSL ES 3</dd>
              </div>
              <div className="bg-card p-4">
                <dt className="text-xs text-muted-foreground">Future adapter</dt>
                <dd className="mt-1 font-mono">WebGPU / WGSL</dd>
              </div>
            </dl>
          </div>
        </header>

        <ShaderLab />

        <footer className="grid gap-3 border-t border-border pt-6 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
          <p>
            Ordered and seeded-noise dithering are implemented locally from
            their mathematical definitions. The scene and media are procedural.
          </p>
          <p className="sm:text-right">
            Submission timing measures main-thread WebGL calls, not GPU time.
            Exported evidence marks unassessed dimensions instead of inferring
            them.
          </p>
        </footer>
      </div>
    </main>
  );
}
