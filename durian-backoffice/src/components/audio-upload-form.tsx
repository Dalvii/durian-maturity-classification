"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, AlertCircle } from "lucide-react"
import { addTrainingData } from "@/services/training"

interface AudioUploadFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AudioUploadForm({ onSuccess, onCancel }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Vérifier que c'est un fichier audio
      if (!selectedFile.type.startsWith("audio/")) {
        setError("Please select an audio file")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !label) {
      setError("Please select a file and label")
      return
    }

    setUploading(true)
    setError("")

    try {
      const result = await addTrainingData(file, label as "mature" | "overripe")
      console.log("Upload successful:", result.message)
      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="audio-file">Audio File</Label>
        <Input id="audio-file" type="file" accept="audio/*" onChange={handleFileChange} disabled={uploading} />
        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Maturity Label</Label>
        <Select value={label} onValueChange={setLabel} disabled={uploading}>
          <SelectTrigger>
            <SelectValue placeholder="Select maturity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mature">Mature</SelectItem>
            <SelectItem value="overripe">Overripe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={!file || !label || uploading} className="flex-1">
          {uploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-pulse" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
