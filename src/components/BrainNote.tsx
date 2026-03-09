import { Brain } from "lucide-react";

interface BrainNoteProps {
  text: string;
}

const BrainNote = ({ text }: BrainNoteProps) => (
  <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: "hsl(220 30% 96%)" }}>
    <Brain className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: "hsl(220 40% 60%)" }} />
    <p className="text-xs leading-relaxed italic" style={{ color: "hsl(220 20% 50%)" }}>
      {text}
    </p>
  </div>
);

export default BrainNote;
