"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from "lucide-react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { VideoTile } from "@/components/video-tile"
import { useMediasoup } from "@/hooks/use-mediasoup"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDisplayName(): string {
  if (typeof window === "undefined") return "Гость"
  return sessionStorage.getItem("riplexo_display_name") ?? "Гость"
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>
  searchParams: Promise<{ create?: string }>
}) {
  const { roomId } = use(params)
  const { create } = use(searchParams)
  const router = useRouter()
  const displayName = getDisplayName()

  const {
    status,
    error,
    peers,
    localStream,
    isMicMuted,
    isCamOff,
    toggleMic,
    toggleCam,
    leave,
  } = useMediasoup(roomId, displayName, create === "true")

  const [copied, setCopied] = useState(false)

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomId])

  const handleLeave = useCallback(() => {
    leave()
    router.push("/")
  }, [leave, router])

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------
  if (status === "idle" || status === "connecting") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
        <p className="text-sm text-muted-foreground">Подключение к комнате {roomId}…</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          На главную
        </Button>
      </div>
    )
  }

  if (status === "disconnected") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">Вы покинули комнату</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          На главную
        </Button>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Active call
  // -------------------------------------------------------------------------
  const allPeers = [...peers.values()]
  const totalTiles = allPeers.length + 1 // +1 for local

  // Grid layout based on participant count
  const gridClass =
    totalTiles === 1
      ? "grid-cols-1"
      : totalTiles === 2
        ? "grid-cols-2"
        : totalTiles <= 4
          ? "grid-cols-2"
          : "grid-cols-3"

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Riplexo</span>
          <span className="h-4 w-px bg-border" />
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            {roomId}
            {copied ? (
              <Check className="size-3 text-green-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              status === "connected" ? "bg-green-500" : "bg-muted-foreground",
            )}
          />
          <span className="text-xs text-muted-foreground">
            {allPeers.length + 1} участник{allPeers.length + 1 !== 1 ? "а" : ""}
          </span>
        </div>
      </header>

      {/* Video grid */}
      <main className={cn("grid flex-1 gap-2 p-3", gridClass)}>
        {/* Local tile */}
        <VideoTile
          stream={localStream ?? undefined}
          displayName={displayName}
          isMuted={isMicMuted}
          isCamOff={isCamOff}
          isLocal
          className="h-full w-full"
        />

        {/* Remote tiles */}
        {allPeers.map((peer) => (
          <VideoTile
            key={peer.peerId}
            stream={peer.videoStream}
            displayName={peer.displayName}
            className="h-full w-full"
          />
        ))}
      </main>

      {/* Controls */}
      <footer className="flex items-center justify-center gap-3 border-t border-border px-5 py-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMic}
          className={cn(
            "size-12 rounded-full",
            isMicMuted && "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20",
          )}
          aria-label={isMicMuted ? "Включить микрофон" : "Выключить микрофон"}
        >
          {isMicMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleCam}
          className={cn(
            "size-12 rounded-full",
            isCamOff && "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20",
          )}
          aria-label={isCamOff ? "Включить камеру" : "Выключить камеру"}
        >
          {isCamOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={handleLeave}
          className="size-12 rounded-full"
          aria-label="Покинуть комнату"
        >
          <PhoneOff className="size-5" />
        </Button>
      </footer>
    </div>
  )
}
