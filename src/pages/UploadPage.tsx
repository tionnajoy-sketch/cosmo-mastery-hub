import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, FileText, Loader2, Sparkles, Lock,
  BookOpen, Eye, Lightbulb, Heart, MessageCircle, Brain,
  Search, Layers, Wand2, CheckCircle2, Mail, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedMode, setSelectedMode] = useState<"student" | null>("student");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textContent, setTextContent] = useState("");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

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
    if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt")) {
      const text = await selectedFile.text();
      setTextContent(text);
    } else {
      setTextContent("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const convertToBlocks = async () => {
    if (!user || !file) return;

    setProcessing(true);
    setProgress(10);

    try {
      let content = textContent;

      if (!content) {
        setProgress(20);
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file);
        if (uploadError) throw uploadError;
        content = `[FILE:${filePath}] ${file.name}`;
      }

      setProgress(30);

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

      setProgress(50);

      const { data, error } = await supabase.functions.invoke("process-upload", {
        body: {
          content: content.slice(0, 50000),
          moduleId: moduleData.id,
          filename: file.name,
        },
      });

      if (error) throw error;

      setProgress(80);

      if (data?.blocks && Array.isArray(data.blocks)) {
        const blocksToInsert = data.blocks.map((block: any, index: number) => ({
          module_id: moduleData.id,
          block_number: Math.floor(index / 5) + 1,
          term_title: block.term_title || block.title || `Term ${index + 1}`,
          definition: block.definition || "",
          visualization_desc: block.visualization_desc || "",
          metaphor: block.metaphor || "",
          affirmation: block.affirmation || "",
          reflection_prompt: block.reflection_prompt || "",
          quiz_question: block.quiz_question || "",
          quiz_options: block.quiz_options || [],
          quiz_answer: block.quiz_answer || "",
        }));

        const { error: insertError } = await supabase.from("uploaded_module_blocks").insert(blocksToInsert);
        if (insertError) throw insertError;

        await supabase.from("uploaded_modules").update({ status: "ready" }).eq("id", moduleData.id);
      }

      setProgress(100);
      toast({ title: "Conversion complete!", description: "Your TJ Blocks are ready to explore." });
      setTimeout(() => navigate(`/module/${moduleData.id}`), 800);
    } catch (e: any) {
      console.error("Conversion error:", e);
      toast({ title: "Conversion failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const howItWorksSteps = [
    { icon: Upload, title: "Upload", desc: "Upload your notes, slides, or study materials." },
    { icon: Search, title: "Analyze", desc: "The system identifies important concepts, key terms, and definitions." },
    { icon: Layers, title: "Transform", desc: "Each concept is converted into a TJ Anderson learning block." },
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Turn Your Notes Into TJ Anderson Study Blocks
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Upload your notes, slides, or documents and the system will transform them into structured TJ Anderson Layer Method™ learning blocks designed to help you understand and retain key concepts.
          </p>
        </motion.div>

        {/* Mode Selection */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            {/* Student Mode */}
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

            {/* Instructor Mode */}
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
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Click or drop to replace
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

        {/* Convert Button + Progress */}
        {file && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            {processing ? (
              <Card className="border-0 shadow-md bg-muted/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {progress < 30 ? "Uploading document..." : progress < 60 ? "Analyzing content..." : progress < 90 ? "Building TJ Blocks..." : "Finishing up..."}
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">This may take a minute depending on the document size.</p>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={convertToBlocks} className="w-full py-6 text-base gap-2">
                <Sparkles className="h-5 w-5" /> Convert to TJ Blocks
              </Button>
            )}
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
