"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getModels, type ModelFile } from "@/services/models"
import { useMobile } from "@/hooks/use-mobile"

export default function ModelsList() {
  const [models, setModels] = useState<ModelFile[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModels()
        setModels(data)
      } catch (error) {
        console.error("Error loading models:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

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

  const handleDownload = (model: ModelFile) => {
    // Simulate download
    const link = document.createElement("a")
    link.href = model.link
    link.download = model.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const gridCols = isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {models.map((model) => (
        <div key={model.name} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <div className="font-medium text-sm">{model.name}</div>
            <div className="text-xs text-muted-foreground">{formatDate(model.date)}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(model.size)}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleDownload(model)} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      ))}
    </div>
  )
}
