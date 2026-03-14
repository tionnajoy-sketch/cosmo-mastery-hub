import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";

interface CoinDisplayProps {
  coins: number;
  showAnimation: boolean;
  lastAdded: number;
}

const CoinDisplay = ({ coins, showAnimation, lastAdded }: CoinDisplayProps) => {
  return (
    <div className="relative flex items-center gap-1.5">
      <Coins className="h-4 w-4" style={{ color: "hsl(42 55% 48%)" }} />
      <span className="text-sm font-semibold text-foreground">{coins}</span>
      <AnimatePresence>
        {showAnimation && lastAdded > 0 && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-1 -right-6 text-xs font-bold" style={{ color: "hsl(42 55% 48%)" }}
          >
            +{lastAdded}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinDisplay;
