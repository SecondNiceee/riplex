"use client"

import { useEffect, useRef } from "react"
import { MicOff, VideoOff, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoTileProps {
  stream?: MediaStream
  audioStream?: MediaStream
  displayName: string
  isMuted?: boolean
  isCamOff?: boolean
  isLocal?: boolean
  className?: string
}

export function VideoTile({
  stream,
  audioStream,
  displayName,
  isMuted = false,
  isCamOff = false,
  isLocal = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
  }, [stream])

  // Play remote audio through a dedicated <audio> element. Local audio is
  // never played back to avoid echo/feedback.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioStream || isLocal) return
    audio.srcObject = audioStream
    // Autoplay may be blocked until a user gesture — attempt and ignore errors.
    audio.play().catch(() => {})
  }, [audioStream, isLocal])

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl bg-secondary",
        className,
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={cn(
          "h-full w-full object-cover",
          (isCamOff || !stream) && "invisible",
          isLocal && "scale-x-[-1]",
        )}
      />

      {/* Remote audio — local audio is muted to prevent echo */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

      {/* Cam off placeholder */}
      {(isCamOff || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <User className="size-7 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">{displayName}</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
        <span className="rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {isLocal ? `${displayName} (вы)` : displayName}
        </span>
        <div className="flex items-center gap-1">
          {isMuted && (
            <span className="flex size-6 items-center justify-center rounded-full bg-destructive/90">
              <MicOff className="size-3 text-white" />
            </span>
          )}
          {isCamOff && (
            <span className="flex size-6 items-center justify-center rounded-full bg-muted/90">
              <VideoOff className="size-3 text-muted-foreground" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
