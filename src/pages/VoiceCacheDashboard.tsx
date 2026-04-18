import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, Volume2, TrendingUp, Database, Zap, ImagePlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

interface CacheEntry {
  id: string;
  text_preview: string;
  voice_id: string;
  usage_type: string;
  cache_hits: number;
  is_always_cache: boolean;
  created_at: string;
  last_accessed_at: string;
}

const CREDITS_PER_REQUEST = 86; // average credits per TTS call

const VoiceCacheDashboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEntries: 0, totalHits: 0, totalMisses: 0, estimatedSaved: 0 });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tts_cache")
      .select("id, text_preview, voice_id, usage_type, cache_hits, is_always_cache, created_at, last_accessed_at")
      .order("cache_hits", { ascending: false })
      .limit(100);

    if (!error && data) {
      setEntries(data as CacheEntry[]);
      const totalHits = data.reduce((sum, e) => sum + (e.cache_hits || 0), 0);
      setStats({
        totalEntries: data.length,
        totalHits,
        totalMisses: data.length, // each entry = 1 miss (first generation)
        estimatedSaved: totalHits * CREDITS_PER_REQUEST,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const usageColor = (type: string) => {
    const map: Record<string, string> = {
      greeting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      lesson: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      affirmation: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      onboarding: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      faq: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      dynamic: "bg-muted text-muted-foreground",
    };
    return map[type] || map.dynamic;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">TJ Voice Cache Dashboard</h1>
              <p className="text-sm text-muted-foreground">Monitor cached audio, hits, and estimated credit savings</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Cached Clips</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalHits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Cache Hits</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Volume2 className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMisses}</p>
                <p className="text-xs text-muted-foreground">Generations (Misses)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">~{stats.estimatedSaved.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Credits Saved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top cached clips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most-Used Voice Clips</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No cached audio yet. Clips will appear here after TJ speaks.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Text Preview</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Hits</TableHead>
                      <TableHead className="text-center">Always Cache</TableHead>
                      <TableHead>Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-[280px] truncate text-sm">
                          {e.text_preview || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={usageColor(e.usage_type)}>
                            {e.usage_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">
                          {e.cache_hits}
                        </TableCell>
                        <TableCell className="text-center">
                          {e.is_always_cache ? "✅" : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(e.last_accessed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  );
};

export default VoiceCacheDashboard;
