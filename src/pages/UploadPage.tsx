import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"student" | "instructor">("student");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textContent, setTextContent] = useState("");

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
      if (mode === "instructor") {
        toast({ title: "License Required", description: "Instructor Mode requires a school license. Contact us at hello@tjandersonmethod.com for details." });
        return;
      }

    setProcessing(true);
    setProgress(10);

    try {
      let content = textContent;

      // For non-text files, upload to storage and extract text via edge function
      if (!content) {
        setProgress(20);
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file);
        if (uploadError) throw uploadError;
        
        // For binary files, we send the file path; the edge function will handle extraction
        content = `[FILE:${filePath}] ${file.name}`;
      }

      setProgress(30);

      // Create the module record
      const { data: moduleData, error: moduleError } = await supabase
        .from("uploaded_modules")
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          status: "processing",
          source_filename: file.name,
          is_instructor_mode: mode === "instructor",
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      setProgress(50);

      // Call the process-upload edge function
      const { data, error } = await supabase.functions.invoke("process-upload", {
        body: {
          content: content.slice(0, 50000), // Limit content size
          moduleId: moduleData.id,
          filename: file.name,
        },
      });

      if (error) throw error;

      setProgress(80);

      if (data?.blocks && Array.isArray(data.blocks)) {
        // Insert generated blocks
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

        // Update module status
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

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(270 20% 97%), hsl(325 15% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2 text-foreground">Upload to TJ Blocks</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Transform your study materials into structured TJ Anderson Layer Method™ learning blocks. Upload your notes, slides, or documents and let the system do the rest.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setMode("student")}
              className="flex-1 p-4 rounded-xl text-left transition-all"
              style={{
                background: mode === "student" ? "hsl(270 40% 52%)" : "hsl(0 0% 100%)",
                color: mode === "student" ? "white" : "hsl(270 20% 30%)",
                boxShadow: mode === "student" ? "0 4px 20px hsl(270 40% 52% / 0.3)" : "0 1px 4px hsl(0 0% 0% / 0.08)",
              }}
            >
              <Sparkles className="h-5 w-5 mb-1" />
              <p className="text-sm font-semibold">Student Mode</p>
              <p className="text-xs opacity-80">Convert your own notes</p>
            </button>
            <button
              onClick={() => setMode("instructor")}
              className="flex-1 p-4 rounded-xl text-left transition-all relative"
              style={{
                background: mode === "instructor" ? "hsl(42 55% 48%)" : "hsl(0 0% 100%)",
                color: mode === "instructor" ? "white" : "hsl(42 25% 30%)",
                boxShadow: mode === "instructor" ? "0 4px 20px hsl(42 55% 48% / 0.3)" : "0 1px 4px hsl(0 0% 0% / 0.08)",
              }}
            >
              <Lock className="h-5 w-5 mb-1" />
              <p className="text-sm font-semibold">Instructor Mode</p>
              <p className="text-xs opacity-80">License required</p>
            </button>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card
            className="border-2 border-dashed cursor-pointer hover:shadow-md transition-all mb-6"
            style={{ borderColor: file ? "hsl(145 50% 42%)" : "hsl(270 20% 80%)", background: file ? "hsl(145 30% 97%)" : "hsl(0 0% 100%)" }}
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
                  <Upload className="h-10 w-10 mb-3" style={{ color: "hsl(270 30% 60%)" }} />
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {processing ? (
              <Card className="border-0 shadow-md mb-6" style={{ background: "hsl(270 20% 97%)" }}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(270 40% 52%)" }} />
                    <p className="text-sm font-medium text-foreground">
                      {progress < 30 ? "Uploading document..." : progress < 60 ? "Analyzing content..." : progress < 90 ? "Building TJ Blocks..." : "Finishing up..."}
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">This may take a minute depending on the document size.</p>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={convertToBlocks}
                className="w-full py-6 text-base gap-2 mb-6"
                style={{ background: "hsl(270 40% 52%)", color: "white" }}
              >
                <Sparkles className="h-5 w-5" /> Convert to TJ Blocks
              </Button>
            )}
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm" style={{ background: "hsl(270 15% 96%)" }}>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-3 text-foreground">Each generated TJ Block includes:</p>
              <div className="space-y-2">
                {[
                  { emoji: "📖", label: "Definition" },
                  { emoji: "👁️", label: "Visual explanation" },
                  { emoji: "🌉", label: "TJ-style Metaphor" },
                  { emoji: "💛", label: "Affirmation" },
                  { emoji: "🪞", label: "Reflection prompt" },
                  { emoji: "🧠", label: "Recall quiz question" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span>{item.emoji}</span>
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadPage;
