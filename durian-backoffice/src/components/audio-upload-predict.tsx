"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Zap, WifiOff } from "lucide-react"
import { classifyAudio, type ClassificationResponse } from "@/services/classify"
import { useOfflineQueue } from "@/hooks/use-offline-queue"

interface AudioUploadPredictProps {
  onClassificationStart: () => void
  onClassificationComplete: (result: ClassificationResponse) => void
  onClassificationError: () => void
  isClassifying: boolean
}

export default function AudioUploadPredict({
  onClassificationStart,
  onClassificationComplete,
  onClassificationError,
  isClassifying,
}: AudioUploadPredictProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const { addToQueue, isOnline } = useOfflineQueue()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Vérifier que c'est un fichier audio
      const validTypes = ["audio/wav", "audio/wave", "audio/m4a", "audio/x-m4a", "audio/mp4"]
      if (
        !validTypes.some(
          (type) => selectedFile.type === type || selectedFile.name.toLowerCase().includes(type.split("/")[1]),
        )
      ) {
        setError("Please select a valid audio file (WAV, M4A, MP4)")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleClassify = async () => {
    if (!file) {
      setError("Please select an audio file")
      return
    }

    onClassificationStart()
    setError("")

    try {
      if (isOnline) {
        // Essayer de classifier directement
        try {
          const result = await classifyAudio(file)
          onClassificationComplete(result)
          return
        } catch {
          console.log("Direct classification failed, adding to queue")
        }
      }

      // Ajouter à la queue locale pour traitement ultérieur
      const success = await addToQueue(file, file.name, "classification")
      if (success) {
        setError("File saved offline. Classification will be performed when connection is restored.")
        onClassificationError()
      } else {
        setError("Failed to save file locally")
        onClassificationError()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to classify audio. Please try again.")
      onClassificationError()
    }
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Files will be saved locally and classified when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="audio-file">Audio File</Label>
        <Input
          id="audio-file"
          type="file"
          accept="audio/wav,audio/wave,audio/m4a,audio/x-m4a,audio/mp4"
          onChange={handleFileChange}
          disabled={isClassifying}
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {error && (
        <Alert variant={error.includes("saved offline") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleClassify} disabled={!file || isClassifying} className="w-full">
        {isClassifying ? (
          <>
            <Zap className="w-4 h-4 mr-2 animate-pulse" />
            Classifying...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            {isOnline ? "Classify Audio" : "Save for Classification"}
          </>
        )}
      </Button>
    </div>
  )
}
