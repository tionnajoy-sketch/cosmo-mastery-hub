import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { pageColors } from "@/lib/colors";

const c = pageColors.login;

const languageLabels = {
  en: { flag: "🇺🇸", label: "English" },
  es: { flag: "🇪🇸", label: "Español" },
  fr: { flag: "🇫🇷", label: "Français" },
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Oops!", description: error.message, variant: "destructive" });
      return;
    }
    // Check if first-time user (no quiz results yet) → show welcome
    const userId = data.session?.user?.id;
    if (userId) {
      const { count } = await supabase
        .from("quiz_results")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      setLoading(false);
      navigate(count === 0 ? "/welcome" : "/");
    } else {
      setLoading(false);
      navigate("/welcome");
    }
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
            <Heart className="h-6 w-6" style={{ color: c.heading }} />
            <span className="font-display text-2xl font-bold" style={{ color: c.heading }}>CosmoPrep</span>
          </div>
          <p className="text-sm" style={{ color: c.subtext }}>Welcome back, beauty! Let's keep studying.</p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {Object.entries(languageLabels).map(([key, { flag, label }]) => (
            <button
              key={key}
              onClick={() => setSelectedLang(key)}
              className="px-4 py-2.5 rounded-full text-sm font-medium transition-all border-2"
              style={{
                background: selectedLang === key ? c.button : "rgba(255,255,255,0.8)",
                color: selectedLang === key ? "white" : c.cardHeading,
                borderColor: selectedLang === key ? c.button : "rgba(255,255,255,0.4)",
                boxShadow: selectedLang === key ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {flag} {label}
            </button>
          ))}
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: c.card }}>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl" style={{ color: c.cardHeading }}>Sign In</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full text-base py-6" disabled={loading} style={{ background: c.button, color: "white" }}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium underline" style={{ color: c.link }}>
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
