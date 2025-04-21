"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Download, ChevronLeft, ChevronRight, Check, SkipForward } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DocumentFlowGraph from "@/components/document-flow-graph"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { fetchDocument, saveDocumentAnnotations, getMaxDocumentId, type DocumentData } from "@/lib/api-service"

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
  const [isLoading, setIsLoading] = useState(false)
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<boolean>(false) // Added status state

  // State for dataset and document ID
  const [selectedDataset, setSelectedDataset] = useState<string>("id_cards")
  const [documentId, setDocumentId] = useState<number>(1)
  const [maxDocumentId, setMaxDocumentId] = useState<number>(0)

  // Fetch document data when dataset or document ID changes
  useEffect(() => {
    loadDocument(selectedDataset, documentId)

    // Update max document ID for the selected dataset
    const maxId = getMaxDocumentId(selectedDataset)
    setMaxDocumentId(maxId)
  }, [selectedDataset, documentId])

  // Handle dataset change
  const handleDatasetChange = (newDataset: string) => {
    setSelectedDataset(newDataset)
    setDocumentId(1) // Reset to first document when changing datasets
  }

  // Load document from API
  const loadDocument = async (datasetId: string, docId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const document = await fetchDocument(datasetId, docId)

      if (document) {
        setScreenshot(document.screenshot)
        setExtractedText(document.extractedText || "")
        setOcrConfidence(document.ocrConfidence || 0)
        setStatus(document.status) // Set status from document data

        // Parse dates if they exist
        setIssuedDate(document.issuedDate ? parseISO(document.issuedDate) : undefined)
        setExpirationDate(document.expirationDate ? parseISO(document.expirationDate) : undefined)
      } else {
        resetForm()
        setError(`Document ${docId} not found in ${datasetId} dataset.`)
      }
    } catch (err) {
      console.error("Error loading document:", err)
      setError("Failed to load document. Please try again.")
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setScreenshot(null)
    setExtractedText("")
    setIssuedDate(undefined)
    setExpirationDate(undefined)
    setOcrConfidence(0)
    setStatus(false)
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
      status, // Include status in download
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

  // Navigation functions
  const goToPrevious = () => {
    if (documentId > 1) {
      setDocumentId(documentId - 1)
    }
  }

  const goToNext = () => {
    setDocumentId(documentId + 1)
  }

  // Confirm annotation
  const confirmAnnotation = async () => {
    if (!screenshot) {
      toast({
        title: "No screenshot to annotate",
        description: "No screenshot available for this document.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create document data object
      const documentData: DocumentData = {
        id: documentId,
        datasetId: selectedDataset,
        screenshot,
        extractedText,
        ocrConfidence,
        issuedDate: issuedDate ? format(issuedDate, "yyyy-MM-dd") : null,
        expirationDate: expirationDate ? format(expirationDate, "yyyy-MM-dd") : null,
        status, // Include status in save data
      }

      // Save annotations
      const success = await saveDocumentAnnotations(documentData)

      if (success) {
        toast({
          title: "Annotation saved",
          description: `Document ${documentId} in ${selectedDataset} dataset has been annotated.`,
          variant: "default",
        })

        // Move to next document
        goToNext()
      } else {
        toast({
          title: "Failed to save",
          description: "There was an error saving the annotations.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error saving annotations:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving annotations.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Skip current document
  const skipDocument = () => {
    toast({
      title: "Document skipped",
      description: `Skipped document ${documentId} in ${selectedDataset} dataset.`,
      variant: "default",
    })

    // Move to next document
    goToNext()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Horizontal Panel */}
      <Card className="rounded-none border-t-0 border-x-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Download Button - Left */}
            <div className="w-full sm:w-auto order-3 sm:order-1">
              <Button onClick={handleDownload} disabled={!screenshot || isLoading} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Annotations
              </Button>
            </div>

            {/* Dataset and Document ID - Middle */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="dataset" className="whitespace-nowrap">
                  Dataset:
                </Label>
                <Select value={selectedDataset} onValueChange={handleDatasetChange}>
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
            </div>

            {/* Navigation and Action Buttons - Right */}
            <div className="flex items-center gap-2 order-2 sm:order-3 w-full sm:w-auto">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={documentId <= 1 || isLoading}
                  title="Previous document"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={isLoading || (documentId >= maxDocumentId && maxDocumentId > 0)}
                  title="Next document"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="default"
                  onClick={confirmAnnotation}
                  disabled={!screenshot || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  title="Confirm annotation"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="outline" onClick={skipDocument} disabled={isLoading} title="Skip this document">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 grid grid-rows-2 overflow-hidden">
        {/* Top Row - Screenshot, Text, and Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-hidden">
          {/* Screenshot Panel */}
          <Card className="rounded-none border-0 shadow-none overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle>Screenshot</CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-auto h-[calc(100%-48px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading screenshot...</p>
                </div>
              ) : screenshot ? (
                <div className="relative w-full border rounded-md overflow-hidden">
                  <img src={screenshot || "/placeholder.svg"} alt="Document Screenshot" className="w-full h-auto" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted rounded-md">
                  <p className="text-muted-foreground">No screenshot yet</p>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Extracted Text Panel */}
          <Card className="rounded-none border-0 shadow-none overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-hidden h-[calc(100%-48px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full bg-muted rounded-md p-4">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-center">Loading extracted text...</p>
                </div>
              ) : extractedText ? (
                <div className="h-full flex flex-col">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm flex-1 overflow-auto">
                    {extractedText}
                  </pre>
                  {/* OCR confidence bar removed */}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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

                {/* Status Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="status-toggle" className="font-medium">
                    Status
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{status ? "Active" : "Inactive"}</span>
                    <Switch id="status-toggle" checked={status} onCheckedChange={setStatus} disabled={isLoading} />
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={confirmAnnotation} disabled={!screenshot || isLoading}>
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
              <CardTitle>Friday Knowledge Graph</CardTitle>
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
