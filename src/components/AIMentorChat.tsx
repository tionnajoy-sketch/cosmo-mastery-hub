import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIMentorChatProps {
  sectionName: string;
  sectionId: string;
  blockNumber?: string;
  terms?: { term: string; definition: string }[];
}

const AIMentorChat = ({ sectionName, sectionId, blockNumber, terms }: AIMentorChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
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
        },
      });

      if (error) throw error;

      const assistantContent = data?.response || "I'm sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (e: any) {
      console.error("Chat error:", e);
      const errorMsg = e?.message?.includes("429")
        ? "I'm getting too many questions right now. Wait a moment and try again."
        : e?.message?.includes("402")
          ? "AI credits need to be topped up. Please contact your admin."
          : "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
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
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(270 50% 52%), hsl(325 55% 52%))" }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="text-white text-sm font-medium pr-1">Ask TJ</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ background: "hsl(0 0% 100%)", height: "500px", maxHeight: "70vh" }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(270 50% 52%), hsl(325 55% 52%))" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white/90" />
                <div>
                  <p className="text-white font-semibold text-sm">TJ Anderson — AI Mentor</p>
                  <p className="text-white/70 text-xs">{sectionName}{blockNumber ? ` · Block ${blockNumber}` : ""}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 mx-auto mb-3" style={{ color: "hsl(270 45% 65%)" }} />
                  <p className="text-sm font-medium" style={{ color: "hsl(270 30% 30%)" }}>
                    Hi! I'm your AI study mentor.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "hsl(270 15% 55%)" }}>
                    Ask me anything about {sectionName}. I'm here to help you understand the material better.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "hsl(270 50% 52%)", color: "white" }
                        : { background: "hsl(270 20% 95%)", color: "hsl(270 20% 18%)" }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ background: "hsl(270 20% 95%)" }}>
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(270 45% 55%)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: "hsl(270 15% 90%)" }}>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about this section..."
                  className="resize-none text-sm min-h-[40px] max-h-[80px] border-0 focus-visible:ring-1"
                  style={{ background: "hsl(270 15% 97%)" }}
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="self-end px-3"
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
