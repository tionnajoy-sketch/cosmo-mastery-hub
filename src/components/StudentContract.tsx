import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FileText, CheckCircle2 } from "lucide-react";

interface Contract {
  id: string;
  commitment_text: string;
  goal_date: string | null;
  signed_at: string;
}

const StudentContract = () => {
  const { user, profile } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [commitmentText, setCommitmentText] = useState("");
  const [goalDate, setGoalDate] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("student_contracts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setContract(data as Contract);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSign = async () => {
    if (!user || !commitmentText.trim()) return;
    setSigning(true);
    const { data, error } = await supabase
      .from("student_contracts")
      .insert({
        user_id: user.id,
        commitment_text: commitmentText.trim(),
        goal_date: goalDate || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setContract(data as Contract);
      toast({ title: "Contract Signed ✨", description: "Your commitment is now part of your journey." });
    }
    setSigning(false);
  };

  if (loading) return null;

  if (contract) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="border-2 border-primary/20 shadow-lg" style={{ background: "hsl(346 40% 97%)" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                My Commitment to Myself
              </h3>
            </div>
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 text-sm leading-relaxed mb-3">
              "{contract.commitment_text}"
            </blockquote>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Signed by {profile?.name || "You"}</span>
              <span>
                {contract.goal_date
                  ? `Goal: ${new Date(contract.goal_date).toLocaleDateString()}`
                  : new Date(contract.signed_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-lg" style={{ background: "hsl(42 50% 97%)" }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5" style={{ color: "hsl(42 50% 40%)" }} />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Your Commitment Contract
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Write a promise to yourself. What will you commit to during this journey? This is between
            you and your future self. No one else will see it.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="commitment" className="text-xs">My commitment</Label>
              <Textarea
                id="commitment"
                value={commitmentText}
                onChange={(e) => setCommitmentText(e.target.value)}
                placeholder="I commit to showing up for myself every day, even when it feels hard. I will trust the process and celebrate every small win..."
                className="mt-1 min-h-[80px] text-sm"
                maxLength={500}
              />
            </div>
            <div>
              <Label htmlFor="goalDate" className="text-xs">Target exam date (optional)</Label>
              <Input
                id="goalDate"
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSign}
              disabled={signing || !commitmentText.trim()}
              className="w-full"
              style={{ background: "hsl(346 45% 56%)", color: "white" }}
            >
              {signing ? "Signing..." : "Sign My Contract ✍️"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentContract;
