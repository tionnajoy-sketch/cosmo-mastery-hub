import { Textarea } from "@/components/ui/textarea";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import { wordCount } from "@/lib/behavior-intake";
import { CheckCircle2 } from "lucide-react";

interface ExplainItBackProps {
  value: string;
  onChange: (t: string) => void;
  minWords?: number;
}

export default function ExplainItBack({ value, onChange, minWords = 6 }: ExplainItBackProps) {
  const wc = wordCount(value);
  const ok = wc >= minWords;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Say it back in your own words</p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] ${ok ? "text-primary" : "text-muted-foreground"}`}>
            {wc}/{minWords} words
          </span>
          {ok && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
        </div>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="In one or two sentences…"
          className={`min-h-[64px] resize-none pr-10 text-sm ${ok ? "border-primary/50" : ""}`}
        />
        <div className="absolute right-1.5 top-1.5">
          <SpeechToTextButton onTranscript={(t) => onChange(value ? `${value} ${t}` : t)} />
        </div>
      </div>
    </div>
  );
}
