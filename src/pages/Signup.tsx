import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectSeparator, SelectGroup } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => String(currentYear - 16 - i));

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [examDate, setExamDate] = useState("");
  const [program, setProgram] = useState("");
  const [language, setLanguage] = useState("en");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [sex, setSex] = useState("");
  const [tonePreference, setTonePreference] = useState("gentle");
  const [leaderboardPreference, setLeaderboardPreference] = useState("private");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").update({
        state: state || null,
        exam_date: examDate || null,
        program: program || null,
        selected_program: program ? program.toLowerCase() : "cosmetology",
        language,
        birth_month: birthMonth ? parseInt(birthMonth) : null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        sex: sex || "prefer_not_to_say",
        tone_preference: tonePreference,
        leaderboard_preference: leaderboardPreference,
      } as any).eq("id", data.user.id);
    }

    setLoading(false);
    toast.success("You're in! 🎉 Check your email to verify your account, then sign in.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <BookOpen className="h-7 w-7 text-foreground" />
            <span className="font-display text-2xl font-bold text-foreground tracking-tight">TJ Anderson Test Prep</span>
          </div>
          <p className="text-sm text-muted-foreground">This platform learns YOU first, then teaches you.</p>
        </div>

        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-2xl text-card-foreground">Create Account</CardTitle>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Birth Month</Label>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Birth Year</Label>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Choose Your Learning Path</Label>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger><SelectValue placeholder="Select your learning path" /></SelectTrigger>
                    <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-primary pl-3">Available Now</SelectLabel>
                      <SelectItem value="Cosmetology">Cosmetology State Board Prep</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground pl-3">Coming Soon</SelectLabel>
                      {[
                        "Real Estate Exam Prep",
                        "Medical Terminology",
                        "Esthetics State Board Prep",
                        "Barbering State Board Prep",
                        "Nail Technology State Board Prep",
                        "CNA / Nurse Aide Exam Prep",
                        "Insurance License Prep",
                        "ACT / SAT Prep",
                        "Bible Study",
                        "Educator / Paraprofessional Prep",
                      ].map((path) => (
                        <div key={path} onPointerDown={(e) => {
                          e.preventDefault();
                          toast("This learning path is coming soon and will be powered by the TJ Anderson Layer Method™: Core Cross Agent™.");
                        }}>
                          <SelectItem value={path} disabled className="opacity-50">{path}</SelectItem>
                        </div>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone Preference</Label>
                <Select value={tonePreference} onValueChange={setTonePreference}>
                  <SelectTrigger><SelectValue placeholder="How should we talk to you?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">🌿 Gentle</SelectItem>
                    <SelectItem value="hype_coach">🔥 Hype-Coach</SelectItem>
                    <SelectItem value="straight">🎯 Straight-to-the-Point</SelectItem>
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
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="underline text-foreground">Terms of Use</a>{" "}
                  and acknowledge that TJ Anderson Test Prep™ content is proprietary.
                </Label>
              </div>
              <Button type="submit" className="w-full text-base py-6" disabled={loading || !agreedToTerms}>
                {loading ? "Creating account..." : "Join TJ Test Prep"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="font-medium underline text-foreground">
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