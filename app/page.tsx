"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { extractTextFromImage } from "@/lib/ocr-service"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DocumentFlowGraph from "@/components/document-flow-graph"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample datasets
const SAMPLE_DATASETS = [
  { id: "invoices", name: "Invoices" },
  { id: "receipts", name: "Receipts" },
  { id: "id_cards", name: "ID Cards" },
  { id: "passports", name: "Passports" },
  { id: "certificates", name: "Certificates" },
]

export default function ScreenshotAnnotator() {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [issuedDate, setIssuedDate] = useState<Date | undefined>()
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  // New state for dataset and document ID
  const [selectedDataset, setSelectedDataset] = useState<string>("id_cards")
  const [documentId, setDocumentId] = useState<number>(1)

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setIsProcessing(true)
        setError(null)

        // Read the file as data URL
        const reader = new FileReader()
        reader.onload = async (event) => {
          const imageData = event.target?.result as string
          setScreenshot(imageData)

          try {
            // Process the image with OCR
            const result = await extractTextFromImage(imageData)
            setExtractedText(result.text)
            setOcrConfidence(result.confidence)

            // Try to extract dates from the text
            extractDatesFromText(result.text)
          } catch (ocrError) {
            console.error("OCR error:", ocrError)
            setError("Failed to extract text from the image. Please try a clearer image.")
          } finally {
            setIsProcessing(false)
          }
        }
        reader.onerror = () => {
          setError("Failed to read the image file.")
          setIsProcessing(false)
        }
        reader.readAsDataURL(file)
      } catch (err) {
        setError("An unexpected error occurred.")
        setIsProcessing(false)
      }
    }
  }

  // Extract dates from text
  const extractDatesFromText = (text: string) => {
    // Simple regex to find dates in format MM/DD/YYYY
    const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g
    const dates = [...text.matchAll(dateRegex)]

    if (dates.length >= 1) {
      // Try to find issued date by looking for "issue" or "issued" nearby
      const issuedIndex = text.toLowerCase().indexOf("issue")
      if (issuedIndex !== -1) {
        // Find the closest date to the "issue" keyword
        let closestDate = null
        let minDistance = Number.MAX_VALUE

        for (const match of dates) {
          const distance = Math.abs(match.index! - issuedIndex)
          if (distance < minDistance) {
            minDistance = distance
            closestDate = match[0]
          }
        }

        if (closestDate) {
          const [month, day, year] = closestDate.split(/[/-]/).map(Number)
          setIssuedDate(new Date(year, month - 1, day))
        }
      }

      // Try to find expiration date by looking for "expir" nearby
      const expireIndex = text.toLowerCase().indexOf("expir")
      if (expireIndex !== -1) {
        // Find the closest date to the "expir" keyword
        let closestDate = null
        let minDistance = Number.MAX_VALUE

        for (const match of dates) {
          const distance = Math.abs(match.index! - expireIndex)
          if (distance < minDistance) {
            minDistance = distance
            closestDate = match[0]
          }
        }

        if (closestDate) {
          const [month, day, year] = closestDate.split(/[/-]/).map(Number)
          setExpirationDate(new Date(year, month - 1, day))
        }
      }
    }
  }

  const resetForm = () => {
    setScreenshot(null)
    setExtractedText("")
    setIssuedDate(undefined)
    setExpirationDate(undefined)
    setOcrConfidence(0)
    setError(null)
  }

  // Handle download of annotated data
  const handleDownload = () => {
    const annotatedData = {
      dataset: selectedDataset,
      documentId,
      extractedText,
      issuedDate: issuedDate ? format(issuedDate, "yyyy-MM-dd") : null,
      expirationDate: expirationDate ? format(expirationDate, "yyyy-MM-dd") : null,
      ocrConfidence,
      timestamp: new Date().toISOString(),
    }

    // Create a blob with the JSON data
    const blob = new Blob([JSON.stringify(annotatedData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedDataset}_${documentId}_annotated.json`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Horizontal Panel */}
      <Card className="rounded-none border-t-0 border-x-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="dataset" className="whitespace-nowrap">
                Dataset:
              </Label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger id="dataset" className="w-[180px]">
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_DATASETS.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="document-id" className="whitespace-nowrap">
                Document ID:
              </Label>
              <Input
                id="document-id"
                type="number"
                min="1"
                value={documentId}
                onChange={(e) => setDocumentId(Number.parseInt(e.target.value) || 1)}
                className="w-[100px]"
              />
            </div>

            <Button onClick={handleDownload} disabled={!screenshot || isProcessing} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Download Annotations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area - Fills remaining height */}
      <div className="flex-1 grid grid-rows-2 overflow-hidden">
        {/* Top Row - Screenshot, Text, and Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-hidden">
          {/* Screenshot Panel */}
          <Card className="rounded-none border-0 shadow-none overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle>Screenshot</CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-auto h-[calc(100%-48px)]">
              {screenshot ? (
                <div className="relative w-full border rounded-md overflow-hidden">
                  <img src={screenshot || "/placeholder.svg"} alt="Uploaded Screenshot" className="w-full h-auto" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                        <p className="text-white mt-2">Processing image...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-md p-4">
                  <p className="text-muted-foreground mb-4">Upload a screenshot to annotate</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="max-w-xs"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {screenshot && (
                <Button variant="outline" className="mt-4" onClick={resetForm} disabled={isProcessing}>
                  Clear Screenshot
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Extracted Text Panel */}
          <Card className="rounded-none border-0 shadow-none overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-hidden h-[calc(100%-48px)]">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full bg-muted rounded-md p-4">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-center">Extracting text from image...</p>
                  <p className="text-center text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </div>
              ) : extractedText ? (
                <div className="h-full flex flex-col">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm flex-1 overflow-auto">
                    {extractedText}
                  </pre>
                  {ocrConfidence > 0 && (
                    <div className="mt-2 w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>OCR Confidence</span>
                        <span>{Math.round(ocrConfidence)}%</span>
                      </div>
                      <Progress value={ocrConfidence} className="h-2" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted rounded-md">
                  <p className="text-muted-foreground">No text extracted yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor Panel */}
          <Card className="rounded-none border-0 shadow-none overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle>Date Fields Editor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-auto h-[calc(100%-48px)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issued-date">Issued Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="issued-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !issuedDate && "text-muted-foreground",
                        )}
                        disabled={isProcessing}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issuedDate ? format(issuedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={issuedDate} onSelect={setIssuedDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration-date">Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="expiration-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expirationDate && "text-muted-foreground",
                        )}
                        disabled={isProcessing}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={expirationDate} onSelect={setExpirationDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button className="w-full mt-6" disabled={!screenshot || isProcessing}>
                  Save Annotations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Flow Graph */}
        <div className="overflow-hidden">
          <Card className="h-full rounded-none border-0 shadow-none">
            <CardHeader className="py-2 px-4">
              <CardTitle>Document Relationship Graph</CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-[calc(100%-48px)] overflow-hidden">
              <div className="h-full w-full">
                <DocumentFlowGraph />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
