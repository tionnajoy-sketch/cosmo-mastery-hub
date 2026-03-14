import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, FileText, Loader2, Sparkles, Lock,
  BookOpen, Eye, Lightbulb, Heart, MessageCircle, Brain,
  Search, Layers, Wand2, CheckCircle2, Mail, ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { extractPdfText, chunkPages, type ParsedPage } from "@/lib/pdfParser";

interface ConversionSummary {
  totalPagesInDoc: number;
  pagesProcessed: number[];
  pagesSkipped: number[];
  blocksCreated: number;
  totalTerms: number;
  quizBankCreated: number;
  chunksProcessed: number;
  totalChunks: number;
}

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedMode, setSelectedMode] = useState<"student" | null>("student");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Page range options
  const [pageMode, setPageMode] = useState<"all" | "range">("all");
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(999);
  const [detectedPageCount, setDetectedPageCount] = useState<number | null>(null);

  // Post-conversion summary
  const [summary, setSummary] = useState<ConversionSummary | null>(null);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];

  const handleFileSelect = async (selectedFile: File) => {
    if (!acceptedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".txt")) {
      toast({ title: "Unsupported file type", description: "Please upload PDF, PowerPoint, Word, or text files.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    setSummary(null);

    if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt")) {
      const text = await selectedFile.text();
      setTextContent(text);
      setDetectedPageCount(null);
    } else if (selectedFile.type === "application/pdf") {
      setTextContent("");
      // Detect page count for PDFs
      try {
        const result = await extractPdfText(selectedFile, { start: 1, end: 1 });
        setDetectedPageCount(result.totalPages);
        setPageEnd(result.totalPages);
      } catch {
        setDetectedPageCount(null);
      }
    } else {
      setTextContent("");
      setDetectedPageCount(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const makeBlockInsert = (block: any, moduleId: string, blockNumber: number) => ({
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
    slide_type: block.slide_type || "concept",
    instructor_notes: block.instructor_notes || "",
    image_url: block.image_url || "",
  });

  const convertToBlocks = async () => {
    if (!user || !file) return;

    setProcessing(true);
    setProgress(5);
    setProgressMessage("Preparing document...");
    setSummary(null);

    try {
      const isPdf = file.type === "application/pdf";
      const isText = file.type === "text/plain" || file.name.endsWith(".txt");

      // Step 1: Parse content
      let contentChunks: string[] = [];
      let totalPagesInDoc = 0;
      let processedPageNumbers: number[] = [];
      let skippedPages: number[] = [];

      if (isPdf) {
        setProgressMessage("Extracting text from PDF pages...");
        setProgress(10);

        const range = pageMode === "range" ? { start: pageStart, end: pageEnd } : undefined;
        const parsed = await extractPdfText(file, range);
        totalPagesInDoc = parsed.totalPages;

        if (parsed.pages.length === 0) {
          throw new Error("No text could be extracted from this PDF. It may be image-based or scanned. Try a text-based PDF.");
        }

        processedPageNumbers = parsed.pages.map((p) => p.pageNumber);

        // Figure out which pages were skipped (had no text)
        const startP = range ? range.start : 1;
        const endP = range ? Math.min(range.end, totalPagesInDoc) : totalPagesInDoc;
        for (let i = startP; i <= endP; i++) {
          if (!processedPageNumbers.includes(i)) {
            skippedPages.push(i);
          }
        }

        // Chunk the pages for multi-pass processing
        // Chunk pages — send 3-5 pages per chunk for strict 1:1 slide-to-block mapping
        const pageChunks = chunkPages(parsed.pages, 6000);
        contentChunks = pageChunks.map((chunk) =>
          chunk.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n")
        );
      } else if (isText) {
        const text = textContent || (await file.text());
        totalPagesInDoc = 1;
        processedPageNumbers = [1];
        // Chunk long text files
        const chunkSize = 10000;
        for (let i = 0; i < text.length; i += chunkSize) {
          contentChunks.push(text.slice(i, i + chunkSize));
        }
      } else {
        // Non-PDF, non-text: upload to storage and send reference
        setProgress(15);
        setProgressMessage("Uploading document...");
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file);
        if (uploadError) throw uploadError;
        contentChunks = [`[FILE:${filePath}] ${file.name}`];
        totalPagesInDoc = 1;
        processedPageNumbers = [1];
      }

      setProgress(25);
      setProgressMessage("Creating module...");

      // Step 2: Create module record
      const { data: moduleData, error: moduleError } = await supabase
        .from("uploaded_modules")
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          status: "processing",
          source_filename: file.name,
          is_instructor_mode: false,
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      // Step 3: Process each chunk through the AI
      const allBlocks: any[] = [];
      const allQuizBankQuestions: any[] = [];
      const totalChunks = contentChunks.length;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkProgress = 30 + Math.floor(((chunkIndex + 1) / totalChunks) * 50);
        setProgress(chunkProgress);
        setProgressMessage(
          `Analyzing content... (pass ${chunkIndex + 1} of ${totalChunks})`
        );

        const { data, error } = await supabase.functions.invoke("process-upload", {
          body: {
            content: contentChunks[chunkIndex],
            moduleId: moduleData.id,
            filename: file.name,
            chunkIndex: chunkIndex + 1,
            totalChunks,
          },
        });

        if (error) {
          console.error(`Chunk ${chunkIndex + 1} failed:`, error);
          // Continue processing remaining chunks instead of failing entirely
          continue;
        }

        const blocks = data?.blocks || [];
        const quizQ = data?.quiz_bank_questions || [];
        allBlocks.push(...blocks);
        allQuizBankQuestions.push(...quizQ);
      }

      setProgress(85);
      setProgressMessage("Saving TJ Blocks...");

      // Step 4: 1:1 slide-to-block mapping — each block gets its page number
      if (allBlocks.length > 0) {
        const blocksToInsert = allBlocks.map((block: any) => {
          // Use page_number from AI response as the block_number (1:1 mapping)
          const pageNum = block.page_number || 1;
          return makeBlockInsert(block, moduleData.id, pageNum);
        });

        const { error: insertError } = await supabase.from("uploaded_module_blocks").insert(blocksToInsert);
        if (insertError) throw insertError;
      }
      
      const actualBlockCount = allBlocks.length;

      // Insert quiz bank questions
      if (allQuizBankQuestions.length > 0) {
        const qbToInsert = allQuizBankQuestions.map((q: any) => ({
          module_id: moduleData.id,
          question_text: q.question_text || "",
          option_a: q.option_a || "",
          option_b: q.option_b || "",
          option_c: q.option_c || "",
          option_d: q.option_d || "",
          correct_option: q.correct_option || "A",
          explanation: q.explanation || "",
          source_slide: q.source_slide || null,
        }));

        await supabase.from("uploaded_module_quiz_bank").insert(qbToInsert);
      }

      await supabase.from("uploaded_modules").update({ status: "ready" }).eq("id", moduleData.id);

      setProgress(100);
      setProgressMessage("Complete!");

      const convSummary: ConversionSummary = {
        totalPagesInDoc,
        pagesProcessed: processedPageNumbers,
        pagesSkipped: skippedPages,
        blocksCreated: actualBlockCount,
        totalTerms: allBlocks.length,
        quizBankCreated: allQuizBankQuestions.length,
        chunksProcessed: totalChunks,
        totalChunks,
      };
      setSummary(convSummary);

      toast({
        title: "Conversion complete!",
        description: `Created ${actualBlockCount} TJ Blocks with ${allBlocks.length} terms from ${processedPageNumbers.length} pages.`,
      });

      // Don't auto-navigate so user can see the summary
    } catch (e: any) {
      console.error("Conversion error:", e);
      toast({ title: "Conversion failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const howItWorksSteps = [
    { icon: Upload, title: "Upload", desc: "Upload your notes, slides, or study materials." },
    { icon: Search, title: "Analyze", desc: "The system reads every page of your document and extracts key concepts." },
    { icon: Layers, title: "Transform", desc: "Each concept is converted into a TJ Anderson learning block across multiple passes if needed." },
    { icon: Wand2, title: "Complete", desc: "Each TJ Block automatically includes structured learning layers." },
  ];

  const blockLayers = [
    { icon: BookOpen, label: "Definition", color: "hsl(var(--primary))" },
    { icon: Eye, label: "Visual explanation", color: "hsl(270 45% 55%)" },
    { icon: Lightbulb, label: "TJ-style Metaphor", color: "hsl(42 55% 48%)" },
    { icon: Heart, label: "Affirmation", color: "hsl(340 55% 55%)" },
    { icon: MessageCircle, label: "Reflection prompt", color: "hsl(195 55% 45%)" },
    { icon: Brain, label: "Recall quiz question", color: "hsl(145 45% 42%)" },
  ];

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Turn Your Notes Into TJ Anderson Study Blocks
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Upload your notes, slides, or documents and the system will transform them into structured TJ Anderson Layer Method™ learning blocks designed to help you understand and retain key concepts.
          </p>
          <p className="text-xs italic mb-8" style={{ color: "hsl(185 30% 50%)" }}>
            You're in a safe place to learn, not to be perfect. Take your time.
          </p>
        </motion.div>

        {/* Mode Selection */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMode("student")}
              className="p-5 rounded-xl text-left transition-all border-2"
              style={{
                background: selectedMode === "student" ? "hsl(var(--primary))" : "hsl(var(--card))",
                color: selectedMode === "student" ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                borderColor: selectedMode === "student" ? "hsl(var(--primary))" : "hsl(var(--border))",
                boxShadow: selectedMode === "student" ? "0 4px 20px hsl(var(--primary) / 0.3)" : "none",
              }}
            >
              <Sparkles className="h-6 w-6 mb-2" />
              <p className="text-sm font-bold">Student Mode</p>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                Convert your personal notes into structured TJ study blocks for personal learning and review.
              </p>
            </button>

            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className="p-5 rounded-xl text-left transition-all border-2 relative"
              style={{
                background: "hsl(var(--card))",
                color: "hsl(var(--muted-foreground))",
                borderColor: "hsl(var(--border))",
              }}
            >
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                License Required
              </div>
              <Lock className="h-6 w-6 mb-2" />
              <p className="text-sm font-bold">Instructor Mode</p>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                Licensed educators can upload classroom materials and convert them into TJ curriculum blocks.
              </p>
            </button>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
          <p className="text-sm font-semibold text-foreground mb-3">Upload Your Study Material</p>
          <Card
            className="border-2 border-dashed cursor-pointer hover:shadow-md transition-all"
            style={{
              borderColor: file ? "hsl(145 50% 42%)" : "hsl(var(--border))",
              background: file ? "hsl(145 30% 97%)" : "hsl(var(--card))",
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <CardContent className="p-8 flex flex-col items-center text-center">
              {file ? (
                <>
                  <FileText className="h-10 w-10 mb-3" style={{ color: "hsl(145 50% 42%)" }} />
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {detectedPageCount && ` · ${detectedPageCount} pages`}
                    {" "}· Click or drop to replace
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Drop your file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PowerPoint, Word, or plain text</p>
                </>
              )}
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.ppt,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
          />
        </motion.div>

        {/* Page Range Option (PDF only) */}
        {isPdf && !processing && !summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border bg-card">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Page Selection</p>
                <Select value={pageMode} onValueChange={(v) => setPageMode(v as "all" | "range")}>
                  <SelectTrigger className="w-full mb-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Convert entire document{detectedPageCount ? ` (${detectedPageCount} pages)` : ""}
                    </SelectItem>
                    <SelectItem value="range">Convert specific page range</SelectItem>
                  </SelectContent>
                </Select>

                {pageMode === "range" && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Start page</Label>
                      <Input
                        type="number"
                        min={1}
                        max={detectedPageCount || 999}
                        value={pageStart}
                        onChange={(e) => setPageStart(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                    <span className="text-muted-foreground mt-5">–</span>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">End page</Label>
                      <Input
                        type="number"
                        min={1}
                        max={detectedPageCount || 999}
                        value={pageEnd}
                        onChange={(e) => setPageEnd(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Convert Button + Progress */}
        {file && !summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            {processing ? (
              <Card className="border-0 shadow-md bg-muted/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">{progressMessage}</p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    This may take a few minutes for large documents. Every page is being processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={convertToBlocks} className="w-full py-6 text-base gap-2">
                <Sparkles className="h-5 w-5" /> Convert to TJ Blocks
              </Button>
            )}
          </motion.div>
        )}

        {/* Post-Conversion Summary */}
        {summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="border-2 border-primary/30 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Conversion Summary</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">{summary.totalPagesInDoc}</p>
                    <p className="text-xs text-muted-foreground">Total Pages in PDF</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">{summary.pagesProcessed.length}</p>
                    <p className="text-xs text-muted-foreground">Pages Processed</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{summary.blocksCreated}</p>
                    <p className="text-xs text-muted-foreground">TJ Blocks Created</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{summary.totalTerms}</p>
                    <p className="text-xs text-muted-foreground">Total Terms Extracted</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">{summary.quizBankCreated}</p>
                    <p className="text-xs text-muted-foreground">Quiz Bank Questions</p>
                  </div>
                </div>

                {summary.totalChunks > 1 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Document was processed in {summary.totalChunks} passes to ensure full coverage.
                  </p>
                )}

                {summary.pagesSkipped.length > 0 && (
                  <div className="bg-accent/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-accent-foreground" />
                      <p className="text-sm font-semibold text-foreground">Pages with no extractable text</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pages {summary.pagesSkipped.join(", ")} had no text content (may be images or blank).
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      // Find module ID from the URL we would have navigated to
                      navigate("/my-modules");
                    }}
                  >
                    <BookOpen className="h-4 w-4" /> View My Modules
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setFile(null);
                      setSummary(null);
                      setProgress(0);
                      setDetectedPageCount(null);
                      setPageMode("all");
                    }}
                  >
                    Convert Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How This Works */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">How This Works</h2>
          <div className="space-y-4">
            {howItWorksSteps.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What Each TJ Block Includes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">What Each TJ Block Includes</h2>
          <div className="grid grid-cols-2 gap-3">
            {blockLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className="h-5 w-5 flex-shrink-0" style={{ color: layer.color }} />
                  <span className="text-sm text-foreground">{layer.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Example */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-8">
          <Card className="border-0 bg-muted/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-bold text-foreground">Example</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If a student uploads notes about skin structure, the system will generate learning blocks such as <strong className="text-foreground">Epidermis</strong>, <strong className="text-foreground">Dermis</strong>, <strong className="text-foreground">Subcutaneous Layer</strong>, <strong className="text-foreground">Melanin</strong>, and <strong className="text-foreground">Sebaceous Glands</strong>. Each concept will be organized into TJ learning blocks that follow the TJ Anderson Layer Method™ framework.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Instructor Mode License Modal */}
      <Dialog open={isLicenseModalOpen} onOpenChange={setIsLicenseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Instructor Mode
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2">
              Instructor Mode is designed for licensed educators and cosmetology schools using the TJ Anderson Layer Method™ to create structured curriculum blocks for their students. This feature allows instructors to upload lesson plans, slides, and classroom materials and automatically convert them into TJ curriculum blocks.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="default" className="gap-2" onClick={() => window.open("https://tjandersonmethod.com", "_blank")}>
              <ExternalLink className="h-4 w-4" /> Learn About Instructor Licensing
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open("mailto:hello@tjandersonmethod.com?subject=School%20Licensing%20Inquiry", "_blank")}>
              <Mail className="h-4 w-4" /> Contact for School Licensing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadPage;
