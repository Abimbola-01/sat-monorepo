import pdfParse from 'pdf-parse'
import { parse } from 'csv-parse/sync'
import fs from 'fs'

export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractFromPDF(filePath)
  } else if (mimeType === 'text/csv') {
    return extractFromCSV(filePath)
  } else {
    throw new Error('Unsupported file type. Please upload PDF or CSV.')
  }
}

async function extractFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length === 0) {
    throw new Error(
      'Could not extract text from PDF. Please make sure it is not a scanned image.'
    )
  }

  // Clean up the text
  return data.text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractFromCSV(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8')

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  // Convert CSV rows to readable text for OpenAI
  return records
    .map((row: any) => Object.values(row).join(' | '))
    .join('\n')
}
