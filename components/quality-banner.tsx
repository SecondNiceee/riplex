import { Check } from "lucide-react"

const points = [
  "Чёткое видео Full HD 1080p",
  "Кристально чистый звук",
  "Без водяных знаков и рекламы",
  "Доступно каждому участнику",
]

export function QualityBanner() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* subtle glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.22_0_0)_0%,transparent_70%)] blur-3xl"
          />

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-foreground">
            Качество видео
          </span>

          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Видео 1080p —{" "}
            <span className="text-muted-foreground">бесплатно</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Никаких платных тарифов ради нормальной картинки. Full HD доступно
            всем и сразу — просто начните звонок.
          </p>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
