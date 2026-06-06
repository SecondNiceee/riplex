"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface JoinCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoin: (roomCode: string) => void
}

function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function JoinCallDialog({ open, onOpenChange, onJoin }: JoinCallDialogProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  const clean = normalizeCode(value)
  const isValid = clean.length === 8

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const raw = e.target.value
    const upper = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 9)
    setValue(upper)
  }

  function handleJoin() {
    if (!isValid) {
      setError("Введите корректный код комнаты (8 символов).")
      return
    }
    onJoin(clean)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleJoin()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setValue(""); setError("") } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Войти по коду</DialogTitle>
          <DialogDescription>
            Введите код комнаты, который прислал организатор.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="XXXX-XXXX"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label="Код комнаты"
              aria-invalid={!!error}
              className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.2em] placeholder:tracking-normal"
            />
            {error && (
              <p className="text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="h-12 gap-2 rounded-full text-base font-semibold"
            onClick={handleJoin}
            disabled={!isValid}
          >
            <LogIn className="size-5" aria-hidden="true" />
            Войти в комнату
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
