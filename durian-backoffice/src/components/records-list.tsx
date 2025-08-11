"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { getRecords, type AudioRecord } from "@/services/records"
import { useMobile } from "@/hooks/use-mobile"
import AudioPlayer from "@/components/audio-player"

export default function RecordsList() {
  const [records, setRecords] = useState<AudioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getRecords()
        setRecords(data)
      } catch (error) {
        console.error("Error loading recordings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
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


  const getLabelColor = (label: string) => {
    switch (label) {
      case "mature":
        return "text-green-700 bg-green-100 hover:bg-green-200"
      case "immature":
        return "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
      case "overripe":
        return "text-red-700 bg-red-100 hover:bg-red-200"
      default:
        return ""
    }
  }

  const handleDownload = (record: AudioRecord) => {
    // Simulate download
    const link = document.createElement("a")
    link.href = "/get-audio?url=" + encodeURIComponent(record.link)
    link.download = record.name
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
      {records.map((record) => (
        <div key={record.name} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm flex-1">{record.name}</div>
              <Badge className={`text-xs ${getLabelColor(record.label)}`}>{record.label}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{formatDate(record.date)}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(record.size)}</div>
          </div>
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <AudioPlayer audioUrl={"/get-audio?url=" + encodeURIComponent(record.link)} fileName={record.name} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(record)}
              className={isMobile ? "w-full cursor-pointer" : "flex-1 cursor-pointer"}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
