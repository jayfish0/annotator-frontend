import { createWorker } from "tesseract.js"

export interface OcrResult {
  text: string
  confidence: number
}

export async function extractTextFromImage(imageData: string): Promise<OcrResult> {
  try {
    // Create a worker and load the English language model
    const worker = await createWorker("eng")

    // Recognize text in the image
    const result = await worker.recognize(imageData)

    // Terminate the worker to free up resources
    await worker.terminate()

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    }
  } catch (error) {
    console.error("OCR processing error:", error)
    throw new Error("Failed to extract text from image")
  }
}
