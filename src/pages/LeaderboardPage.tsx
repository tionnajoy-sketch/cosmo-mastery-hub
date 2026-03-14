import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  Trophy,
  Coins,
  Flame,
  Star,
  Crown,
  Medal,
  Award,
  Lock,
  Globe,
  ArrowLeft,
} from "lucide-react";

interface LeaderboardEntry {
  user_name: string;
  total_coins: number;
  blocks_mastered: number;
  current_streak: number;
}

const rankIcon = (index: number) => {
  if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
  if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>;
};

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats } = useCoins();
  const { currentStreak, longestStreak } = useStudyTracker();
  const [preference, setPreference] = useState<string>("private");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreference = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("leaderboard_preference")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.leaderboard_preference) {
      setPreference(data.leaderboard_preference);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_leaderboard");
    if (data) setLeaderboard(data as LeaderboardEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPreference();
    fetchLeaderboard();
  }, [fetchPreference, fetchLeaderboard]);

  const updatePreference = async (value: string) => {
    if (!user) return;
    setPreference(value);
    await supabase
      .from("profiles")
      .update({ leaderboard_preference: value })
      .eq("id", user.id);
    fetchLeaderboard();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" /> Leaderboard
          </h1>
        </div>

        {/* My Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" /> My Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <Coins className="h-6 w-6 mx-auto text-yellow-500" />
                  <p className="text-2xl font-bold text-foreground">{stats.coins}</p>
                  <p className="text-xs text-muted-foreground">Total Coins</p>
                </div>
                <div className="space-y-1">
                  <Flame className="h-6 w-6 mx-auto text-orange-500" />
                  <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="space-y-1">
                  <Star className="h-6 w-6 mx-auto text-primary" />
                  <p className="text-2xl font-bold text-foreground">{stats.blocksMastered}</p>
                  <p className="text-xs text-muted-foreground">Blocks Mastered</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Longest streak: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy Setting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Visibility</span>
                </div>
                <Select value={preference} onValueChange={updatePreference}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    <SelectItem value="friends">👥 Friends Only</SelectItem>
                    <SelectItem value="global">🌍 Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {preference === "private" && "Your stats are hidden from the leaderboard."}
                {preference === "friends" && "Only friends can see your stats. (Coming soon!)"}
                {preference === "global" && "Your stats are visible to all CosmoPrep learners."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Global Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No one on the leaderboard yet. Set your visibility to Global to be the first!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Coins</TableHead>
                      <TableHead className="text-right">Blocks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell>{rankIcon(i)}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {entry.user_name || "Learner"}
                          {i < 3 && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              {i === 0 ? "👑" : i === 1 ? "🥈" : "🥉"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {entry.total_coins}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {entry.blocks_mastered}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground italic">
          "You're not competing against anyone but yesterday's you. Keep going! 💛"
        </p>
      </main>
      <AppFooter />
    </div>
  );
};

export default LeaderboardPage;
