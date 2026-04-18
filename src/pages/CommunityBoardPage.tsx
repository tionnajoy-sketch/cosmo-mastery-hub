import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  content: string;
  section_tag: string | null;
  created_at: string;
}
interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const formatWhen = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const CommunityBoardPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Map<string, Reply[]>>(new Map());
  const [composer, setComposer] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: postsData }, { data: repliesData }] = await Promise.all([
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("community_replies").select("*").order("created_at", { ascending: true }),
    ]);
    setPosts((postsData as Post[]) || []);
    const map = new Map<string, Reply[]>();
    (repliesData as Reply[] | null)?.forEach((r) => {
      if (!map.has(r.post_id)) map.set(r.post_id, []);
      map.get(r.post_id)!.push(r);
    });
    setReplies(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel("community-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_replies" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  const handlePost = async () => {
    if (!user || !composer.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: profile?.name || "Student",
      content: composer.trim(),
      section_tag: "general",
    });
    setPosting(false);
    if (error) { toast.error("Could not post. Try again."); return; }
    setComposer("");
    toast.success("Posted to the community");
  };

  const handleReply = async (postId: string) => {
    const text = (replyDrafts[postId] || "").trim();
    if (!user || !text) return;
    const { error } = await supabase.from("community_replies").insert({
      post_id: postId,
      user_id: user.id,
      author_name: profile?.name || "Student",
      content: text,
    });
    if (error) { toast.error("Could not reply"); return; }
    setReplyDrafts((d) => ({ ...d, [postId]: "" }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) toast.error("Could not delete");
  };

  const handleDeleteReply = async (replyId: string) => {
    const { error } = await supabase.from("community_replies").delete().eq("id", replyId);
    if (error) toast.error("Could not delete");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Community Board</h1>
              <p className="text-sm text-muted-foreground">Talk with other students. Encourage one another.</p>
            </div>
          </div>
        </div>

        {/* Composer */}
        <Card className="p-4 mb-6">
          <Textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Share a question, a tip, or some encouragement…"
            rows={3}
            className="resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{composer.length}/1000</span>
            <Button onClick={handlePost} disabled={!composer.trim() || posting} size="sm" className="gap-2">
              <Send className="h-4 w-4" /> Post
            </Button>
          </div>
        </Card>

        {/* Feed */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-semibold">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to start the conversation.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {posts.map((post) => {
                const postReplies = replies.get(post.id) || [];
                const isOwn = user?.id === post.user_id;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{post.author_name}</span>
                          <Badge variant="secondary" className="text-[10px]">{post.section_tag || "general"}</Badge>
                          <span className="text-xs text-muted-foreground">{formatWhen(post.created_at)}</span>
                        </div>
                        {isOwn && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePost(post.id)} className="h-7 w-7 p-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

                      {/* Replies */}
                      {postReplies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                          {postReplies.map((r) => {
                            const ownReply = user?.id === r.user_id;
                            return (
                              <div key={r.id} className="text-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs">{r.author_name}</span>
                                    <span className="text-[10px] text-muted-foreground">{formatWhen(r.created_at)}</span>
                                  </div>
                                  {ownReply && (
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteReply(r.id)} className="h-6 w-6 p-0">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap text-foreground/90">{r.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply composer */}
                      <div className="mt-3 flex gap-2">
                        <Textarea
                          value={replyDrafts[post.id] || ""}
                          onChange={(e) => setReplyDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                          placeholder="Write a reply…"
                          rows={1}
                          className="resize-none min-h-[36px] text-sm py-2"
                          maxLength={500}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReply(post.id)}
                          disabled={!(replyDrafts[post.id] || "").trim()}
                          className="self-end"
                        >
                          Reply
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityBoardPage;
