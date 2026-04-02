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

export interface ChapterInfo {
  number: number;
  title: string;
  page_start: number;
  page_end: number;
  subsections?: { title: string; page_start: number; page_end: number }[];
}

export interface StructuredChunk {
  pages: ParsedPage[];
  chapterNumber: number;
  sectionTitle: string;
  pageRange: string;
  chunkIndex: number;
}

/**
 * Groups pages by detected chapter/section structure.
 * Falls back to character-based chunking if no structure detected.
 */
export function chunkByStructure(
  pages: ParsedPage[],
  chapters: ChapterInfo[],
  maxCharsPerChunk: number = 8000
): StructuredChunk[] {
  if (!chapters || chapters.length === 0) {
    // Fallback to flat chunking
    const flat = chunkPages(pages, maxCharsPerChunk);
    return flat.map((chunk, i) => ({
      pages: chunk,
      chapterNumber: 1,
      sectionTitle: "Full Document",
      pageRange: `pp. ${chunk[0]?.pageNumber}-${chunk[chunk.length - 1]?.pageNumber}`,
      chunkIndex: i,
    }));
  }

  const chunks: StructuredChunk[] = [];

  for (const chapter of chapters) {
    // Get pages belonging to this chapter
    const chapterPages = pages.filter(
      (p) => p.pageNumber >= chapter.page_start && p.pageNumber <= chapter.page_end
    );

    if (chapterPages.length === 0) continue;

    // If chapter has subsections, chunk by subsection
    if (chapter.subsections && chapter.subsections.length > 0) {
      for (const sub of chapter.subsections) {
        const subPages = chapterPages.filter(
          (p) => p.pageNumber >= sub.page_start && p.pageNumber <= sub.page_end
        );
        if (subPages.length === 0) continue;

        // Further split if too large
        const subChunks = chunkPages(subPages, maxCharsPerChunk);
        subChunks.forEach((sc, i) => {
          chunks.push({
            pages: sc,
            chapterNumber: chapter.number,
            sectionTitle: sub.title,
            pageRange: `Chapter ${chapter.number}, ${sub.title}, pp. ${sc[0]?.pageNumber}-${sc[sc.length - 1]?.pageNumber}`,
            chunkIndex: i,
          });
        });
      }
    } else {
      // No subsections — chunk the whole chapter
      const chapterChunks = chunkPages(chapterPages, maxCharsPerChunk);
      chapterChunks.forEach((cc, i) => {
        chunks.push({
          pages: cc,
          chapterNumber: chapter.number,
          sectionTitle: chapter.title,
          pageRange: `Chapter ${chapter.number}, pp. ${cc[0]?.pageNumber}-${cc[cc.length - 1]?.pageNumber}`,
          chunkIndex: i,
        });
      });
    }
  }

  // Add any pages not covered by chapters
  const coveredPages = new Set<number>();
  chapters.forEach((ch) => {
    for (let i = ch.page_start; i <= ch.page_end; i++) coveredPages.add(i);
  });
  const uncovered = pages.filter((p) => !coveredPages.has(p.pageNumber));
  if (uncovered.length > 0) {
    const uncoveredChunks = chunkPages(uncovered, maxCharsPerChunk);
    uncoveredChunks.forEach((uc, i) => {
      chunks.push({
        pages: uc,
        chapterNumber: 0,
        sectionTitle: "Additional Content",
        pageRange: `pp. ${uc[0]?.pageNumber}-${uc[uc.length - 1]?.pageNumber}`,
        chunkIndex: i,
      });
    });
  }

  return chunks;
}
