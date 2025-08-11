"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { getAudio } from "@/services/training"

interface AudioPlayerProps {
  audioUrl: string
  fileName: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isMobile = useMobile()

  // Nettoyer l'URL quand le composant se démonte
  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc)
      }
    }
  }, [audioSrc])

  const loadAudio = async () => {
    if (audioSrc) return audioSrc

    setIsLoading(true)
    setError(null)

    try {
      const blobUrl = await getAudio(audioUrl)
      setAudioSrc(blobUrl)
      return blobUrl
    } catch (error) {
      setError("Failed to load audio")
      console.error("Error loading audio:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

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
        const src = await loadAudio()
        if (!src) return

        if (!audioRef.current) {
          // Create audio element if it doesn't exist
          audioRef.current = new Audio()
          audioRef.current.crossOrigin = "anonymous"

          audioRef.current.onended = () => {
            setIsPlaying(false)
          }

          audioRef.current.onerror = () => {
            setError("Error playing audio file")
            setIsPlaying(false)
            setIsLoading(false)
          }

          audioRef.current.oncanplay = () => {
            setIsLoading(false)
          }
        }

        audioRef.current.src = src
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        setError("Playback error")
        console.error("Playback error:", error)
        setIsLoading(false)
      }
    }
  }

  if (error) {
    return (
      <Button size="sm" variant="outline" disabled className={isMobile ? "w-full" : ""}>
        Error
      </Button>
    )
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
