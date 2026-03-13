import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  totalPages: number;
  pages: ParsedPage[];
}

export async function extractPdfText(
  file: File,
  pageRange?: { start: number; end: number }
): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  const startPage = pageRange ? Math.max(1, pageRange.start) : 1;
  const endPage = pageRange ? Math.min(totalPages, pageRange.end) : totalPages;

  const pages: ParsedPage[] = [];

  for (let i = startPage; i <= endPage; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ")
      .trim();

    if (text.length > 0) {
      pages.push({ pageNumber: i, text });
    }
  }

  return { totalPages, pages };
}

/**
 * Chunks pages into groups that fit under a character limit for AI processing.
 * Each chunk contains the combined text of consecutive pages.
 */
export function chunkPages(
  pages: ParsedPage[],
  maxCharsPerChunk: number = 40000
): ParsedPage[][] {
  const chunks: ParsedPage[][] = [];
  let currentChunk: ParsedPage[] = [];
  let currentSize = 0;

  for (const page of pages) {
    if (currentSize + page.text.length > maxCharsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(page);
    currentSize += page.text.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
