"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import type { ClassificationResponse } from "@/services/classify"

interface ClassificationResultProps {
  result: ClassificationResponse | null
  isClassifying: boolean
}

export default function ClassificationResult({ result, isClassifying }: ClassificationResultProps) {
  if (isClassifying) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Classifying audio...</p>
          <p className="text-sm text-muted-foreground">Please wait while we analyze your audio sample</p>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  const confidencePercentage = Math.round(result.confidence * 100)
  const isHighConfidence = result.confidence >= 0.8
  const isMediumConfidence = result.confidence >= 0.6

  const getResultColor = (type: string) => {
    switch (type) {
      case "mature":
        return "text-green-700 bg-green-100 hover:bg-green-200"
      case "overripe":
        return "text-red-700 bg-red-100 hover:bg-red-200"
      default:
        return ""
    }
  }

  const getConfidenceColor = () => {
    if (isHighConfidence) return "text-green-600"
    if (isMediumConfidence) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceIcon = () => {
    if (isHighConfidence) return <CheckCircle className="w-5 h-5 text-green-600" />
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getConfidenceIcon()}
          Classification Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-medium">Predicted Type:</span>
            <Badge className={`text-sm ${getResultColor(result.type)}`}>
              {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidence Level</span>
            <span className={`text-sm font-bold ${getConfidenceColor()}`}>{confidencePercentage}%</span>
          </div>
          <Progress value={confidencePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {isHighConfidence
              ? "High confidence - Very reliable prediction"
              : isMediumConfidence
                ? "Medium confidence - Fairly reliable prediction"
                : "Low confidence - Consider retesting with better audio quality"}
          </p>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Interpretation:</strong> The model predicts this fruit is <strong>{result.type}</strong> with{" "}
            {confidencePercentage}% confidence.{" "}
            {result.type === "mature"
              ? "The fruit appears to be at optimal ripeness for consumption."
              : "The fruit appears to be overripe and may be past its optimal consumption period."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
