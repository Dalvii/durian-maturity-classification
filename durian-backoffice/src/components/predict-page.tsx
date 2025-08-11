"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic } from "lucide-react"
import AudioUploadPredict from "@/components/audio-upload-predict"
import AudioRecorder from "@/components/audio-recorder"
import ClassificationResult from "@/components/classification-result"
import OfflineQueueStatus from "@/components/offline-queue-status"
import type { ClassificationResponse } from "@/services/classify"

export default function PredictPage() {
  const [result, setResult] = useState<ClassificationResponse | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)

  const handleClassificationStart = () => {
    setIsClassifying(true)
    setResult(null)
  }

  const handleClassificationComplete = (classificationResult: ClassificationResponse) => {
    setResult(classificationResult)
    setIsClassifying(false)
  }

  const handleClassificationError = () => {
    setIsClassifying(false)
  }

  return (
    <div className="space-y-6">
      {/* Queue spécifique à la classification */}
      <OfflineQueueStatus type="classification" title="Classification Queue" />

      <div className="text-center">
        <p className="text-muted-foreground">
          Upload an audio file or record directly to classify fruit maturity using your trained model.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Record Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio File</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioUploadPredict
                onClassificationStart={handleClassificationStart}
                onClassificationComplete={handleClassificationComplete}
                onClassificationError={handleClassificationError}
                isClassifying={isClassifying}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="record" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioRecorder
                onClassificationStart={handleClassificationStart}
                onClassificationComplete={handleClassificationComplete}
                onClassificationError={handleClassificationError}
                isClassifying={isClassifying}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résultat de classification */}
      {(result || isClassifying) && <ClassificationResult result={result} isClassifying={isClassifying} />}
    </div>
  )
}
