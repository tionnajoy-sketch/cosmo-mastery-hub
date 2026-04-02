

## Plan: Intelligent Document Ingestion Engine with Structure-Aware Chunking

Transform the upload pipeline from a flat page-by-page term extractor into a structure-aware document intelligence system that understands chapters, sections, headings, and hierarchical content — then applies the TJ Anderson Layer Method to meaningful chunks.

---

### Current State

- **Client-side**: PDF text extracted page-by-page via `pdfjs-dist`, chunked by character count (6000 chars), sent to edge function
- **Edge function**: Treats each chunk as flat text, creates 1 block per page/slide — cosmetology-only prompt
- **Database**: `uploaded_modules` (flat metadata) + `uploaded_module_blocks` (flat blocks with `block_number`)
- **No structure awareness**: No chapters, sections, headings, document outlines, or cross-section understanding

---

### What Changes

#### Phase 1: Database Schema Updates (Migration)

**New table: `module_chapters`** — stores detected document structure

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| module_id | uuid | FK to uploaded_modules |
| chapter_number | integer | Sequential order |
| title | text | Detected chapter/section title |
| summary | text | AI-generated chapter summary |
| page_range_start | integer | Start page |
| page_range_end | integer | End page |
| parent_chapter_id | uuid (nullable) | For subsections |
| metadata | jsonb | Subject type, difficulty, themes, key patterns |
| created_at | timestamptz | |

**New table: `module_document_overview`** — whole-document understanding

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| module_id | uuid | FK, unique |
| document_title | text | Detected document title |
| document_type | text | textbook, workbook, lecture_notes, bible, study_guide |
| subject | text | Auto-detected subject area |
| total_chapters | integer | |
| chapter_outline | jsonb | Full outline structure |
| key_themes | jsonb | Cross-chapter themes |
| overview_summary | text | Full document summary |
| created_at | timestamptz | |

**Alter `uploaded_module_blocks`** — add structural metadata columns:

- `chapter_id` uuid nullable (FK to module_chapters)
- `section_title` text default ''
- `source_text` text default '' (original passage)
- `explanation` text default '' (plain-language explanation)
- `key_concepts` jsonb default '[]'
- `themes` jsonb default '[]'
- `memory_anchors` jsonb default '[]'
- `application_steps` jsonb default '[]'
- `difficulty_level` text default 'intermediate'
- `search_tags` jsonb default '[]'
- `page_reference` text default ''
- `chunk_index` integer default 0

**Alter `uploaded_modules`** — add:

- `document_type` text default ''
- `detected_subject` text default ''
- `total_chapters` integer default 0
- `processing_phase` text default 'uploading' (uploading, analyzing_structure, generating_overview, processing_chunks, ready)

#### Phase 2: New Edge Function — `analyze-document-structure`

A new edge function that runs BEFORE `process-upload`. It receives the full extracted text and detects:

1. Document title
2. Chapter/section boundaries (via heading patterns, numbering, page breaks)
3. Subject area
4. Document type
5. Returns a structured outline with page ranges per chapter

Uses Gemini Flash for speed. Returns:
```json
{
  "document_title": "Milady Standard Cosmetology Ch. 7",
  "document_type": "textbook",
  "subject": "cosmetology",
  "chapters": [
    { "number": 1, "title": "Introduction to Skin Structure", "page_start": 1, "page_end": 4, "subsections": [...] }
  ],
  "key_themes": ["anatomy", "safety", "client care"],
  "overview_summary": "..."
}
```

#### Phase 3: Upgraded `process-upload` Edge Function

**Subject-agnostic system prompt** — Remove hardcoded "cosmetology" framing. Instead, receive detected subject from Phase 2 and adapt:

- The prompt dynamically inserts the detected subject
- Works for cosmetology, Bible study, nursing, history, etc.
- Keeps TJ Anderson Layer Method as the transformation engine

**Expanded output schema** per block:

- `source_text` — original passage text
- `explanation` — plain-language "what this passage says"
- `key_concepts` — array of important terms/ideas
- `themes` — thematic tags
- `memory_anchors` — mnemonics and recall aids
- `application_steps` — practical steps
- `difficulty_level` — beginner/intermediate/advanced
- `search_tags` — for retrieval
- `page_reference` — "Chapter 3, pp. 45-47"
- `section_title` — which section this came from

#### Phase 4: Smart Chunking in Client (`src/lib/pdfParser.ts`)

Replace character-count chunking with structure-aware chunking:

1. After structure analysis returns chapters, group pages by chapter/section
2. Each chunk = one section (or subsection if too large)
3. Attach metadata: `{ chapterNumber, sectionTitle, pageRange, chunkIndex }`
4. Fall back to character-based chunking if no structure detected

Add new function: `chunkByStructure(pages, chapters)` alongside existing `chunkPages`.

#### Phase 5: Updated Upload Flow (`src/pages/UploadPage.tsx`)

New multi-phase processing UI:

1. **"Analyzing document structure..."** (20-35%) — calls `analyze-document-structure`
2. **"Building document overview..."** (35-45%) — saves chapters + overview to DB
3. **"Processing Chapter X of Y..."** (45-90%) — processes each chapter's chunks
4. **"Finalizing..."** (90-100%) — saves, updates status

Enhanced summary shows: detected chapters, sections per chapter, blocks created per chapter, subject detected.

#### Phase 6: Document Overview UI (`src/pages/ModuleViewPage.tsx`)

Add a collapsible "Document Overview" section at top of module view:

- Document title and detected subject
- Chapter-by-chapter outline (expandable)
- Key themes across document
- Overall summary
- Each chapter section groups its blocks

#### Phase 7: Conversational Queries (Ask TJ Integration)

Update `ai-mentor-chat` edge function to accept module context:

- When user asks "break down chapter 3" or "quiz me on this chapter" — retrieve relevant chunks from `uploaded_module_blocks` filtered by `chapter_id`
- Use `search_tags` and `key_concepts` for retrieval
- Pass structured chunks as context to AI for accurate answers

---

### Technical Details

- **Structure detection heuristics**: The edge function looks for patterns like "Chapter X", "CHAPTER X", numbered sections (1.1, 1.2), ALL-CAPS headings, significant font-size changes (when available from PDF metadata), and page break patterns
- **Subject detection**: AI analyzes first ~3000 chars of document to determine subject area, then all subsequent prompts adapt terminology and framing
- **Backward compatibility**: Existing modules continue working — new columns have defaults, old blocks just lack the new metadata
- **Token management**: Structure analysis uses Flash model on condensed text (first line of each page + detected headings). Per-chunk processing stays within token limits by chunking at section boundaries
- **Error resilience**: If structure detection fails, falls back to current page-based chunking

### Files to Create
1. `supabase/functions/analyze-document-structure/index.ts`

### Files to Modify
1. `src/lib/pdfParser.ts` — add `chunkByStructure()` function
2. `src/pages/UploadPage.tsx` — multi-phase processing flow
3. `supabase/functions/process-upload/index.ts` — subject-agnostic prompt, expanded output schema
4. `src/pages/ModuleViewPage.tsx` — document overview section, chapter grouping
5. `src/components/UploadedTermCard.tsx` — display new fields (source text, explanation, key concepts)
6. Database migration — new tables + altered columns

