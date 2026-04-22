import Link from "next/link"

export default function Page() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(255,255,255,0.66)_28%,transparent_56%),linear-gradient(180deg,#f6f1ea_0%,#eef3f6_45%,#f8f8f6_100%)] text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.88),transparent_46%),radial-gradient(circle_at_78%_14%,rgba(255,209,163,0.3),transparent_28%),radial-gradient(circle_at_52%_0%,rgba(255,151,138,0.12),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-4rem] bottom-[12rem] h-52 w-52 rounded-full bg-[rgba(255,255,255,0.5)] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center px-5 pt-[max(2rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] sm:px-8 lg:px-10">
        <section className="w-full max-w-2xl rounded-[2rem] border border-white/60 bg-white/62 px-6 py-10 text-center shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-10 sm:py-14">
          <div className="inline-flex rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-foreground/52 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            Toda Calendar
          </div>
          <h1 className="mt-6 text-[clamp(2.4rem,7vw,4.8rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-foreground">
            환영합니다 토다 캘린더입니다
          </h1>
          <p className="mt-5 text-base leading-7 text-foreground/66 sm:text-lg">
            오늘의 기록과 한 달의 흐름을 차분하게 이어가는 캘린더로 들어가 보세요.
          </p>

          <div className="mt-10">
            <Link
              href="/calendar"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              캘린더로 이동
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
