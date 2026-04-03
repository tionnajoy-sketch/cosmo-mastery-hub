import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Volume2, VolumeX, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import tjOffice from "@/assets/tj-office.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIMentorChatProps {
  sectionName?: string;
  sectionId?: string;
  blockNumber?: string;
  terms?: { term: string; definition: string }[];
  learningStyle?: string;
}

const WELCOME_SCRIPT = `Hi love, this is TJ Mentor. I'm so proud of you for showing up for yourself and your future license.

On this home screen, you'll see your daily study goal, your commitment to yourself, and guidance based on your learning style.

Here's how to use CosmoPrep:
1. Choose one chapter or term you want to feel stronger in today.
2. Open that study block and read the Definition, Concept Identity, and Visualization sections.
3. Use the Metaphor and Affirmation when you feel nervous or stuck.
4. Answer the Reflection / Journaling prompts in your own words, then try the Practice and Quiz questions.

Anytime you're confused or just want to hear it broken down, tap Ask TJ and talk to me. I'll explain the concept on the whiteboard, in my voice, until it feels clear and calm in your mind.

To get started right now, tell me which chapter or topic feels the most intimidating, and we'll tackle it together.`;

const quickActions = [
  { label: "✨ Explain simply", prompt: "Explain the current topic to me in simple, beginner-friendly language." },
  { label: "🎨 Give me a metaphor", prompt: "Give me a TJ-style metaphor to help me understand the current topic better." },
  { label: "📝 Quiz me", prompt: "Quiz me on this topic with a state board style question. Include 4 answer choices." },
  { label: "🧠 Break it down TJ style", prompt: "Break this down TJ style. Give me a full TJ Anderson Layer Method block: Definition, Concept Identity, Visual explanation, Metaphor, Affirmation, Reflection questions, and a Quiz question with answer choices." },
  { label: "💡 Why does this matter?", prompt: "Why does this matter in cosmetology? Connect it to real salon work and client experiences." },
  { label: "💜 Encourage me", prompt: "I need some encouragement right now. Remind me why I'm capable of passing the state board exam." },
];

// Global event bus so any component can open the TJ chat with a welcome script
const listeners = new Set<(withWelcome: boolean) => void>();
export const openTJChat = (withWelcome = false) => {
  listeners.forEach((fn) => fn(withWelcome));
};

const AIMentorChat = ({ sectionName, sectionId, blockNumber, terms, learningStyle }: AIMentorChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const welcomeSpokenRef = useRef(false);

  // Listen for external open requests
  useEffect(() => {
    const handler = (withWelcome: boolean) => {
      setOpen(true);
      if (withWelcome && messages.length === 0 && !welcomeSpokenRef.current) {
        welcomeSpokenRef.current = true;
        const welcomeMsg: Message = { role: "assistant", content: WELCOME_SCRIPT };
        setMessages([welcomeMsg]);
        // Auto-speak after a short delay to allow UI to render
        setTimeout(() => {
          if (voiceEnabled) speakText(WELCOME_SCRIPT);
        }, 400);
      }
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, voiceEnabled]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopSpeaking();

    // Strip markdown for cleaner speech
    const plainText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    if (!plainText) return;

    try {
      setIsSpeaking(true);
      const audio = await fetchTTSWithFallback(plainText, { usageType: "dynamic" });
      if (!audio) { setIsSpeaking(false); return; }
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      await audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, stopSpeaking]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;
    stopSpeaking();

    const userMsg: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: updatedMessages,
          sectionName,
          sectionId,
          blockNumber,
          terms: terms?.slice(0, 20),
          learningStyle,
        },
      });

      if (error) {
        console.error("Chat error:", error);
        const statusText = error?.message || "";
        const errorMsg = statusText.includes("429")
          ? "I'm getting too many questions right now. Wait a moment and try again."
          : statusText.includes("402")
            ? "AI credits need to be topped up. Please contact your admin."
            : "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
        return;
      }

      if (data?.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
        return;
      }

      const assistantContent = data?.response || "I'm sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);

      // Auto-speak the response
      if (voiceEnabled) {
        speakText(assistantContent);
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            data-ask-tj-trigger
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(270 50% 52%), hsl(325 55% 52%))" }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="text-white text-sm font-medium pr-1">Ask TJ</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel - Immersive Classroom */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "580px", maxHeight: "80vh" }}
          >
            {/* Header with TJ's office background */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0">
                <img src={tjOffice} alt="" className="w-full h-full object-cover object-[50%_20%]" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsla(240 40% 12% / 0.4), hsla(240 40% 12% / 0.85))" }} />
              </div>
              <div className="relative px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Animated avatar */}
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${isSpeaking ? "border-purple-300 shadow-[0_0_12px_hsla(270,80%,70%,0.6)]" : "border-white/30"}`}
                    >
                      <img src={tjOffice} alt="TJ Mentor" className="w-full h-full object-cover object-[70%_15%]" />
                    </div>
                    {isSpeaking && (
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(145 60% 45%)" }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <Volume2 className="h-2.5 w-2.5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">TJ Mentor</p>
                    <p className="text-white/60 text-xs">
                      {isSpeaking ? "Speaking..." : sectionName ? `${sectionName}${blockNumber ? ` · Block ${blockNumber}` : ""}` : "Your study guide"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                      title="Stop speaking"
                    >
                      <Square className="h-4 w-4 text-white/80" />
                    </button>
                  )}
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title={voiceEnabled ? "Mute TJ" : "Unmute TJ"}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="h-4 w-4 text-white/80" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-white/50" />
                    )}
                  </button>
                  <button onClick={() => { stopSpeaking(); setOpen(false); }} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4 text-white/80" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages area - whiteboard style */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{
                background: "linear-gradient(180deg, hsl(220 15% 96%), hsl(220 10% 98%))",
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 31px,
                    hsl(220 20% 90%) 31px,
                    hsl(220 20% 90%) 32px
                  )
                `,
                backgroundSize: "100% 32px",
                backgroundPosition: "0 8px",
              }}
            >
              {messages.length === 0 && (
                <div className="py-6">
                  <div className="text-center mb-5 p-4 rounded-xl" style={{ background: "hsla(0 0% 100% / 0.85)", backdropFilter: "blur(4px)" }}>
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2" style={{ borderColor: "hsl(270 30% 80%)" }}>
                      <img src={tjOffice} alt="TJ in her office" className="w-full h-full object-cover object-[70%_15%]" />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(270 30% 28%)" }}>
                      Hey! I'm TJ — pull up a seat 💜
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "hsl(270 15% 50%)" }}>
                      We're in my office. Ask me anything and I'll walk you through it on the whiteboard — and yes, I'll explain it out loud too.
                    </p>
                    {voiceEnabled && (
                      <p className="text-[10px] mt-2 flex items-center justify-center gap-1" style={{ color: "hsl(145 40% 45%)" }}>
                        <Volume2 className="h-3 w-3" /> Voice is on — I'll read my answers to you
                      </p>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all hover:shadow-sm"
                        style={{
                          background: "hsla(0 0% 100% / 0.9)",
                          color: "hsl(270 30% 35%)",
                          border: "1px solid hsl(270 15% 85%)",
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 border" style={{ borderColor: "hsl(270 20% 82%)" }}>
                      <img src={tjOffice} alt="TJ" className="w-full h-full object-cover object-[70%_15%]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "assistant" ? "shadow-sm" : ""}`}
                    style={
                      msg.role === "user"
                        ? { background: "hsl(270 50% 52%)", color: "white" }
                        : {
                            background: "hsla(0 0% 100% / 0.92)",
                            color: "hsl(220 15% 18%)",
                            border: "1px solid hsl(220 15% 88%)",
                          }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-purple-800 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                    {msg.role === "assistant" && !isSpeaking && voiceEnabled && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="mt-1.5 text-[10px] flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: "hsl(270 30% 45%)" }}
                      >
                        <Volume2 className="h-3 w-3" /> Listen again
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 border" style={{ borderColor: "hsl(270 20% 82%)" }}>
                    <img src={tjOffice} alt="TJ" className="w-full h-full object-cover object-[70%_15%]" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 shadow-sm" style={{ background: "hsla(0 0% 100% / 0.92)", border: "1px solid hsl(220 15% 88%)" }}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(270 45% 55%)" }} />
                      <span className="text-xs" style={{ color: "hsl(270 20% 55%)" }}>TJ is writing on the whiteboard...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions when conversation is active */}
            {messages.length > 0 && (
              <div className="px-3 py-1.5 flex gap-1 overflow-x-auto flex-shrink-0" style={{ background: "hsl(220 10% 97%)", borderTop: "1px solid hsl(220 15% 90%)" }}>
                {quickActions.slice(0, 4).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    className="text-[10px] px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors disabled:opacity-50"
                    style={{ background: "hsla(0 0% 100% / 0.8)", color: "hsl(270 25% 40%)", border: "1px solid hsl(270 15% 88%)" }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 flex-shrink-0" style={{ background: "hsl(220 10% 97%)", borderTop: "1px solid hsl(220 15% 90%)" }}>
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask TJ anything..."
                    className="resize-none text-sm min-h-[40px] max-h-[80px] border focus-visible:ring-1 pr-9 rounded-xl"
                    style={{ background: "white", borderColor: "hsl(270 15% 85%)" }}
                    rows={1}
                  />
                  <div className="absolute right-0.5 bottom-0.5">
                    <SpeechToTextButton
                      onTranscript={(text) => setInput((prev) => prev ? `${prev} ${text}` : text)}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="px-3 rounded-xl"
                  style={{ background: "hsl(270 50% 52%)", color: "white" }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIMentorChat;
