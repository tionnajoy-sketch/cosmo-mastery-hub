import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Upload, FileText, Loader2, Sparkles, Lock,
  BookOpen, Eye, Lightbulb, Heart, MessageCircle, Brain,
  Search, Layers, Wand2, CheckCircle2, Mail, ExternalLink,
  AlertTriangle, ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { extractPdfText } from "@/lib/pdfParser";
import { useBackgroundUpload } from "@/contexts/BackgroundUploadContext";

interface ConversionSummary {
  totalPagesInDoc: number;
  pagesProcessed: number[];
  pagesSkipped: number[];
  blocksCreated: number;
  totalTerms: number;
  quizBankCreated: number;
  chunksProcessed: number;
  totalChunks: number;
  detectedSubject?: string;
  documentType?: string;
  chaptersDetected?: number;
}

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const bgUpload = useBackgroundUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [selectedMode, setSelectedMode] = useState<"student" | null>("student");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Page range options
  const [pageMode, setPageMode] = useState<"all" | "range">("all");
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(999);
  const [detectedPageCount, setDetectedPageCount] = useState<number | null>(null);

  // Post-conversion summary (now read from background context)
  const [summary, setSummary] = useState<ConversionSummary | null>(null);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "image/jpeg", "image/png", "image/webp", "image/gif",
  ];

  const handleFileSelect = async (selectedFile: File) => {
    const isImage = imageTypes.includes(selectedFile.type) || /\.(jpe?g|png|webp|gif)$/i.test(selectedFile.name);
    if (!acceptedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".txt") && !isImage) {
      toast({ title: "Unsupported file type", description: "Please upload PDF, PowerPoint, Word, image, or text files.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    setMultiFiles([]);
    setSummary(null);

    if (selectedFile.type === "application/pdf") {
      try {
        const result = await extractPdfText(selectedFile, { start: 1, end: 1 });
        setDetectedPageCount(result.totalPages);
        setPageEnd(result.totalPages);
      } catch {
        setDetectedPageCount(null);
      }
    } else {
      setDetectedPageCount(null);
    }
  };

  const handleMultiFileSelect = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(f =>
      imageTypes.includes(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
    );
    if (imageFiles.length === 0) {
      toast({ title: "No valid images", description: "Please select image files (JPG, PNG, WEBP, GIF).", variant: "destructive" });
      return;
    }
    setMultiFiles(imageFiles);
    setFile(imageFiles[0]);
    setSummary(null);
    setDetectedPageCount(imageFiles.length);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleConvert = () => {
    if (!user || !file) return;
    if (bgUpload.isProcessing) {
      toast({ title: "Already processing", description: "A document is already being processed. Please wait.", variant: "destructive" });
      return;
    }
    bgUpload.startProcessing(file, user.id, { pageMode, pageStart, pageEnd }, multiFiles.length > 0 ? multiFiles : undefined);
    toast({ title: "Processing started", description: "You can navigate away — we'll notify you when it's done." });
  };

  const processing = bgUpload.isProcessing;
  const progress = bgUpload.progress;
  const progressMessage = bgUpload.progressMessage;

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
            Upload your notes, slides, or documents and the system will transform them into structured TJ Anderson Layer Method™: Core Cross Agent™ learning blocks designed to help you understand and retain key concepts.
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
                  {multiFiles.length > 1 ? (
                    <ImageIcon className="h-10 w-10 mb-3" style={{ color: "hsl(145 50% 42%)" }} />
                  ) : (
                    <FileText className="h-10 w-10 mb-3" style={{ color: "hsl(145 50% 42%)" }} />
                  )}
                  <p className="text-sm font-semibold text-foreground">
                    {multiFiles.length > 1 ? `${multiFiles.length} images selected` : file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {multiFiles.length > 1 
                      ? `${multiFiles.map(f => f.name).join(", ")} · Click or drop to replace`
                      : `${(file.size / 1024 / 1024).toFixed(2)} MB${detectedPageCount ? ` · ${detectedPageCount} pages` : ""} · Click or drop to replace`
                    }
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Drop your file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PowerPoint, Word, images (JPG, PNG), or plain text</p>
                </>
              )}
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,.gif"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const allImages = Array.from(files).every(f => 
                imageTypes.includes(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
              );
              if (files.length > 1 && allImages) {
                handleMultiFileSelect(files);
              } else if (files[0]) {
                handleFileSelect(files[0]);
              }
            }}
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
              <Button onClick={handleConvert} className="w-full py-6 text-base gap-2">
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

                {/* Detected structure info */}
                {(summary.detectedSubject || summary.chaptersDetected) && (
                  <div className="bg-primary/5 rounded-lg p-3 mb-4">
                    {summary.detectedSubject && (
                      <p className="text-sm text-foreground mb-1">
                        <span className="font-semibold">Subject Detected:</span> {summary.detectedSubject}
                      </p>
                    )}
                    {summary.documentType && (
                      <p className="text-sm text-foreground mb-1">
                        <span className="font-semibold">Document Type:</span> {summary.documentType}
                      </p>
                    )}
                    {summary.chaptersDetected && summary.chaptersDetected > 0 && (
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Chapters Detected:</span> {summary.chaptersDetected}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">{summary.totalPagesInDoc}</p>
                    <p className="text-xs text-muted-foreground">Total Pages</p>
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
                    <p className="text-2xl font-bold text-foreground">{summary.quizBankCreated}</p>
                    <p className="text-xs text-muted-foreground">Quiz Bank Questions</p>
                  </div>
                </div>

                {summary.totalChunks > 1 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Document was processed in {summary.totalChunks} structure-aware passes.
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
                If a student uploads notes about skin structure, the system will generate learning blocks such as <strong className="text-foreground">Epidermis</strong>, <strong className="text-foreground">Dermis</strong>, <strong className="text-foreground">Subcutaneous Layer</strong>, <strong className="text-foreground">Melanin</strong>, and <strong className="text-foreground">Sebaceous Glands</strong>. Each concept will be organized into TJ learning blocks that follow the TJ Anderson Layer Method™: Core Cross Agent™ framework.
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
              Instructor Mode is designed for licensed educators and cosmetology schools using the TJ Anderson Layer Method™: Core Cross Agent™ to create structured curriculum blocks for their students. This feature allows instructors to upload lesson plans, slides, and classroom materials and automatically convert them into TJ curriculum blocks.
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
