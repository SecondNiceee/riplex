import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />
      <Hero />
    </main>
  )
}
