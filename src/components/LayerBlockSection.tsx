import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { AdaptationContext } from "@/lib/dna/types";

/* ─── Block Types ─── */
export type LayerBlockType =
  | "key-concept"
  | "root-word"
  | "apply"
  | "think"
  | "deeper";

interface LayerBlockSectionProps {
  title: string;
  icon?: ReactNode | string;
  accentColor: string;
  defaultOpen?: boolean;
  emphasized?: boolean;
  children: ReactNode;
}

/**
 * Reusable collapsible block that mirrors the existing "information" step section
 * cards. Tap header → expand/collapse with smooth chevron rotation and motion fade.
 */
export const LayerBlockSection = ({
  title,
  icon,
  accentColor,
  defaultOpen = false,
  emphasized = false,
  children,
}: LayerBlockSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: emphasized
          ? `2px solid ${accentColor}`
          : "1.5px solid hsl(var(--border))",
        boxShadow: emphasized ? `0 2px 8px ${accentColor}20` : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{
          background: `${accentColor}08`,
          borderBottom: open ? "1px solid hsl(var(--border))" : "none",
        }}
      >
        {icon && (
          <span className="text-base flex-shrink-0">
            {typeof icon === "string" ? icon : icon}
          </span>
        )}
        <h4
          className="font-display text-sm font-bold m-0 flex-1"
          style={{ color: accentColor }}
        >
          {title}
        </h4>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          style={{ color: accentColor }}
        >
          <ChevronRight className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── DNA-aware open-state helper ─── */
export interface BlockOpenState {
  defaultOpen: boolean;
  emphasized: boolean;
}

/**
 * Reads the existing AdaptationContext (from useDNAAdaptation) and returns
 * `{ defaultOpen, emphasized }` for each block type.
 *
 * Rules:
 *  - Low engagement  → keep most collapsed; only Key Concept open
 *  - High engagement → auto-expand additional sections
 *  - Low retention   → highlight + open Key Concept and Root Word
 *  - Applied learner → prioritize and emphasize "Apply It"
 */
export function getBlockOpenState(
  ctx: AdaptationContext | null | undefined,
  blockType: LayerBlockType,
): BlockOpenState {
  if (!ctx) {
    // Safe default — only Key Concept open
    return { defaultOpen: blockType === "key-concept", emphasized: false };
  }

  const lowEngagement = ctx.trendSignals?.engagement === "decreasing";
  const highEngagement = ctx.trendSignals?.engagement === "increasing";
  const lowRetention =
    ctx.trendSignals?.retention === "decreasing" ||
    ctx.contentDepth === "brief";
  const appliedLearner = ctx.dominantLayer === "A";

  switch (blockType) {
    case "key-concept":
      return { defaultOpen: true, emphasized: lowRetention };

    case "root-word":
      return {
        defaultOpen: highEngagement || lowRetention,
        emphasized: lowRetention,
      };

    case "apply":
      return {
        defaultOpen: highEngagement || appliedLearner,
        emphasized: appliedLearner,
      };

    case "think":
      return { defaultOpen: highEngagement, emphasized: false };

    case "deeper":
      return { defaultOpen: highEngagement && !lowEngagement, emphasized: false };

    default:
      return { defaultOpen: false, emphasized: false };
  }
}

export default LayerBlockSection;
