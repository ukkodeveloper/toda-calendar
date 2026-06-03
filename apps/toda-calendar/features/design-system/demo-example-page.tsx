import Link from "next/link"

import type { DemoExampleMetadata } from "./demo-types"

function statusLabel(status: DemoExampleMetadata["status"]) {
  switch (status) {
    case "approved":
      return "Approved"
    case "ready":
      return "Ready for review"
    case "draft":
      return "Draft"
  }
}

export function DemoExamplePage({ demo }: { demo: DemoExampleMetadata }) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#f7f1e9_0%,#eff2f5_46%,#f8f8f5_100%)] px-4 py-[max(1rem,calc(env(safe-area-inset-top)+1rem))] text-foreground sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-5">
          <header className="rounded-[2rem] border border-white/64 bg-white/76 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex min-h-10 items-center rounded-full border border-black/6 bg-white/76 px-4 text-sm font-semibold text-foreground/74 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
                href="/design-system"
              >
                Design system
              </Link>
              <span className="inline-flex min-h-8 items-center rounded-full bg-foreground px-3 text-xs font-semibold text-background">
                {statusLabel(demo.status)}
              </span>
            </div>
            <div className="mt-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase text-foreground/48">
                {demo.sprintId} / {demo.featureSlug}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-5xl">
                {demo.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-foreground/66">
                {demo.summary}
              </p>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {demo.entryPoints.map((entryPoint) => (
              <article
                key={entryPoint.label}
                className="rounded-[1.6rem] border border-white/64 bg-white/68 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
              >
                <p className="text-xs font-semibold uppercase text-foreground/42">
                  Entry
                </p>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  {entryPoint.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground/62">
                  {entryPoint.location}
                </p>
                <p className="mt-4 text-sm leading-6 text-foreground/74">
                  {entryPoint.userIntent}
                </p>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-foreground/42">
                User flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                From entry to completion
              </h2>
            </div>
            <div className="grid gap-3">
              {demo.flowSteps.map((step, index) => (
                <article
                  key={`${step.label}-${step.screen}`}
                  className="grid gap-4 rounded-[1.6rem] border border-white/64 bg-white/70 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.055)] backdrop-blur-2xl sm:grid-cols-[3.5rem_minmax(0,1fr)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {step.label}
                      </h3>
                      <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-foreground/56">
                        {step.screen}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm leading-6 text-foreground/66 md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-foreground/82">
                          User action:
                        </span>{" "}
                        {step.userAction}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/82">
                          System response:
                        </span>{" "}
                        {step.systemResponse}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-foreground/42">
                Example screens
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Review the route as a small product scenario
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {demo.screens.map((screen) => (
                <article
                  key={screen.name}
                  className="overflow-hidden rounded-[1.8rem] border border-white/64 bg-white/72 shadow-[0_18px_42px_rgba(15,23,42,0.07)] backdrop-blur-2xl"
                >
                  <div className="border-b border-black/6 bg-white/68 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-foreground/42">
                      {screen.role}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      {screen.name}
                    </h3>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="rounded-[1.2rem] border border-black/6 bg-[var(--calendar-app-bg)] p-4">
                      <div className="h-2 w-16 rounded-full bg-foreground/12" />
                      <div className="mt-5 grid gap-2">
                        <div className="h-8 rounded-[0.8rem] bg-white/86" />
                        <div className="h-20 rounded-[1rem] bg-white/62" />
                        <div className="h-11 rounded-full bg-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm leading-6 text-foreground/66">
                      <p>
                        <span className="font-semibold text-foreground/82">
                          Primary:
                        </span>{" "}
                        {screen.primaryAction}
                      </p>
                      {screen.secondaryAction ? (
                        <p>
                          <span className="font-semibold text-foreground/82">
                            Secondary:
                          </span>{" "}
                          {screen.secondaryAction}
                        </p>
                      ) : null}
                    </div>
                    <ul className="space-y-2 text-sm leading-6 text-foreground/62">
                      {screen.stateNotes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/28"
                          />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-[1.6rem] border border-white/64 bg-white/72 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
            <p className="text-xs font-semibold uppercase text-foreground/42">
              Design system usage
            </p>
            <div className="mt-4 space-y-4">
              <ReviewList title="Components" items={demo.designSystem.components} />
              <ReviewList title="Tokens" items={demo.designSystem.tokens} />
              <ReviewList title="Notes" items={demo.designSystem.notes} />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/64 bg-white/72 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
            <p className="text-xs font-semibold uppercase text-foreground/42">
              Review checklist
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/68">
              {demo.reviewChecklist.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-foreground/14 text-[0.6rem] text-foreground/54">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-foreground/64">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
