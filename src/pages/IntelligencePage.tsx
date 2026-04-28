import { useNavigate } from "react-router-dom";
import { useTJIntelligence } from "@/hooks/useTJIntelligence";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Flame, Target, TrendingUp, Sparkles, ArrowRight,
  Activity, Layers, Compass, Zap, ShieldCheck,
} from "lucide-react";

const ringColor = (v: number) =>
  v >= 75 ? "hsl(150 60% 55%)" :
  v >= 50 ? "hsl(42 85% 60%)" :
  v >= 25 ? "hsl(28 80% 60%)" :
            "hsl(0 70% 60%)";

const Stat = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <div className="ie-card p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="ie-eyebrow">{label}</span>
      <Icon className="h-4 w-4 text-[hsl(var(--ie-accent))]" />
    </div>
    <div className="ie-stat-value">{value}</div>
    {sub && <div className="text-[11px] text-[hsl(var(--ie-muted))] mt-1">{sub}</div>}
  </div>
);

const RingScore = ({ value, label }: { value: number; label: string }) => {
  const c = ringColor(value);
  return (
    <div className="ie-card p-4 flex items-center gap-4">
      <div
        className="relative w-20 h-20 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${c} ${value * 3.6}deg, hsl(var(--ie-track)) 0)`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-[hsl(var(--ie-card))] grid place-items-center">
          <span className="font-display text-2xl font-bold text-[hsl(var(--ie-fg))]">{value}</span>
        </div>
      </div>
      <div>
        <div className="ie-eyebrow">{label}</div>
        <div className="text-sm text-[hsl(var(--ie-muted))] mt-1">
          {value >= 75 ? "Strong signal" : value >= 50 ? "Building" : value >= 25 ? "Developing" : "Needs focus"}
        </div>
      </div>
    </div>
  );
};

const IntelligencePage = () => {
  const nav = useNavigate();
  const { overview, breakdown, dna, action, loading } = useTJIntelligence();

  return (
    <div className="ie-scope min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-20">
        {/* Header */}
        <header className="ie-card p-5 relative overflow-hidden">
          <div className="ie-glow" />
          <div className="relative">
            <div className="ie-eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> TJ Learning Intelligence Engine
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[hsl(var(--ie-fg))] mt-2 tracking-tight">
              Your Learning Command Center
            </h1>
            <p className="text-sm text-[hsl(var(--ie-muted))] mt-2 max-w-2xl">
              Real-time read on your patterns, weak spots, and the next best move — powered by the TJ Anderson Layer Method™.
            </p>
          </div>
        </header>

        {/* 1. OVERVIEW */}
        <section>
          <SectionHeading icon={Activity} title="Learning Overview" eyebrow="01 · Snapshot" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Stat icon={Flame} label="Study Streak" value={`${overview.studyStreak}d`} sub="consecutive days" />
            <Stat icon={Target} label="Terms Completed" value={`${overview.termsCompleted}/${overview.totalTerms || "—"}`} sub="mastered" />
            <Stat icon={TrendingUp} label="Strongest Topic" value={overview.strongestTopic} />
            <Stat icon={ShieldCheck} label="Weakest Topic" value={overview.weakestTopic} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <RingScore value={overview.confidenceScore} label="Confidence" />
            <RingScore value={overview.retentionScore} label="Retention" />
            <RingScore value={overview.passReadiness} label="Pass Readiness" />
          </div>
        </section>

        {/* 3. DO THIS NOW */}
        <section>
          <SectionHeading icon={Zap} title="Do This Now" eyebrow="02 · Today's Focus" />
          <div className="ie-card-accent p-5 mt-3 relative overflow-hidden">
            <div className="ie-glow" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="ie-eyebrow text-[hsl(var(--ie-accent))]">Recommended action</div>
                <h3 className="font-display text-2xl font-semibold text-[hsl(var(--ie-fg))] mt-1">
                  {action.headline}
                </h3>
                <p className="text-sm text-[hsl(var(--ie-muted))] mt-2 max-w-2xl">{action.detail}</p>
              </div>
              <Button
                onClick={() => action.route && nav(action.route)}
                className="bg-[hsl(var(--ie-accent))] text-[hsl(var(--ie-bg))] hover:bg-[hsl(var(--ie-accent)/0.85)] font-semibold"
              >
                {action.cta} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* 6. STUDY BREAKDOWN BY LAYER */}
        <section>
          <SectionHeading icon={Layers} title="Study Breakdown by Layer" eyebrow="03 · Where you are" />
          <div className="ie-card p-5 mt-3">
            <div className="space-y-4">
              {breakdown.map((b) => (
                <div key={b.layer}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[hsl(var(--ie-fg))]">{b.label}</span>
                    <div className="flex items-center gap-3 text-[11px] text-[hsl(var(--ie-muted))]">
                      <span>{b.completionPct}% complete</span>
                      <span className="opacity-50">·</span>
                      <span style={{ color: ringColor(b.performance) }}>{b.performance}% perf</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--ie-track))] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${b.completionPct}%`,
                        background: `linear-gradient(90deg, ${ringColor(b.performance)}, hsl(var(--ie-accent)))`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. PASS READINESS DETAIL */}
        <section>
          <SectionHeading icon={Compass} title="Pass Readiness Signal" eyebrow="04 · Are you ready?" />
          <div className="ie-card p-5 mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="ie-eyebrow">Status</div>
              <div className="font-display text-3xl font-bold mt-1" style={{ color: ringColor(overview.passReadiness) }}>
                {overview.passReadiness >= 75 ? "Exam-Ready" :
                 overview.passReadiness >= 60 ? "Almost There" :
                 overview.passReadiness >= 40 ? "Building" : "Foundation Phase"}
              </div>
              <Progress value={overview.passReadiness} className="mt-3 h-2" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <ReadinessRow label="Understanding" value={Math.round(overview.passReadiness * 0.9)} />
              <ReadinessRow label="Retention" value={overview.retentionScore} />
              <ReadinessRow label="Confidence" value={overview.confidenceScore} />
              <ReadinessRow label="Completion" value={overview.totalTerms ? Math.round(overview.termsCompleted / overview.totalTerms * 100) : 0} />
              <ReadinessRow label="Consistency" value={Math.min(100, overview.studyStreak * 10)} />
            </div>
          </div>
        </section>

        {/* 9. TJ DNA PROFILE */}
        <section>
          <SectionHeading icon={Brain} title="TJ DNA Learning Profile" eyebrow="05 · How you learn" />
          <div className="ie-card p-5 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaRow label="Preferred Layer" value={dna.preferredLayer} tone="accent" />
            <DnaRow label="Strongest Style" value={dna.strongestStyle} tone="strong" />
            <DnaRow label="Weakest Style" value={dna.weakestStyle} tone="weak" />
            <DnaRow label="Confidence State" value={dna.confidenceState} tone={dna.confidenceState === "high" ? "strong" : dna.confidenceState === "low" ? "weak" : "neutral"} />
            <DnaRow label="Retention State" value={dna.retentionState} tone={dna.retentionState === "strong" ? "strong" : dna.retentionState === "low" ? "weak" : "neutral"} />
            <div className="md:col-span-2 ie-card-accent p-4">
              <div className="ie-eyebrow text-[hsl(var(--ie-accent))]">Recommended next path</div>
              <p className="text-sm text-[hsl(var(--ie-fg))] mt-1">{dna.recommendedNext}</p>
            </div>
          </div>
        </section>

        {/* Phase 2 placeholder */}
        <section className="ie-card p-5 text-center">
          <div className="ie-eyebrow">Coming next</div>
          <p className="text-sm text-[hsl(var(--ie-muted))] mt-2">
            Pattern detection · Learning Memory · Intervention cards · Learning Leaks
          </p>
        </section>

        {loading && <div className="text-center text-xs text-[hsl(var(--ie-muted))]">Reading your signals…</div>}
      </main>
      <AppFooter />
    </div>
  );
};

const SectionHeading = ({ icon: Icon, title, eyebrow }: { icon: any; title: string; eyebrow: string }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="ie-eyebrow flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </div>
      <h2 className="font-display text-xl md:text-2xl font-semibold text-[hsl(var(--ie-fg))] mt-1">{title}</h2>
    </div>
  </div>
);

const ReadinessRow = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-[11px] text-[hsl(var(--ie-muted))] mb-1">
      <span>{label}</span>
      <span style={{ color: ringColor(value) }}>{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-[hsl(var(--ie-track))] overflow-hidden">
      <div className="h-full" style={{ width: `${value}%`, background: ringColor(value) }} />
    </div>
  </div>
);

const DnaRow = ({ label, value, tone }: { label: string; value: string; tone: "accent" | "strong" | "weak" | "neutral" }) => {
  const color =
    tone === "strong" ? "hsl(150 60% 60%)" :
    tone === "weak" ? "hsl(0 70% 65%)" :
    tone === "accent" ? "hsl(var(--ie-accent))" :
    "hsl(var(--ie-fg))";
  return (
    <div className="ie-card p-3">
      <div className="ie-eyebrow">{label}</div>
      <div className="font-display text-lg font-semibold capitalize mt-1" style={{ color }}>{value || "—"}</div>
    </div>
  );
};

export default IntelligencePage;
