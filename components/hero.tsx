import { Button } from "@/components/ui/button"
import { Video, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* subtle radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.22_0_0)_0%,transparent_70%)] blur-3xl"
      />
      {/* faint grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-foreground" />
        </span>
        В эфире — без установки приложений
      </span>

      <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
        Звонки, которые просто работают.
      </h1>

      <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        Riplex дарит кристально чистые видеозвонки в один клик. Без аккаунтов,
        без комнат ожидания, без лишних действий — просто нажмите «Начать» и вы
        уже на связи.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button
          size="lg"
          className="group h-14 gap-2.5 rounded-full px-8 text-base font-semibold"
        >
          <Video className="size-5" strokeWidth={2.25} aria-hidden="true" />
          Начать звонок
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-full px-6 text-base text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Войти по коду
        </Button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Нам доверяют команды, совершающие более 2 млн звонков каждый месяц.
      </p>
    </section>
  )
}
