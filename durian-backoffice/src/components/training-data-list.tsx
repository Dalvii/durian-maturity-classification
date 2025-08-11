"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronDown, ChevronRight, Play, Plus, Loader2, AlertCircle, WifiOff } from "lucide-react"
import { getPhases, trainPhase, type Phase } from "@/services/training"
import { useMobile } from "@/hooks/use-mobile"
import { useNetworkStatus } from "@/hooks/use-network-status"
import AudioUploadForm from "@/components/audio-upload-form"
import AudioPlayer from "@/components/audio-player"
import OfflineQueueStatus from "@/components/offline-queue-status"

export default function TrainingDataList() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [openPhases, setOpenPhases] = useState<string[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasTriedLoading, setHasTriedLoading] = useState(false)
  const isMobile = useMobile()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    if (isOnline && !hasTriedLoading) {
      fetchPhases()
    } else if (!isOnline) {
      // Si on est offline, on arrête le loading pour permettre l'utilisation
      setLoading(false)
      setHasTriedLoading(true)
    }
  }, [isOnline, hasTriedLoading])

  const fetchPhases = async () => {
    if (!isOnline) return

    setLoading(true)
    setError(null)
    try {
      const data = await getPhases()
      setPhases(data)
      setHasTriedLoading(true)
      // Ouvrir automatiquement la phase actuelle (dernière)
      if (data.length > 0) {
        setOpenPhases([data[data.length - 1].name])
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load phases")
      setHasTriedLoading(true)
    } finally {
      setLoading(false)
    }
  }

  const handleTrainPhase = async () => {
    if (!isOnline) {
      setError("Training requires an internet connection")
      return
    }

    setTraining(true)
    setError(null)
    try {
      const result = await trainPhase()
      console.log("Training completed:", result.message)
      await fetchPhases() // Recharger les phases après entraînement
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to train model")
    } finally {
      setTraining(false)
    }
  }

  const togglePhase = (phaseName: string) => {
    setOpenPhases((prev) =>
      prev.includes(phaseName) ? prev.filter((name) => name !== phaseName) : [...prev, phaseName],
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case "mature":
        return "text-green-700 bg-green-100 hover:bg-green-200"
      case "overripe":
        return "text-red-700 bg-red-100 hover:bg-red-200"
      default:
        return ""
    }
  }

  const getCurrentPhase = () => phases[phases.length - 1]
  const isCurrentPhase = (phase: Phase) => phase === getCurrentPhase()

  // Si on est en train de charger ET qu'on est en ligne, on affiche le loader
  if (loading && isOnline) {
    return <div className="text-center py-8">Loading phases...</div>
  }

  return (
    <div className="space-y-4">
      {/* Statut de la queue offline */}
      <OfflineQueueStatus />

      {/* Message d'information si offline ou erreur */}
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. You can still add audio samples - they'll be uploaded when connection is restored. Training
            phases will be loaded when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {error && isOnline && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" className="p-0 h-auto ml-2" onClick={fetchPhases}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Boutons d'action - toujours disponibles */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={() => setShowUploadForm(!showUploadForm)} className="flex-1 sm:flex-none">
          <Plus className="w-4 h-4 mr-2" />
          Add Audio Sample
        </Button>

        <Button
          onClick={handleTrainPhase}
          disabled={training || !isOnline || (phases.length > 0 && getCurrentPhase()?.files.length === 0)}
          variant="default"
          className="flex-1 sm:flex-none"
        >
          {training ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {!isOnline ? "Train Model (Offline)" : "Train Model"}
            </>
          )}
        </Button>
      </div>

      {/* Formulaire d'upload - toujours disponible */}
      {showUploadForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Audio Sample{phases.length > 0 ? " to Current Phase" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioUploadForm
              onSuccess={() => {
                setShowUploadForm(false)
                if (isOnline) {
                  fetchPhases()
                }
              }}
              onCancel={() => setShowUploadForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Liste des phases - seulement si on a des données */}
      {phases.length > 0 && (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <Card key={phase.name} className={isCurrentPhase(phase) ? "border-primary" : ""}>
              <Collapsible open={openPhases.includes(phase.name)} onOpenChange={() => togglePhase(phase.name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {openPhases.includes(phase.name) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <CardTitle className="text-lg">
                          Phase {index + 1}
                          {isCurrentPhase(phase) && <Badge className="ml-2 text-xs">Current</Badge>}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">{phase.files.length} files</Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {phase.files.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No audio samples in this phase yet.</p>
                    ) : (
                      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                        {phase.files.map((file) => (
                          <div
                            key={file.name}
                            className="border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-sm flex-1 truncate">{file.name}</div>
                              <Badge className={`text-xs ${getLabelColor(file.label)}`}>{file.label}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatDate(file.date)}</div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                            <div className="pt-1">
                              <AudioPlayer audioUrl={file.link} fileName={file.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Message d'accueil si pas de phases et pas d'erreur */}
      {phases.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {!isOnline
                ? "You're offline. Add audio samples and they'll be organized into training phases when you're back online."
                : hasTriedLoading
                  ? "No training phases yet."
                  : "Add your first audio sample to get started."}
            </p>
            {!showUploadForm && (
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Audio Sample
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
