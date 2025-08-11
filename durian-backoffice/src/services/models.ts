import { buildApiUrl } from "@/lib/config"

export interface ModelsResponse {
  models: string[]
  current: string
}

// Service pour les modèles
export async function getModels(): Promise<ModelsResponse> {
  try {
    const response = await fetch(buildApiUrl("/get-models"))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ModelsResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching models:", error)
    throw new Error("Failed to load models")
  }
}

export async function downloadModel(modelName: string): Promise<void> {
  try {
    const response = await fetch(buildApiUrl(`/get-model?url=${encodeURIComponent(modelName)}`))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    // Créer le téléchargement
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = modelName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Nettoyer l'URL
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading model:", error)
    throw error instanceof Error ? error : new Error("Failed to download model")
  }
}
