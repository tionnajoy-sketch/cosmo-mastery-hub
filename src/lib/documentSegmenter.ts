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

function isPageMarkerLine(line: string): boolean {
  return /^[\s:;,.\-–—|]*page\s*\d+[\s:;,.\-–—|]*$/i.test(line.trim());
}

function normalizeDictionaryToken(token: string): string {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’-]+$/g, "").trim();
}

function extractDictionaryTokens(line: string): string[] {
  return line
    .split(/\s+/)
    .map(normalizeDictionaryToken)
    .filter((token) => token.length > 0)
    .filter((token) => /^[A-Za-z][A-Za-z'’-]{0,24}$/.test(token) || /^[A-Za-z]$/.test(token));
}

function looksLikeFlattenedWordRun(line: string): boolean {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (!cleaned || isPageMarkerLine(cleaned)) return false;
  if (/[.!?]{2,}/.test(cleaned)) return false;

  const tokens = extractDictionaryTokens(cleaned);
  const rawParts = cleaned.split(/\s+/).filter(Boolean);

  if (rawParts.length < 4) return false;
  if (tokens.length / rawParts.length < 0.8) return false;

  const averageTokenLength = tokens.reduce((sum, token) => sum + token.length, 0) / Math.max(tokens.length, 1);
  return averageTokenLength <= 12;
}

function looksLikeDictionary(lines: string[]): boolean {
  const nonEmpty = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isPageMarkerLine(line));

  if (nonEmpty.length < 3) return false;

  let wordLineCt = 0;
  let hasLongParagraph = false;

  for (const line of nonEmpty) {
    if (looksLikeFlattenedWordRun(line)) {
      wordLineCt++;
      continue;
    }

    if (line.length > 300) {
      hasLongParagraph = true;
      continue;
    }

    const hasSeparator = /[:\-—–=]\s*.{3,}/.test(line);
    const isShortEntry = line.length < 120 && /^[A-Za-z0-9]/.test(line);
    const isNumberedItem = /^\d+[.)]\s+/.test(line);

    if (hasSeparator || isShortEntry || isNumberedItem) {
      wordLineCt++;
    }
  }

  if (hasLongParagraph && wordLineCt < nonEmpty.length * 0.5) return false;

  return nonEmpty.length >= 5 && wordLineCt / nonEmpty.length > 0.45;
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
  if (isPageMarkerLine(line)) return true;
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

  const pushWordUnit = (term: string, body?: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || isNonWordLine(cleanTerm)) return;
    units.push({
      index: idx++,
      title: cleanTerm,
      body: body?.trim() || cleanTerm,
      unitType: "word_entry",
      parentIndex: null,
    });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (isNonWordLine(line)) continue;

    const stripped = line
      .replace(/^\d+[.)]\s+/, "")
      .replace(/^[•\-\*]\s+/, "")
      .trim();

    if (!stripped || isNonWordLine(stripped)) continue;

    // IDEA-FIRST RULE: never split a flattened prose line into per-word blocks.
    // Only treat as a vocabulary entry if it looks like "term: definition" or a short term line.
    const sepMatch = stripped.match(/^(.+?)\s*[:\-—–=]\s+(.+)$/);
    const title = sepMatch ? sepMatch[1].trim() : stripped;
    const body = sepMatch ? `${sepMatch[1].trim()}: ${sepMatch[2].trim()}` : stripped;

    // Skip multi-word lines without a separator (likely prose, not a glossary entry)
    if (!sepMatch && title.split(/\s+/).length > 6) continue;
    pushWordUnit(title, body);
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

  const lessonTitle = sections.find((s) => s.type === "lesson_overview")?.heading || "Lesson";
  const parentIdx = idx;
  units.push({
    index: idx++,
    title: lessonTitle,
    body: sections.find((s) => s.type === "lesson_overview")?.lines.join("\n").trim() || "",
    unitType: "lesson_overview",
    parentIndex: null,
  });

  for (const sec of sections) {
    if (sec.type === "lesson_overview") continue;
    const body = sec.lines.join("\n").trim();
    if (!body) continue;

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

    const isHeading =
      /^#{1,4}\s/.test(line) ||
      (line.length > 2 && line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) ||
      /^\d+[.)]\s+[A-Z]/.test(line);

    if (isHeading) {
      flushCurrent();
      currentTitle = line.replace(/^#{1,4}\s*/, "");
    } else if (line.length === 0 && currentBody.length > 0) {
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
  maxCharsPerBatch = 4000,
  maxUnitsPerBatch = Number.POSITIVE_INFINITY
): SegmentedUnit[][] {
  const batches: SegmentedUnit[][] = [];
  let current: SegmentedUnit[] = [];
  let currentSize = 0;

  for (const unit of units) {
    const unitSize = unit.title.length + unit.body.length + 50;
    const exceedsCharLimit = currentSize + unitSize > maxCharsPerBatch;
    const exceedsUnitLimit = current.length >= maxUnitsPerBatch;

    if ((exceedsCharLimit || exceedsUnitLimit) && current.length > 0) {
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
