import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText, chunkByStructure, type ParsedPage, type ChapterInfo } from "@/lib/pdfParser";
import { segmentDocument, batchUnits, type ContentType } from "@/lib/documentSegmenter";

interface ConversionSummary {
  blocksCreated: number;
  quizBankCreated: number;
  chaptersDetected?: number;
}

export interface BackgroundUploadState {
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  activeModuleId: string | null;
  activeModuleName: string | null;
  completed: boolean;
  error: string | null;
  summary: ConversionSummary | null;
}

interface ProcessingOptions {
  pageMode: "all" | "range";
  pageStart: number;
  pageEnd: number;
}

interface BackgroundUploadContextType extends BackgroundUploadState {
  startProcessing: (file: File, userId: string, options: ProcessingOptions, multiFiles?: File[]) => void;
  dismiss: () => void;
}

const BackgroundUploadContext = createContext<BackgroundUploadContextType | null>(null);

export const useBackgroundUpload = () => {
  const ctx = useContext(BackgroundUploadContext);
  if (!ctx) throw new Error("useBackgroundUpload must be used within BackgroundUploadProvider");
  return ctx;
};

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const compressImage = async (file: File, maxDimension = 1600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const makeBlockInsert = (block: any, moduleId: string, blockNumber: number, chapterId?: string) => ({
  module_id: moduleId,
  block_number: blockNumber,
  term_title: block.term_title || block.title || "Untitled Term",
  pronunciation: block.pronunciation || "",
  definition: block.definition || "",
  visualization_desc: block.visualization_desc || "",
  metaphor: block.metaphor || "",
  affirmation: block.affirmation || "",
  reflection_prompt: block.reflection_prompt || "",
  practice_scenario: block.practice_scenario || "",
  quiz_question: block.quiz_question || "",
  quiz_options: block.quiz_options || [],
  quiz_answer: block.quiz_answer || "",
  quiz_question_2: block.quiz_question_2 || "",
  quiz_options_2: block.quiz_options_2 || [],
  quiz_answer_2: block.quiz_answer_2 || "",
  quiz_question_3: block.quiz_question_3 || "",
  quiz_options_3: block.quiz_options_3 || [],
  quiz_answer_3: block.quiz_answer_3 || "",
  concept_identity: Array.isArray(block.concept_identity) ? block.concept_identity : [],
  slide_type: block.slide_type || "concept",
  instructor_notes: block.instructor_notes || "",
  image_url: block.image_url || "",
  chapter_id: chapterId || null,
  section_title: block.section_title || "",
  source_text: block.source_text || "",
  explanation: block.explanation || "",
  key_concepts: Array.isArray(block.key_concepts) ? block.key_concepts : [],
  themes: Array.isArray(block.themes) ? block.themes : [],
  memory_anchors: Array.isArray(block.memory_anchors) ? block.memory_anchors : [],
  application_steps: Array.isArray(block.application_steps) ? block.application_steps : [],
  difficulty_level: block.difficulty_level || "intermediate",
  search_tags: Array.isArray(block.search_tags) ? block.search_tags : [],
  page_reference: block.page_reference || "",
  chunk_index: block.chunk_index || 0,
});

export const BackgroundUploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BackgroundUploadState>({
    isProcessing: false,
    progress: 0,
    progressMessage: "",
    activeModuleId: null,
    activeModuleName: null,
    completed: false,
    error: null,
    summary: null,
  });

  const processingRef = useRef(false);

  const setProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({ ...prev, progress, progressMessage: message }));
  }, []);

  const dismiss = useCallback(() => {
    setState({
      isProcessing: false, progress: 0, progressMessage: "",
      activeModuleId: null, activeModuleName: null, completed: false, error: null, summary: null,
    });
  }, []);

  const startProcessing = useCallback(async (file: File, userId: string, options: ProcessingOptions, multiFiles?: File[]) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setState({
      isProcessing: true, progress: 5, progressMessage: "Preparing document...",
      activeModuleId: null, activeModuleName: file.name.replace(/\.[^/.]+$/, ""),
      completed: false, error: null, summary: null,
    });

    try {
      const isPdf = file.type === "application/pdf";
      const isText = file.type === "text/plain" || file.name.endsWith(".txt");
      const isImage = imageTypes.includes(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);

      // ═══ IMAGE PATH ═══
      if (isImage) {
        setProgress(15, "Compressing and reading image(s)...");
        const imagesToProcess = (multiFiles && multiFiles.length > 0) ? multiFiles : [file];
        const allDataUrls: string[] = [];
        for (let i = 0; i < imagesToProcess.length; i++) {
          allDataUrls.push(await compressImage(imagesToProcess[i]));
        }

        setProgress(25, "Creating module...");
        const { data: moduleData, error: moduleError } = await supabase
          .from("uploaded_modules")
          .insert({ user_id: userId, title: file.name.replace(/\.[^/.]+$/, ""), status: "processing", source_filename: file.name, is_instructor_mode: false, processing_phase: "processing_chunks" })
          .select().single();
        if (moduleError) throw moduleError;

        setState(prev => ({ ...prev, activeModuleId: moduleData.id }));

        const allBlocks: any[] = [];
        const allQuizBankQuestions: any[] = [];
        for (let i = 0; i < allDataUrls.length; i++) {
          setProgress(30 + Math.floor(((i + 1) / allDataUrls.length) * 50), `Analyzing image ${i + 1} of ${allDataUrls.length}...`);
          const { data, error } = await supabase.functions.invoke("process-upload", {
            body: { content: `[IMAGE] Analyze image ${i + 1} of ${allDataUrls.length}`, moduleId: moduleData.id, filename: file.name, chunkIndex: i + 1, totalChunks: allDataUrls.length, imageDataUrl: allDataUrls[i] },
          });
          if (error) { console.error(`Image ${i + 1} failed:`, error); continue; }
          allBlocks.push(...(data?.blocks || []));
          allQuizBankQuestions.push(...(data?.quiz_bank_questions || []));
        }

        setProgress(85, "Saving TJ Blocks...");
        if (allBlocks.length > 0) {
          const blocksToInsert = allBlocks.map((block: any) => makeBlockInsert(block, moduleData.id, block.page_number || 1));
          await supabase.from("uploaded_module_blocks").insert(blocksToInsert);
        }
        if (allQuizBankQuestions.length > 0) {
          await supabase.from("uploaded_module_quiz_bank").insert(
            allQuizBankQuestions.map((q: any) => ({ module_id: moduleData.id, question_text: q.question_text || "", option_a: q.option_a || "", option_b: q.option_b || "", option_c: q.option_c || "", option_d: q.option_d || "", correct_option: q.correct_option || "A", explanation: q.explanation || "", source_slide: q.source_slide || null }))
          );
        }
        await supabase.from("uploaded_modules").update({ status: "ready", processing_phase: "ready" }).eq("id", moduleData.id);
        setState(prev => ({ ...prev, isProcessing: false, progress: 100, progressMessage: "Complete!", completed: true, summary: { blocksCreated: allBlocks.length, quizBankCreated: allQuizBankQuestions.length } }));
        processingRef.current = false;
        return;
      }

      // ═══ TEXT-BASED PATH ═══
      let parsedPages: ParsedPage[] = [];
      let fullText = "";

      if (isPdf) {
        setProgress(10, "Extracting text from PDF pages...");
        const range = options.pageMode === "range" ? { start: options.pageStart, end: options.pageEnd } : undefined;
        const parsed = await extractPdfText(file, range);
        parsedPages = parsed.pages;
        if (parsedPages.length === 0) throw new Error("No text could be extracted from this PDF.");
        fullText = parsedPages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n");
      } else if (isText) {
        const text = await file.text();
        parsedPages = [{ pageNumber: 1, text }];
        fullText = text;
      } else {
        setProgress(15, "Uploading document...");
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file);
        if (uploadError) throw uploadError;
        parsedPages = [{ pageNumber: 1, text: `[FILE:${filePath}] ${file.name}` }];
        fullText = parsedPages[0].text;
      }

      // PHASE 1: Structure analysis
      setProgress(20, "Analyzing document structure...");
      let structureData: any = null;
      let chapters: ChapterInfo[] = [];
      let detectedSubject = "";
      let documentType = "";
      try {
        const { data: structResult, error: structError } = await supabase.functions.invoke("analyze-document-structure", {
          body: { content: fullText.slice(0, 12000), filename: file.name },
        });
        if (!structError && structResult?.chapters) {
          structureData = structResult;
          chapters = structResult.chapters || [];
          detectedSubject = structResult.subject || "";
          documentType = structResult.document_type || "";
        }
      } catch (e) { console.warn("Structure analysis failed:", e); }

      // PHASE 2: Create module
      setProgress(35, "Building document overview...");
      const moduleTitle = structureData?.document_title || file.name.replace(/\.[^/.]+$/, "");
      const { data: moduleData, error: moduleError } = await supabase
        .from("uploaded_modules")
        .insert({ user_id: userId, title: moduleTitle, status: "processing", source_filename: file.name, is_instructor_mode: false, document_type: documentType, detected_subject: detectedSubject, total_chapters: chapters.length, processing_phase: "generating_overview" })
        .select().single();
      if (moduleError) throw moduleError;

      setState(prev => ({ ...prev, activeModuleId: moduleData.id, activeModuleName: moduleTitle }));

      if (structureData) {
        await supabase.from("module_document_overview").insert({
          module_id: moduleData.id, document_title: structureData.document_title || "", document_type: documentType, subject: detectedSubject, total_chapters: chapters.length, chapter_outline: structureData.chapters || [], key_themes: structureData.key_themes || [], overview_summary: structureData.overview_summary || "",
        });
      }

      const chapterIdMap: Record<number, string> = {};
      for (const ch of chapters) {
        const { data: chData } = await supabase.from("module_chapters").insert({
          module_id: moduleData.id, chapter_number: ch.number, title: ch.title, page_range_start: ch.page_start, page_range_end: ch.page_end, metadata: { subsections: ch.subsections || [] },
        }).select("id").single();
        if (chData) chapterIdMap[ch.number] = chData.id;
      }

      // PHASE 3: Chunk + process
      await supabase.from("uploaded_modules").update({ processing_phase: "processing_chunks" }).eq("id", moduleData.id);
      const structuredChunks = chunkByStructure(parsedPages, chapters, 6000);
      const totalChunks = structuredChunks.length;
      const allBlocks: any[] = [];
      const allQuizBankQuestions: any[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = structuredChunks[i];
        setProgress(45 + Math.floor(((i + 1) / totalChunks) * 40),
          chapters.length > 0
            ? `Processing Chapter ${chunk.chapterNumber}: ${chunk.sectionTitle} (${i + 1}/${totalChunks})...`
            : `Analyzing content... (pass ${i + 1} of ${totalChunks})`
        );

        const chunkContent = chunk.pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n");
        const { data, error } = await supabase.functions.invoke("process-upload", {
          body: { content: chunkContent, moduleId: moduleData.id, filename: file.name, chunkIndex: i + 1, totalChunks, subject: detectedSubject, documentType, chapterNumber: chunk.chapterNumber, sectionTitle: chunk.sectionTitle, pageRange: chunk.pageRange },
        });
        if (error) { console.error(`Chunk ${i + 1} failed:`, error); continue; }
        const blocks = (data?.blocks || []).map((b: any) => ({ ...b, _chapterNumber: chunk.chapterNumber, _chunkIndex: chunk.chunkIndex }));
        allBlocks.push(...blocks);
        allQuizBankQuestions.push(...(data?.quiz_bank_questions || []));
      }

      // PHASE 4: Save
      setProgress(88, "Saving TJ Blocks...");
      if (allBlocks.length > 0) {
        const blocksToInsert = allBlocks.map((block: any) => {
          const chapterId = chapterIdMap[block._chapterNumber] || null;
          return makeBlockInsert(block, moduleData.id, block.page_number || 1, chapterId);
        });
        await supabase.from("uploaded_module_blocks").insert(blocksToInsert);
      }
      if (allQuizBankQuestions.length > 0) {
        await supabase.from("uploaded_module_quiz_bank").insert(
          allQuizBankQuestions.map((q: any) => ({ module_id: moduleData.id, question_text: q.question_text || "", option_a: q.option_a || "", option_b: q.option_b || "", option_c: q.option_c || "", option_d: q.option_d || "", correct_option: q.correct_option || "A", explanation: q.explanation || "", source_slide: q.source_slide || null }))
        );
      }
      await supabase.from("uploaded_modules").update({ status: "ready", processing_phase: "ready" }).eq("id", moduleData.id);

      setState(prev => ({
        ...prev, isProcessing: false, progress: 100, progressMessage: "Complete!", completed: true,
        summary: { blocksCreated: allBlocks.length, quizBankCreated: allQuizBankQuestions.length, chaptersDetected: chapters.length || undefined },
      }));
    } catch (e: any) {
      console.error("Background processing error:", e);
      setState(prev => ({ ...prev, isProcessing: false, error: e.message || "Processing failed", progressMessage: "Failed" }));
    } finally {
      processingRef.current = false;
    }
  }, [setProgress]);

  return (
    <BackgroundUploadContext.Provider value={{ ...state, startProcessing, dismiss }}>
      {children}
    </BackgroundUploadContext.Provider>
  );
};
