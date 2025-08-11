"use client"

import { useState, useEffect, useCallback } from "react"
import { offlineQueueService, type QueuedFile } from "@/services/offline-queue"
import { addTrainingData } from "@/services/training"
import { classifyAudio } from "@/services/classify"
import { useNetworkStatus } from "./use-network-status"

export const useOfflineQueue = () => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { isOnline, wasOffline } = useNetworkStatus()

  const refreshQueue = useCallback(async () => {
    try {
      const files = await offlineQueueService.getQueuedFiles()
      setQueuedFiles(files)
    } catch (error) {
      console.error("Error refreshing queue:", error)
    }
  }, [])

  const addToQueue = useCallback(
    async (
      file: Blob,
      fileName: string,
      type: "training" | "classification",
      metadata: { label?: "mature" | "overripe" } = {},
    ) => {
      try {
        await offlineQueueService.addToQueue(file, fileName, type, metadata)
        await refreshQueue()
        return true
      } catch (error) {
        console.error("Error adding to queue:", error)
        return false
      }
    },
    [refreshQueue],
  )

  const processQueue = useCallback(async () => {
    if (isProcessing || !isOnline) return

    setIsProcessing(true)
    try {
      const pendingFiles = await offlineQueueService.getPendingFiles()

      for (const queuedFile of pendingFiles) {
        if (queuedFile.retryCount >= 3) continue // Skip après 3 tentatives

        try {
          await offlineQueueService.updateFileStatus(queuedFile.id, "uploading")

          // Convertir le Blob en File
          const file = new File([queuedFile.file], queuedFile.fileName, {
            type: queuedFile.file.type || "audio/wav",
          })

          if (queuedFile.type === "training" && queuedFile.metadata.label) {
            await addTrainingData(file, queuedFile.metadata.label)
          } else if (queuedFile.type === "classification") {
            await classifyAudio(file)
          }

          // Succès : supprimer de la queue
          await offlineQueueService.removeFromQueue(queuedFile.id)
        } catch (error) {
          console.error(`Error processing file ${queuedFile.id}:`, error)
          await offlineQueueService.updateFileStatus(queuedFile.id, "failed", queuedFile.retryCount + 1)
        }
      }

      await refreshQueue()
    } catch (error) {
      console.error("Error processing queue:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, isOnline, refreshQueue])

  const removeFromQueue = useCallback(
    async (id: string) => {
      try {
        await offlineQueueService.removeFromQueue(id)
        await refreshQueue()
      } catch (error) {
        console.error("Error removing from queue:", error)
      }
    },
    [refreshQueue],
  )

  const clearQueue = useCallback(async () => {
    try {
      await offlineQueueService.clearQueue()
      await refreshQueue()
    } catch (error) {
      console.error("Error clearing queue:", error)
    }
  }, [refreshQueue])

  // Initialiser et rafraîchir la queue
  useEffect(() => {
    refreshQueue()
  }, [refreshQueue])

  // Traiter la queue quand on revient en ligne
  useEffect(() => {
    if (isOnline && wasOffline) {
      processQueue()
    }
  }, [isOnline, wasOffline, processQueue])

  // Traiter la queue périodiquement si en ligne
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      processQueue()
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [isOnline, processQueue])

  const pendingCount = queuedFiles.filter((f) => f.status === "pending" || f.status === "failed").length
  const uploadingCount = queuedFiles.filter((f) => f.status === "uploading").length

  return {
    queuedFiles,
    pendingCount,
    uploadingCount,
    isProcessing,
    isOnline,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    refreshQueue,
  }
}
