import { motion } from "framer-motion";
import { pageColors } from "@/lib/colors";

const c = pageColors.study;

export type BodyRegion =
  | "head" | "face" | "neck" | "skull" | "brain"
  | "chest" | "torso" | "abdomen" | "spine"
  | "shoulder" | "arm" | "hand"
  | "pelvis" | "leg" | "foot"
  | "skin" | "full";

interface Props {
  highlightRegion?: BodyRegion;
  completed?: boolean;
}

const regionPaths: Record<string, { d: string; cx?: number; cy?: number }> = {
  // Head/skull outline
  head: { d: "M85 18 C85 8 95 2 105 2 C115 2 125 8 125 18 L125 40 C125 48 118 55 105 55 C92 55 85 48 85 40 Z" },
  skull: { d: "M85 18 C85 8 95 2 105 2 C115 2 125 8 125 18 L125 40 C125 48 118 55 105 55 C92 55 85 48 85 40 Z" },
  brain: { d: "M90 12 C90 7 97 4 105 4 C113 4 120 7 120 12 L120 30 C120 36 114 40 105 40 C96 40 90 36 90 30 Z" },
  // Face (lower part of head)
  face: { d: "M90 30 C90 28 92 26 105 26 C118 26 120 28 120 30 L120 48 C120 52 115 55 105 55 C95 55 90 52 90 48 Z" },
  // Neck
  neck: { d: "M97 55 L97 68 L113 68 L113 55 Z" },
  // Shoulders
  shoulder: { d: "M60 68 L97 68 L97 78 L60 78 Z M113 68 L150 68 L150 78 L113 78 Z" },
  // Chest / ribcage
  chest: { d: "M72 78 L138 78 L138 120 L72 120 Z" },
  torso: { d: "M72 78 L138 78 L138 155 L72 155 Z" },
  // Abdomen
  abdomen: { d: "M75 120 L135 120 L135 155 L75 155 Z" },
  // Spine (center line)
  spine: { d: "M103 55 L107 55 L107 160 L103 160 Z" },
  // Arms
  arm: { d: "M50 78 L72 78 L72 85 L62 130 L55 170 L45 170 L52 130 L50 85 Z M138 78 L160 78 L160 85 L158 130 L165 170 L155 170 L148 130 L138 85 Z" },
  // Hands
  hand: { d: "M42 170 L58 170 L60 190 L40 190 Z M152 170 L168 170 L170 190 L150 190 Z" },
  // Pelvis
  pelvis: { d: "M75 155 L135 155 L140 175 L70 175 Z" },
  // Legs
  leg: { d: "M75 175 L100 175 L95 270 L70 270 Z M110 175 L135 175 L140 270 L115 270 Z" },
  // Feet
  foot: { d: "M65 270 L100 270 L102 285 L63 285 Z M110 270 L145 270 L147 285 L108 285 Z" },
  // Skin (full body outline glow)
  skin: { d: "M85 2 C115 2 125 8 125 18 L125 55 L150 68 L160 78 L165 170 L170 190 L150 190 L138 85 L138 155 L140 175 L145 270 L147 285 L108 285 L110 175 L105 155 L100 175 L100 270 L102 285 L63 285 L70 270 L75 175 L72 155 L72 85 L60 190 L40 190 L45 170 L50 78 L60 68 L85 55 L85 18 Z" },
  full: { d: "M85 2 C115 2 125 8 125 18 L125 55 L150 68 L160 78 L165 170 L170 190 L150 190 L138 85 L138 155 L140 175 L145 270 L147 285 L108 285 L110 175 L105 155 L100 175 L100 270 L102 285 L63 285 L70 270 L75 175 L72 155 L72 85 L60 190 L40 190 L45 170 L50 78 L60 68 L85 55 L85 18 Z" },
};

const BodyDiagram = ({ highlightRegion, completed }: Props) => {
  const accentColor = completed ? "hsl(145 50% 50%)" : c.tabActive;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 210 295" className="w-32 h-auto" style={{ filter: "drop-shadow(0 1px 3px hsl(0 0% 0% / 0.1))" }}>
        {/* Full body outline */}
        <path
          d={regionPaths.full.d}
          fill="none"
          stroke="hsl(42 20% 75%)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Skeletal details — ribs */}
        <g stroke="hsl(42 15% 82%)" strokeWidth="0.8" fill="none" opacity={0.6}>
          {/* Ribcage lines */}
          <path d="M80 82 Q105 88 130 82" />
          <path d="M78 90 Q105 96 132 90" />
          <path d="M77 98 Q105 104 133 98" />
          <path d="M78 106 Q105 112 132 106" />
          <path d="M80 114 Q105 118 130 114" />
          {/* Spine line */}
          <line x1="105" y1="55" x2="105" y2="170" strokeDasharray="3 2" />
          {/* Pelvis */}
          <path d="M78 155 Q90 168 105 170 Q120 168 132 155" />
          {/* Skull sutures */}
          <path d="M92 15 Q105 22 118 15" />
          {/* Eye sockets */}
          <circle cx="95" cy="34" r="5" />
          <circle cx="115" cy="34" r="5" />
          {/* Nasal */}
          <path d="M103 38 L105 46 L107 38" />
          {/* Jaw */}
          <path d="M90 48 Q105 56 120 48" />
          {/* Shoulder joints */}
          <circle cx="72" cy="78" r="4" />
          <circle cx="138" cy="78" r="4" />
          {/* Elbow joints */}
          <circle cx="62" cy="130" r="3" />
          <circle cx="148" cy="130" r="3" />
          {/* Hip joints */}
          <circle cx="85" cy="165" r="4" />
          <circle cx="125" cy="165" r="4" />
          {/* Knee joints */}
          <circle cx="83" cy="225" r="3" />
          <circle cx="127" cy="225" r="3" />
          {/* Kneecap */}
          <circle cx="83" cy="225" r="5" strokeWidth="0.5" />
          <circle cx="127" cy="225" r="5" strokeWidth="0.5" />
        </g>

        {/* Highlighted region */}
        {highlightRegion && regionPaths[highlightRegion] && (
          <motion.path
            d={regionPaths[highlightRegion].d}
            fill={accentColor}
            fillOpacity={0.25}
            stroke={accentColor}
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ fillOpacity: 0, strokeOpacity: 0 }}
            animate={{
              fillOpacity: [0.15, 0.3, 0.15],
              strokeOpacity: 1,
            }}
            transition={{
              fillOpacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              strokeOpacity: { duration: 0.3 },
            }}
          />
        )}
      </svg>

      {/* Region label */}
      {highlightRegion && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-semibold mt-1 uppercase tracking-wider"
          style={{ color: completed ? "hsl(145 40% 40%)" : c.subtext }}
        >
          {highlightRegion === "full" || highlightRegion === "skin"
            ? "Full Body"
            : highlightRegion.charAt(0).toUpperCase() + highlightRegion.slice(1)}
        </motion.p>
      )}
    </div>
  );
};

export default BodyDiagram;
