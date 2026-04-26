import type { Metadata } from "next"
import Link from "next/link"

import { getDemoExamples } from "@/features/design-system/read-demo-examples"

export const metadata: Metadata = {
  title: "Design System Demo Review",
  description: "Sprint demo review surface for Toda Calendar.",
}

export default function DesignSystemReviewPage() {
  const examples = getDemoExamples()

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#f7f1e9_0%,#eff2f5_46%,#f8f8f5_100%)] px-4 py-[max(1rem,calc(env(safe-area-inset-top)+1rem))] text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-[2rem] border border-white/64 bg-white/76 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-semibold text-foreground/48 uppercase">
            Toda sprint demos
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-5xl">
                Design system review
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/66">
                Review each sprint demo as a small product scenario: where the
                feature starts, how the user moves through it, and whether the
                implementation stays inside Toda&apos;s shared design language.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-black/6 bg-white/66 p-4">
              <p className="text-sm font-semibold text-foreground">
                Demo contract
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/62">
                <li>Entry point is visible.</li>
                <li>Core user flow is clickable or clearly staged.</li>
                <li>Completion and escape states are represented.</li>
                <li>Shared components and tokens are named.</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground/42 uppercase">
                  Examples
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Active demo pages
                </h2>
              </div>
              <span className="rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-foreground/56 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                {examples.length} total
              </span>
            </div>

            {examples.length > 0 ? (
              <div className="grid gap-3">
                {examples.map((example) => (
                  <Link
                    key={example.slug}
                    className="group grid gap-4 rounded-[1.6rem] border border-white/64 bg-white/70 p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.055)] backdrop-blur-2xl transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 active:scale-[0.995] sm:grid-cols-[minmax(0,1fr)_12rem]"
                    href={example.href}
                  >
                    <span className="min-w-0">
                      <span className="text-xs font-semibold text-foreground/42 uppercase">
                        {example.sprintId} / {example.featureSlug}
                      </span>
                      <span className="mt-2 block text-xl font-semibold text-foreground">
                        {example.title}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-foreground/62">
                        {example.summary}
                      </span>
                    </span>
                    <span className="flex flex-col justify-between gap-4 rounded-[1.1rem] border border-black/6 bg-white/68 p-3">
                      <span className="text-xs font-semibold text-foreground/42 uppercase">
                        Flow
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {example.flowSteps.length} steps ·{" "}
                        {example.screens.length} screens
                      </span>
                      <span className="text-sm text-foreground/52 group-hover:text-foreground/72">
                        Open example
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-foreground/16 bg-white/50 p-6 text-sm leading-6 text-foreground/62">
                No sprint demos have been added yet.
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-[1.6rem] border border-white/64 bg-white/72 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
              <p className="text-xs font-semibold text-foreground/42 uppercase">
                Review gates
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/68">
                <li>Does the entry point feel discoverable?</li>
                <li>Do screen transitions match the intended user flow?</li>
                <li>Are design-system components used consistently?</li>
                <li>Is any UX awkward before implementation starts?</li>
              </ul>
            </section>

            <section className="rounded-[1.6rem] border border-white/64 bg-white/72 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
              <p className="text-xs font-semibold text-foreground/42 uppercase">
                Add a demo
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground/64">
                Create a unique folder under
                <span className="mx-1 rounded-md bg-black/5 px-1.5 py-0.5 font-mono text-[0.78rem]">
                  app/design-system/examples
                </span>
                with a page and demo metadata.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
