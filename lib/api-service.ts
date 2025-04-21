// Mock API service to simulate fetching data from a server

// Sample document data structure
export interface DocumentData {
  id: number
  datasetId: string
  screenshot: string | null
  extractedText: string | null
  ocrConfidence: number | null
  issuedDate: string | null
  expirationDate: string | null
  status: boolean // Added status field
}

// Mock database of documents
const mockDocuments: Record<string, DocumentData[]> = {
  invoices: [
    {
      id: 1,
      datasetId: "invoices",
      screenshot: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000",
      extractedText:
        "INVOICE #1234\nDate: 01/15/2023\nDue Date: 02/15/2023\nAmount: $1,250.00\nBilled To: Acme Corp\nServices: Web Development\nTax: $100.00\nTotal: $1,350.00",
      ocrConfidence: 92,
      issuedDate: "2023-01-15",
      expirationDate: "2023-02-15",
      status: true,
    },
    {
      id: 2,
      datasetId: "invoices",
      screenshot: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000",
      extractedText:
        "INVOICE #2468\nDate: 03/10/2023\nDue Date: 04/10/2023\nAmount: $2,500.00\nBilled To: XYZ Industries\nServices: Consulting\nTax: $200.00\nTotal: $2,700.00",
      ocrConfidence: 88,
      issuedDate: "2023-03-10",
      expirationDate: "2023-04-10",
      status: false,
    },
    {
      id: 3,
      datasetId: "invoices",
      screenshot: null,
      extractedText: null,
      ocrConfidence: null,
      issuedDate: null,
      expirationDate: null,
      status: false,
    },
  ],
  receipts: [
    {
      id: 1,
      datasetId: "receipts",
      screenshot: "https://images.unsplash.com/photo-1572520666412-2cbf6ef4bc22?q=80&w=1000",
      extractedText:
        "RECEIPT\nStore: Grocery Market\nDate: 05/20/2023\nItems:\n- Apples $3.99\n- Bread $2.49\n- Milk $3.29\nTotal: $9.77\nPayment Method: Credit Card",
      ocrConfidence: 95,
      issuedDate: "2023-05-20",
      expirationDate: null,
      status: true,
    },
    {
      id: 2,
      datasetId: "receipts",
      screenshot: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1000",
      extractedText:
        "RECEIPT\nStore: Electronics Shop\nDate: 06/15/2023\nItems:\n- Headphones $89.99\n- USB Cable $12.99\nTotal: $102.98\nPayment Method: Debit Card",
      ocrConfidence: 91,
      issuedDate: "2023-06-15",
      expirationDate: null,
      status: false,
    },
  ],
  id_cards: [
    {
      id: 1,
      datasetId: "id_cards",
      screenshot: "https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1000",
      extractedText:
        "IDENTIFICATION CARD\nName: John Smith\nID: 98765432\nIssued Date: 01/15/2022\nExpiration Date: 01/15/2025\nAuthorization Level: A2\nIssuing Authority: Department of Administration",
      ocrConfidence: 96,
      issuedDate: "2022-01-15",
      expirationDate: "2025-01-15",
      status: true,
    },
    {
      id: 2,
      datasetId: "id_cards",
      screenshot: "https://images.unsplash.com/photo-1608236415053-3691791bbffe?q=80&w=1000",
      extractedText:
        "IDENTIFICATION CARD\nName: Jane Doe\nID: 12345678\nIssued Date: 03/22/2021\nExpiration Date: 03/22/2024\nAuthorization Level: B1\nIssuing Authority: Department of Administration",
      ocrConfidence: 94,
      issuedDate: "2021-03-22",
      expirationDate: "2024-03-22",
      status: false,
    },
  ],
  passports: [
    {
      id: 1,
      datasetId: "passports",
      screenshot: "https://images.unsplash.com/photo-1544408945-c5f787e0d4d3?q=80&w=1000",
      extractedText:
        "PASSPORT\nName: Robert Johnson\nPassport No: AB123456\nNationality: United States\nDate of Birth: 04/12/1985\nDate of Issue: 07/15/2020\nDate of Expiry: 07/14/2030",
      ocrConfidence: 97,
      issuedDate: "2020-07-15",
      expirationDate: "2030-07-14",
      status: true,
    },
  ],
  certificates: [
    {
      id: 1,
      datasetId: "certificates",
      screenshot: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=1000",
      extractedText:
        "CERTIFICATE OF COMPLETION\nThis certifies that\nMichael Brown\nhas successfully completed\nAdvanced Data Science\nIssued on: 09/30/2023",
      ocrConfidence: 93,
      issuedDate: "2023-09-30",
      expirationDate: null,
      status: false,
    },
  ],
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Fetch document by dataset and ID
export async function fetchDocument(datasetId: string, documentId: number): Promise<DocumentData | null> {
  // Simulate network delay
  await delay(800)

  // Check if dataset exists
  if (!mockDocuments[datasetId]) {
    return null
  }

  // Find document in dataset
  const document = mockDocuments[datasetId].find((doc) => doc.id === documentId)

  // Return document or null if not found
  return document || null
}

// Save document annotations
export async function saveDocumentAnnotations(document: DocumentData): Promise<boolean> {
  // Simulate network delay
  await delay(500)

  // In a real app, this would update the database
  console.log("Saving document annotations:", document)

  // Simulate successful save
  return true
}

// Get maximum document ID for a dataset
export function getMaxDocumentId(datasetId: string): number {
  if (!mockDocuments[datasetId]) {
    return 0
  }

  const ids = mockDocuments[datasetId].map((doc) => doc.id)
  return Math.max(...ids)
}
