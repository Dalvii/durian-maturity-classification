"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

interface AudioPlayerProps {
  audioUrl: string
  fileName: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isMobile = useMobile()

  const handlePlayPause = async () => {
    if (isPlaying) {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    } else {
      // Start playback
      setIsLoading(true)

      try {
        if (!audioRef.current) {
          // Create audio element if it doesn't exist
          audioRef.current = new Audio()
          audioRef.current.crossOrigin = "anonymous"

          audioRef.current.onended = () => {
            setIsPlaying(false)
          }

          audioRef.current.onerror = () => {
            console.error("Error playing audio file")
            setIsPlaying(false)
            setIsLoading(false)
          }

          audioRef.current.oncanplay = () => {
            setIsLoading(false)
          }
        }

        audioRef.current.src = audioUrl
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Playback error:", error)
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handlePlayPause}
      disabled={isLoading}
      className={isMobile ? "w-full" : ""}
    >
      {isLoading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isPlaying ? (
        <>
          <Square className="w-4 h-4" />
          {isMobile && <span className="ml-2">Stop</span>}
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          {isMobile && <span className="ml-2">Play</span>}
        </>
      )}
    </Button>
  )
}
