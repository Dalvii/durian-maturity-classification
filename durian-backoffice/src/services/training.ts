import { buildApiUrl } from "@/lib/config"

export interface SubmittedFile {
  name: string
  date: string
  label: "mature" | "overripe"
  size: number
  link: string
}

export interface Phase {
  name: string
  files: SubmittedFile[]
}

export interface TrainingResponse {
  phase: string
  message: string
}

export interface AddTrainingDataResponse {
  message: string
}

// Service pour les données d'entraînement
export async function getPhases(): Promise<Phase[]> {
  try {
    const response = await fetch(buildApiUrl("/get-phases"))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: Phase[] = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching phases:", error)
    throw new Error("Failed to load training phases")
  }
}

export async function addTrainingData(file: File, label: "mature" | "overripe"): Promise<AddTrainingDataResponse> {
  try {
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("label", label)

    const response = await fetch(buildApiUrl("/add-training-data"), {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: AddTrainingDataResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error adding training data:", error)
    throw error instanceof Error ? error : new Error("Failed to upload audio file")
  }
}

export async function trainPhase(epochs = 10): Promise<TrainingResponse> {
  try {
    const response = await fetch(buildApiUrl(`/train-phase?epochs=${epochs}`), {
      method: "PUT",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: TrainingResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error training phase:", error)
    throw error instanceof Error ? error : new Error("Failed to train model")
  }
}

export async function getAudio(url: string): Promise<string> {
  try {
    const response = await fetch(buildApiUrl(`/get-audio?url=${encodeURIComponent(url)}`))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Créer un blob URL pour l'audio
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error("Error fetching audio:", error)
    throw new Error("Failed to load audio file")
  }
}
