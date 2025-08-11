import { buildApiUrl } from "@/lib/config"

export interface ClassificationResponse {
  type: "mature" | "overripe"
  confidence: number
}

// Service pour la classification audio
export async function classifyAudio(file: File): Promise<ClassificationResponse> {
  try {
    const formData = new FormData()
    formData.append("audio", file)

    const response = await fetch(buildApiUrl("/classify"), {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: ClassificationResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error classifying audio:", error)
    throw error instanceof Error ? error : new Error("Failed to classify audio file")
  }
}
