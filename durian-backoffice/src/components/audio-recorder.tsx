"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Square, Play, Zap, AlertCircle, WifiOff } from "lucide-react"
import { classifyAudio, type ClassificationResponse } from "@/services/classify"
import { useOfflineQueue } from "@/hooks/use-offline-queue"

interface AudioRecorderProps {
  onClassificationStart: () => void
  onClassificationComplete: (result: ClassificationResponse) => void
  onClassificationError: () => void
  isClassifying: boolean
}

export default function AudioRecorder({
  onClassificationStart,
  onClassificationComplete,
  onClassificationError,
  isClassifying,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>("")
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { addToQueue, isOnline } = useOfflineQueue()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Arrêter le stream
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setError("")

      // Timer pour le temps d'enregistrement
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      setError("Failed to access microphone. Please check permissions.")
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
        audioRef.current.onended = () => setIsPlaying(false)
      }
      audioRef.current.play()
      setIsPlaying(true)
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const classifyRecording = async () => {
    if (!audioBlob) {
      setError("No recording available")
      return
    }

    onClassificationStart()
    setError("")

    try {
      const fileName = `recording-${Date.now()}.wav`

      if (isOnline) {
        // Essayer de classifier directement
        try {
          const file = new File([audioBlob], fileName, { type: "audio/wav" })
          const result = await classifyAudio(file)
          onClassificationComplete(result)
          return
        } catch {
          console.log("Direct classification failed, adding to queue")
        }
      }

      // Ajouter à la queue locale
      const success = await addToQueue(audioBlob, fileName, "classification")
      if (success) {
        setError("Recording saved offline. Classification will be performed when connection is restored.")
        onClassificationError()
      } else {
        setError("Failed to save recording locally")
        onClassificationError()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to classify recording. Please try again.")
      onClassificationError()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Recordings will be saved locally and classified when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-4">
        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} size="lg" className="w-full">
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
            </div>
            <Button onClick={stopRecording} size="lg" variant="destructive" className="w-full">
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          </div>
        )}

        {audioBlob && !isRecording && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Recording ready ({formatTime(recordingTime)})</p>
              <div className="flex gap-2">
                <Button onClick={playRecording} variant="outline" className="flex-1 bg-transparent">
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setAudioBlob(null)
                    setAudioUrl(null)
                    setRecordingTime(0)
                    if (audioRef.current) {
                      audioRef.current.pause()
                      setIsPlaying(false)
                    }
                  }}
                  variant="outline"
                >
                  Record Again
                </Button>
              </div>
            </div>

            <Button onClick={classifyRecording} disabled={isClassifying} className="w-full">
              {isClassifying ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Classifying...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {isOnline ? "Classify Recording" : "Save for Classification"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant={error.includes("saved offline") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
