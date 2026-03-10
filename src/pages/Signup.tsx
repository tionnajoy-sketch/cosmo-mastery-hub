import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { pageColors } from "@/lib/colors";

const c = pageColors.signup;

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [examDate, setExamDate] = useState("");
  const [program, setProgram] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Oops!", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").update({
        state: state || null,
        exam_date: examDate || null,
        program: program || null,
        language,
      }).eq("id", data.user.id);
    }

    setLoading(false);
    toast({
      title: "You're in! 🎉",
      description: "Check your email to verify your account, then sign in.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: c.gradient }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6" style={{ color: c.heading }} />
            <span className="font-display text-2xl font-bold" style={{ color: c.heading }}>CosmoPrep</span>
          </div>
          <p className="text-sm" style={{ color: c.subtext }}>Your journey to passing boards starts here.</p>
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: c.card }}>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl" style={{ color: c.cardHeading }}>Create Account</CardTitle>
            <CardDescription>Tell us a little about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger><SelectValue placeholder="Select your program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cosmetology">Cosmetology</SelectItem>
                    <SelectItem value="Esthetics">Esthetics</SelectItem>
                    <SelectItem value="Nail Technology">Nail Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date (optional)</Label>
                <Input id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <Button type="submit" className="w-full text-base py-6" disabled={loading} style={{ background: c.button, color: "white" }}>
                {loading ? "Creating account..." : "Join CosmoPrep"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="font-medium underline" style={{ color: c.link }}>
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
