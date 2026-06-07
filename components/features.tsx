import { ShieldOff, MonitorPlay, Infinity, Download, Lock, Zap } from "lucide-react"

const features = [
  {
    icon: ShieldOff,
    title: "Работает без VPN",
    description:
      "Прямое соединение между участниками. Никаких блокировок, прокси и обходных путей — просто откройте ссылку.",
  },
  {
    icon: Infinity,
    title: "Без ограничений по времени",
    description:
      "Ни таймеров, ни автоотключений на 40 минутах. Разговаривайте столько, сколько нужно.",
  },
  {
    icon: Download,
    title: "Без установки приложений",
    description:
      "Всё работает прямо в браузере. Не нужно ничего скачивать ни вам, ни вашим собеседникам.",
  },
  {
    icon: Lock,
    title: "Приватность по умолчанию",
    description:
      "Соединения шифруются, а комнаты доступны только по коду. Ваши разговоры остаются вашими.",
  },
  {
    icon: Zap,
    title: "Подключение в один клик",
    description:
      "Создайте комнату или войдите по коду за пару секунд. Без регистрации и долгих настроек.",
  },
  {
    icon: MonitorPlay,
    title: "Демонстрация экрана",
    description:
      "Делитесь экраном в высоком качестве для презентаций, созвонов и совместной работы.",
  },
]

export function Features() {
  return (
    <section className="relative border-t border-border px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            Преимущества
          </span>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Всё для общения. Ничего лишнего.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Видеозвонки, которые просто работают — где угодно и без компромиссов.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col gap-4 bg-card p-8 transition-colors hover:bg-secondary/40"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-secondary/50 text-foreground transition-colors group-hover:bg-secondary">
                <feature.icon className="size-6" strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
