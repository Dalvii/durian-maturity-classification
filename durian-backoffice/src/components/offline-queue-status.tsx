"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Upload,
  Trash2,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useOfflineQueue } from "@/hooks/use-offline-queue"

interface OfflineQueueStatusProps {
  type: "training" | "classification"
  title?: string
}

export default function OfflineQueueStatus({ type, title }: OfflineQueueStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    queuedFiles,
    isProcessing,
    isOnline,
    removeFromQueue,
    processQueue,
  } = useOfflineQueue()

  // Filtrer les fichiers par type
  const filteredFiles = queuedFiles.filter((file) => file.type === type)
  const filteredPendingCount = filteredFiles.filter((f) => f.status === "pending" || f.status === "failed").length
  const filteredUploadingCount = filteredFiles.filter((f) => f.status === "uploading").length

  if (filteredFiles.length === 0) return null

  const formatFileSize = (blob: Blob) => {
    const bytes = blob.size
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "uploading":
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-700 bg-yellow-100"
      case "uploading":
        return "text-blue-700 bg-blue-100"
      case "failed":
        return "text-red-700 bg-red-100"
      default:
        return "text-green-700 bg-green-100"
    }
  }

  const clearTypeQueue = async () => {
    // Supprimer seulement les fichiers de ce type
    const filesToRemove = filteredFiles.map((file) => file.id)
    for (const id of filesToRemove) {
      await removeFromQueue(id)
    }
  }

  const getQueueTitle = () => {
    if (title) return title
    return type === "training" ? "Training Queue" : "Classification Queue"
  }

  return (
    <Card className="mb-6">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <CardTitle className="text-lg flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  {getQueueTitle()}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {filteredPendingCount > 0 && <Badge variant="secondary">{filteredPendingCount} pending</Badge>}
                {filteredUploadingCount > 0 && (
                  <Badge className="text-blue-700 bg-blue-100">{filteredUploadingCount} uploading</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {!isOnline && (
              <Alert className="mb-4">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  You're offline. Files will be automatically {type === "training" ? "uploaded" : "classified"} when
                  connection is restored.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                onClick={processQueue}
                disabled={!isOnline || isProcessing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Processing..." : `Retry ${type === "training" ? "Upload" : "Classification"}`}
              </Button>
              <Button size="sm" variant="outline" onClick={clearTypeQueue} disabled={isProcessing}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Queue
              </Button>
            </div>

            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">{file.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {type === "training" ? "Training Data" : "Classification"} •{" "}
                        {formatDate(file.metadata.timestamp)} • {formatFileSize(file.file)}
                      </div>
                      {file.metadata.label && (
                        <Badge className="text-xs mt-1" variant="outline">
                          {file.metadata.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(file.status)}`}>
                        {getStatusIcon(file.status)}
                        <span className="ml-1">{file.status}</span>
                      </Badge>
                      {file.status !== "uploading" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromQueue(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {file.retryCount > 0 && (
                    <div className="text-xs text-muted-foreground">Retry attempts: {file.retryCount}/3</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
