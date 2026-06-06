import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Company
          </a>
        </nav>
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Sign in
        </Button>
      </div>
    </header>
  )
}
