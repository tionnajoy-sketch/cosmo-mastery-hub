import { useState, useRef, useEffect, useCallback } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Loader2, Volume2, VolumeX, Square,
  Mic, MessageCircle, Brain, Sparkles, CheckCircle2,
  XCircle, RefreshCw, ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import SpeakButton from "@/components/SpeakButton";
import tjBackground from "@/assets/tj-background.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type TeachingPhase =
  | "idle"
  | "prompted"
  | "awaiting_answer"
  | "evaluating"
  | "correct"
  | "partial"
  | "incorrect"
  | "teaching"
  | "retest";

interface AskTJFullScreenProps {
  sectionName?: string;
  sectionId?: string;
  blockNumber?: string;
  terms?: { term: string; definition: string }[];
  learningStyle?: string;
}

// Global event bus
const listeners = new Set<(withWelcome: boolean) => void>();
export const openTJChat = (withWelcome = false) => {
  listeners.forEach((fn) => fn(withWelcome));
};

const AskTJFullScreen = ({ sectionName, sectionId, blockNumber, terms, learningStyle }: AskTJFullScreenProps) => {
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [phase, setPhase] = useState<TeachingPhase>("idle");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTerm, setCurrentTerm] = useState<{ term: string; definition: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Listen for external open requests
  useEffect(() => {
    const handler = (withWelcome: boolean) => {
      setOpen(true);
      if (withWelcome && messages.length === 0) {
        const welcome = "Hey love, I'm TJ. I'm here to teach you, not just quiz you. Ask me anything, or I'll generate a question to get us started. Ready?";
        setMessages([{ role: "assistant", content: welcome }]);
        if (voiceEnabled) speakText(welcome);
      }
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [messages.length, voiceEnabled]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopSpeaking();
    const plain = text.replace(/#{1,6}\s/g, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[-*]\s/g, "").replace(/\n{2,}/g, ". ").replace(/\n/g, " ").trim();
    if (!plain) return;
    try {
      setIsSpeaking(true);
      const audio = await fetchTTSWithFallback(plain, { usageType: "dynamic" });
      if (!audio) { setIsSpeaking(false); return; }
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); };
      await audio.play();
    } catch { setIsSpeaking(false); }
  }, [voiceEnabled, stopSpeaking]);

  const callAI = useCallback(async (msgs: Message[]) => {
    const { data, error } = await supabase.functions.invoke("ai-mentor-chat", {
      body: { messages: msgs, sectionName, sectionId, blockNumber, terms: terms?.slice(0, 20), learningStyle },
    });
    if (error) throw error;
    return data?.response || "I couldn't process that. Let's try again.";
  }, [sectionName, sectionId, blockNumber, terms, learningStyle]);

  const generateQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const randomTerm = terms?.[Math.floor(Math.random() * (terms?.length || 1))];
      setCurrentTerm(randomTerm || null);
      const questionPrompt = randomTerm
        ? `Generate a question about "${randomTerm.term}" (definition: ${randomTerm.definition}). Ask the student what they know about this concept. Don't give the answer — make them think first.`
        : "Generate a cosmetology concept question for the student. Ask them to explain a concept first before you teach it.";
      
      const response = await callAI([{ role: "user", content: questionPrompt }]);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setCurrentQuestion(response);
      setPhase("awaiting_answer");
      if (voiceEnabled) speakText(response);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Let me think of a question... try again in a moment." }]); }
    setLoading(false);
  }, [terms, callAI, voiceEnabled, speakText]);

  const evaluateAnswer = useCallback(async (answer: string) => {
    setLoading(true);
    setPhase("evaluating");
    try {
      const evalPrompt = `The student was asked: "${currentQuestion}"\n\nTheir answer: "${answer}"\n\nEvaluate their response. Classify it as CORRECT, PARTIALLY_CORRECT, or INCORRECT. Start your response with one of these three words, then provide your teaching response. If incorrect, teach the full concept using the TJ Anderson Layer Method™: Core Cross Agent™: word breakdown, definition, visualization description, metaphor, and application.`;
      
      const response = await callAI([
        ...messages,
        { role: "user", content: answer },
        { role: "user", content: evalPrompt },
      ]);
      
      const lower = response.toLowerCase();
      let newPhase: TeachingPhase = "incorrect";
      if (lower.startsWith("correct")) newPhase = "correct";
      else if (lower.startsWith("partially")) newPhase = "partial";
      
      // Clean the classification word from the response
      const cleanResponse = response.replace(/^(CORRECT|PARTIALLY_CORRECT|INCORRECT)[:\s]*/i, "");
      
      setMessages(prev => [...prev, { role: "assistant", content: cleanResponse }]);
      setPhase(newPhase);
      
      if (voiceEnabled) speakText(cleanResponse);
      
      if (newPhase === "correct") {
        addCoins(10, "correct");
      } else if (newPhase === "partial") {
        addCoins(5, "correct");
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Let's try again." }]);
      setPhase("idle");
    }
    setLoading(false);
  }, [currentQuestion, messages, callAI, voiceEnabled, speakText, addCoins]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;
    stopSpeaking();

    const userMsg: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    if (phase === "awaiting_answer" || phase === "retest") {
      // Evaluate the student's answer
      await evaluateAnswer(messageText);
    } else {
      // Regular conversation
      setLoading(true);
      try {
        const response = await callAI([...messages, userMsg]);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        if (voiceEnabled) speakText(response);
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      }
      setLoading(false);
    }
  };

  const handleRetest = async () => {
    setLoading(true);
    setPhase("retest");
    try {
      const retestPrompt = currentTerm
        ? `Generate a NEW, different question about "${currentTerm.term}" to test if the student now understands the concept after being taught. Make it slightly different from the previous question.`
        : "Generate a new follow-up question to test if the student now understands the concept.";
      const response = await callAI([...messages, { role: "user", content: retestPrompt }]);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setCurrentQuestion(response);
      if (voiceEnabled) speakText(response);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Let me generate another question..." }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setOpen(true)}
          data-ask-tj-trigger
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg flex items-center gap-2"
          style={{ background: "hsl(30 10% 25%)", border: "1px solid hsl(30 8% 35%)" }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="text-white text-sm font-medium pr-1">Ask TJ</span>
        </motion.button>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "hsl(30 15% 96%)" }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid hsl(30 10% 88%)", boxShadow: "0 1px 4px hsl(0 0% 0% / 0.04)" }}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full overflow-hidden border-2 ${isSpeaking ? "border-amber-400 shadow-[0_0_12px_hsl(45_80%_55%/0.3)]" : "border-stone-200"}`}>
            <img src={tjBackground} alt="TJ" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: "hsl(30 10% 15%)" }}>TJ Mentor</h2>
            <p className="text-xs" style={{ color: "hsl(30 8% 50%)" }}>
              {isSpeaking ? "Speaking..." : phase === "awaiting_answer" || phase === "retest" ? "Waiting for your answer…" : "Your study guide"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button onClick={stopSpeaking} className="p-2 rounded-full hover:bg-stone-100">
              <Square className="h-4 w-4" style={{ color: "hsl(30 8% 40%)" }} />
            </button>
          )}
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-2 rounded-full hover:bg-stone-100">
            {voiceEnabled ? <Volume2 className="h-4 w-4" style={{ color: "hsl(30 8% 40%)" }} /> : <VolumeX className="h-4 w-4" style={{ color: "hsl(30 8% 60%)" }} />}
          </button>
          <button onClick={() => { stopSpeaking(); setOpen(false); }} className="p-2 rounded-full hover:bg-stone-100">
            <X className="h-5 w-5" style={{ color: "hsl(30 8% 40%)" }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2" style={{ borderColor: "hsl(30 10% 80%)" }}>
                <img src={tjBackground} alt="TJ" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(30 10% 15%)" }}>Hey, I'm TJ ✨</h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: "hsl(30 8% 45%)" }}>
                  Ask me anything about your studies, or let me generate a question to test your knowledge. I'll teach you — not just quiz you.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={generateQuestion} className="gap-2" style={{ borderColor: "hsl(30 10% 80%)", color: "hsl(30 10% 25%)" }}>
                  <Brain className="h-4 w-4" /> Generate a question
                </Button>
                <Button variant="outline" size="sm" onClick={() => sendMessage("Break down the most important concept I need to know for the state board exam.")} className="gap-2" style={{ borderColor: "hsl(30 10% 80%)", color: "hsl(30 10% 25%)" }}>
                  <Sparkles className="h-4 w-4" /> Teach me something
                </Button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-3"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 mt-1 border" style={{ borderColor: "hsl(30 10% 80%)" }}>
                  <img src={tjBackground} alt="TJ" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === "assistant" ? "shadow-sm" : ""}`}
                style={
                  msg.role === "user"
                    ? { background: "hsl(30 10% 25%)", color: "white" }
                    : { background: "white", color: "hsl(30 10% 20%)", border: "1px solid hsl(30 10% 90%)" }
                }
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-amber-700">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
                {msg.role === "assistant" && !isSpeaking && voiceEnabled && (
                  <button onClick={() => speakText(msg.content)} className="mt-2 text-[10px] flex items-center gap-1 opacity-40 hover:opacity-80" style={{ color: "hsl(30 10% 35%)" }}>
                    <Volume2 className="h-3 w-3" /> Listen again
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "hsl(30 10% 80%)" }}>
                <img src={tjBackground} alt="TJ" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl px-5 py-3.5" style={{ background: "white", border: "1px solid hsl(30 10% 90%)" }}>
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(30 10% 50%)" }} />
              </div>
            </div>
          )}

          {/* Phase-specific UI */}
          {(phase === "correct" || phase === "partial") && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center gap-3 pt-2">
              <Button size="sm" onClick={generateQuestion} className="gap-2" style={{ background: "hsl(145 50% 38%)", color: "white" }}>
                <ArrowRight className="h-4 w-4" /> Next Question
              </Button>
            </motion.div>
          )}

          {phase === "incorrect" && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center gap-3 pt-2">
              <Button size="sm" onClick={handleRetest} className="gap-2" style={{ background: "hsl(30 10% 30%)", color: "white" }}>
                <RefreshCw className="h-4 w-4" /> Re-Test Me
              </Button>
            </motion.div>
          )}

          {(phase === "awaiting_answer" || phase === "retest") && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
              <p className="text-xs italic" style={{ color: "hsl(45 60% 42%)" }}>
                💡 Tell me what you think first — then I'll teach you.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 px-4 sm:px-8 py-4 flex-shrink-0" style={{ background: "white", borderTop: "1px solid hsl(30 10% 88%)" }}>
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={phase === "awaiting_answer" || phase === "retest" ? "Type your answer..." : "Ask TJ anything..."}
              className="resize-none text-sm min-h-[48px] max-h-[100px] rounded-xl pr-10"
              style={{ background: "hsl(30 10% 97%)", color: "hsl(30 10% 15%)", borderColor: "hsl(30 10% 85%)" }}
              rows={1}
            />
            <div className="absolute right-1 bottom-1">
              <SpeechToTextButton onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl"
            style={{ background: "hsl(30 10% 25%)", color: "white" }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AskTJFullScreen;
