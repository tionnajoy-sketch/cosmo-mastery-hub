/**
 * Document Segmenter — Pre-processing layer that segments raw text
 * into individual learning units BEFORE TJ block conversion.
 *
 * Content types:
 *   dictionary  — one line = one word entry
 *   math        — hierarchical lesson with sections, examples, practice
 *   general     — heading/paragraph based segmentation
 */

export type ContentType = "dictionary" | "math" | "general";

export interface SegmentedUnit {
  /** Unique index within the document */
  index: number;
  /** The unit's title / term / heading */
  title: string;
  /** The body text for this unit */
  body: string;
  /** What kind of learning unit this is */
  unitType:
    | "word_entry"
    | "lesson_overview"
    | "vocabulary"
    | "explanation"
    | "worked_example"
    | "guided_practice"
    | "independent_practice"
    | "answer_key"
    | "section"
    | "paragraph";
  /** For hierarchical content, the parent unit index (null = root) */
  parentIndex: number | null;
  /** Difficulty tag for generated practice items */
  difficulty?: "easy" | "medium" | "challenge";
  /** Original page number if available */
  pageNumber?: number;
}

export interface SegmentationResult {
  contentType: ContentType;
  units: SegmentedUnit[];
}

// ─── Detection heuristics ───────────────────────────────────────────

const MATH_HEADING_PATTERNS = [
  /^(topic|lesson|unit|chapter|module)\s*[:\-#\d]/i,
  /^(vocabulary|key\s*terms|glossary)/i,
  /^(explanation|concept|overview|introduction|objective)/i,
  /^(example|worked\s*example|sample\s*problem|model)/i,
  /^(practice|exercises?|problems?|try\s*it|your\s*turn|independent)/i,
  /^(answer\s*key|solutions?|answers?)/i,
  /^(quiz|test|assessment|review|check)/i,
];

const MATH_CONTENT_SIGNALS = [
  /[=+\-×÷]/,
  /\d+\s*[+\-×÷*/]\s*\d+/,
  /\bsolve\b/i,
  /\bcalculate\b/i,
  /\bequation\b/i,
  /\bformula\b/i,
  /\bx\s*=\s*/i,
  /\bf\(x\)/i,
];

function looksLikeDictionary(lines: string[]): boolean {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 3) return false;

  let wordLineCt = 0;
  let hasLongParagraph = false;

  for (const line of nonEmpty) {
    const t = line.trim();
    // A line longer than 300 chars is likely a paragraph, not a word entry
    if (t.length > 300) { hasLongParagraph = true; continue; }
    // Lines that look like individual word/term entries:
    // - "word — definition" or "word: definition" pattern
    // - Short standalone word/phrase (under 120 chars, starts with letter/number)
    // - Numbered list items like "1. word" or "1) word"
    const hasSeparator = /[:\-—–]\s*.{3,}/.test(t);
    const isShortEntry = t.length < 120 && /^[A-Za-z0-9]/.test(t);
    const isNumberedItem = /^\d+[.)]\s+/.test(t);
    if (hasSeparator || isShortEntry || isNumberedItem) {
      wordLineCt++;
    }
  }

  // If most lines are long paragraphs, not a dictionary
  if (hasLongParagraph && wordLineCt < nonEmpty.length * 0.5) return false;

  // If >40% of lines look like word entries AND we have enough of them
  return nonEmpty.length >= 5 && wordLineCt / nonEmpty.length > 0.4;
}

function looksLikeMath(text: string): boolean {
  let headingHits = 0;
  let signalHits = 0;
  const lines = text.split("\n").slice(0, 60);
  for (const line of lines) {
    if (MATH_HEADING_PATTERNS.some((p) => p.test(line.trim()))) headingHits++;
    if (MATH_CONTENT_SIGNALS.some((p) => p.test(line))) signalHits++;
  }
  return headingHits >= 2 || signalHits >= 4;
}

export function detectContentType(text: string): ContentType {
  const lines = text.split("\n");
  if (looksLikeDictionary(lines)) return "dictionary";
  if (looksLikeMath(text)) return "math";
  return "general";
}

// ─── Dictionary segmenter ───────────────────────────────────────────

function isNonWordLine(line: string): boolean {
  const t = line.trim().toLowerCase();
  if (t.length === 0) return true;
  // Page headers / footers / titles
  if (/^page\s*\d+/i.test(t)) return true;
  if (/^(chapter|unit|section)\s*\d+/i.test(t) && t.length < 40) return true;
  if (/^(name|date|period|class)\s*[:\-_]/i.test(t)) return true;
  if (/^[-=_]{3,}$/.test(t)) return true;
  return false;
}

function segmentDictionary(text: string): SegmentedUnit[] {
  const lines = text.split("\n");
  const units: SegmentedUnit[] = [];
  let idx = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (isNonWordLine(line)) continue;

    // Strip leading numbering like "1. ", "1) ", "• ", "- "
    const stripped = line.replace(/^\d+[.)]\s+/, "").replace(/^[•\-\*]\s+/, "").trim();
    if (!stripped) continue;

    // Try to split "word — definition" or "word: definition" or "word = definition"
    const sepMatch = stripped.match(/^(.+?)\s*[:\-—–=]\s+(.+)$/);
    const title = sepMatch ? sepMatch[1].trim() : stripped;
    const body = sepMatch ? `${sepMatch[1].trim()}: ${sepMatch[2].trim()}` : stripped;

    // Skip if the "title" is suspiciously long (likely a sentence, not a term)
    if (!sepMatch && title.split(/\s+/).length > 12) continue;

    units.push({
      index: idx++,
      title,
      body,
      unitType: "word_entry",
      parentIndex: null,
    });
  }
  return units;
}

// ─── Math segmenter ─────────────────────────────────────────────────

interface MathSection {
  heading: string;
  type: SegmentedUnit["unitType"];
  lines: string[];
}

function classifyMathHeading(heading: string): SegmentedUnit["unitType"] {
  const h = heading.toLowerCase();
  if (/vocabulary|key\s*terms|glossary/.test(h)) return "vocabulary";
  if (/example|worked|sample|model/.test(h)) return "worked_example";
  if (/guided|partially|your\s*turn/.test(h)) return "guided_practice";
  if (/practice|exercise|problem|independent/.test(h)) return "independent_practice";
  if (/answer|solution/.test(h)) return "answer_key";
  if (/topic|lesson|unit|chapter|objective|introduction|overview/.test(h)) return "lesson_overview";
  return "explanation";
}

function segmentMath(text: string): SegmentedUnit[] {
  const lines = text.split("\n");
  const sections: MathSection[] = [];
  let current: MathSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      if (current) current.lines.push("");
      continue;
    }

    // Check if this line is a heading
    const isHeading = MATH_HEADING_PATTERNS.some((p) => p.test(line)) || /^#{1,4}\s/.test(line);
    if (isHeading) {
      if (current) sections.push(current);
      const heading = line.replace(/^#{1,4}\s*/, "").replace(/^[-:]\s*/, "");
      current = { heading, type: classifyMathHeading(heading), lines: [] };
    } else {
      if (!current) {
        current = { heading: "Introduction", type: "lesson_overview", lines: [] };
      }
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  const units: SegmentedUnit[] = [];
  let idx = 0;

  // Create a parent lesson unit
  const lessonTitle =
    sections.find((s) => s.type === "lesson_overview")?.heading || "Lesson";
  const parentIdx = idx;
  units.push({
    index: idx++,
    title: lessonTitle,
    body: sections
      .find((s) => s.type === "lesson_overview")
      ?.lines.join("\n")
      .trim() || "",
    unitType: "lesson_overview",
    parentIndex: null,
  });

  // Process each section as child units
  for (const sec of sections) {
    if (sec.type === "lesson_overview") continue;
    const body = sec.lines.join("\n").trim();
    if (!body) continue;

    // For worked examples and practice, break further by numbering
    if (
      sec.type === "worked_example" ||
      sec.type === "guided_practice" ||
      sec.type === "independent_practice"
    ) {
      const items = splitByNumbering(body);
      if (items.length > 1) {
        for (let i = 0; i < items.length; i++) {
          units.push({
            index: idx++,
            title: `${sec.heading} #${i + 1}`,
            body: items[i],
            unitType: sec.type,
            parentIndex: parentIdx,
            difficulty:
              sec.type === "independent_practice"
                ? i < items.length / 3
                  ? "easy"
                  : i < (items.length * 2) / 3
                  ? "medium"
                  : "challenge"
                : undefined,
          });
        }
        continue;
      }
    }

    units.push({
      index: idx++,
      title: sec.heading,
      body,
      unitType: sec.type,
      parentIndex: parentIdx,
    });
  }

  return units;
}

function splitByNumbering(text: string): string[] {
  // Split by patterns like "1.", "1)", "#1", "Problem 1"
  const parts = text.split(/(?=(?:^|\n)\s*(?:\d+[.)]\s|#\d+|(?:problem|example|exercise)\s*\d+))/im);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// ─── General segmenter ──────────────────────────────────────────────

function segmentGeneral(text: string): SegmentedUnit[] {
  const lines = text.split("\n");
  const units: SegmentedUnit[] = [];
  let idx = 0;
  let currentTitle = "";
  let currentBody: string[] = [];

  const flushCurrent = () => {
    const body = currentBody.join("\n").trim();
    if (body.length > 0) {
      units.push({
        index: idx++,
        title: currentTitle || `Section ${idx + 1}`,
        body,
        unitType: currentTitle ? "section" : "paragraph",
        parentIndex: null,
      });
    }
    currentBody = [];
    currentTitle = "";
  };

  for (const raw of lines) {
    const line = raw.trim();

    // Detect headings: markdown-style, ALL CAPS short lines, numbered sections
    const isHeading =
      /^#{1,4}\s/.test(line) ||
      (line.length > 2 && line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) ||
      /^\d+[.)]\s+[A-Z]/.test(line);

    if (isHeading) {
      flushCurrent();
      currentTitle = line.replace(/^#{1,4}\s*/, "");
    } else if (line.length === 0 && currentBody.length > 0) {
      // Double blank line = new section for long bodies
      const bodyLen = currentBody.join("\n").length;
      if (bodyLen > 500) {
        flushCurrent();
      } else {
        currentBody.push("");
      }
    } else {
      currentBody.push(line);
    }
  }
  flushCurrent();

  return units;
}

// ─── Public API ─────────────────────────────────────────────────────

export function segmentDocument(
  text: string,
  forceType?: ContentType
): SegmentationResult {
  const contentType = forceType || detectContentType(text);

  let units: SegmentedUnit[];
  switch (contentType) {
    case "dictionary":
      units = segmentDictionary(text);
      break;
    case "math":
      units = segmentMath(text);
      break;
    default:
      units = segmentGeneral(text);
      break;
  }

  return { contentType, units };
}

/**
 * Batch segmented units into chunks for the AI edge function,
 * keeping each chunk under a character limit but respecting unit boundaries.
 */
export function batchUnits(
  units: SegmentedUnit[],
  maxCharsPerBatch = 4000
): SegmentedUnit[][] {
  const batches: SegmentedUnit[][] = [];
  let current: SegmentedUnit[] = [];
  let currentSize = 0;

  for (const unit of units) {
    const unitSize = unit.title.length + unit.body.length + 50; // overhead
    if (currentSize + unitSize > maxCharsPerBatch && current.length > 0) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(unit);
    currentSize += unitSize;
  }
  if (current.length > 0) batches.push(current);

  return batches;
}
