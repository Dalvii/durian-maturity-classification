"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Star, AlertCircle } from "lucide-react"
import { getModels, downloadModel, type ModelsResponse } from "@/services/models"
import { useMobile } from "@/hooks/use-mobile"

export default function ModelsList() {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getModels()
        setModelsData(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load models")
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  const handleDownload = async (modelName: string) => {
    setDownloading(modelName)
    try {
      await downloadModel(modelName)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to download model")
    } finally {
      setDownloading(null)
    }
  }

  const formatModelName = (modelName: string) => {
    // Extraire des informations du nom du modèle si possible
    const parts = modelName.replace(".keras", "").split("_")
    return {
      name: modelName,
      version: parts.find((part) => part.startsWith("v")) || "v1",
      displayName: modelName.replace(".keras", "").replace(/_/g, " "),
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading models...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!modelsData || modelsData.models.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No trained models available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Train your first model in the Training Data section.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Modèle actuel */}
      {modelsData.current && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Current Model
              </CardTitle>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formatModelName(modelsData.current).displayName}</p>
                <p className="text-sm text-muted-foreground">Version: {formatModelName(modelsData.current).version}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleDownload(modelsData.current!)}
                disabled={downloading === modelsData.current}
              >
                {downloading === modelsData.current ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-pulse" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste de tous les modèles */}
      <Card>
        <CardHeader>
          <CardTitle>All Models ({modelsData.models.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {modelsData.models.map((modelName) => {
              const modelInfo = formatModelName(modelName)
              const isCurrent = modelName === modelsData.current

              return (
                <div
                  key={modelName}
                  className={`border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow ${
                    isCurrent ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">{modelInfo.displayName}</div>
                      <div className="text-xs text-muted-foreground">{modelInfo.version}</div>
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(modelName)}
                    disabled={downloading === modelName}
                    className="w-full"
                  >
                    {downloading === modelName ? (
                      <>
                        <Download className="w-4 h-4 mr-2 animate-pulse" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
