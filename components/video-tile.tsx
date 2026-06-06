"use client"

import { useEffect, useRef } from "react"
import { MicOff, VideoOff, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSpeaking } from "@/hooks/use-speaking"

interface VideoTileProps {
  stream?: MediaStream
  audioStream?: MediaStream
  // For the local tile we don't get a separate audioStream, so the parent can
  // pass the local stream here purely for the speaking indicator.
  speakingStream?: MediaStream
  displayName: string
  isMuted?: boolean
  isCamOff?: boolean
  isLocal?: boolean
  className?: string
}

export function VideoTile({
  stream,
  audioStream,
  speakingStream,
  displayName,
  isMuted = false,
  isCamOff = false,
  isLocal = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Analyse the relevant audio stream to drive the "speaking" ring.
  const analysedStream = isLocal ? speakingStream : audioStream
  const speaking = useSpeaking(analysedStream, !isMuted)

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

    const tryPlay = () => audio.play().catch(() => {})
    tryPlay()

    // Browsers block autoplay-with-sound until a user gesture. Since the room
    // is joined automatically (no click), the first play() can be rejected.
    // Retry on the first interaction anywhere on the page, then clean up.
    const unlock = () => {
      tryPlay()
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
    window.addEventListener("pointerdown", unlock)
    window.addEventListener("keydown", unlock)

    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [audioStream, isLocal])

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl bg-secondary transition-all",
        speaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
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
