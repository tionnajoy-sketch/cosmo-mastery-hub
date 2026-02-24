import { Scissors, Sparkles, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Category } from "@/data/quizData";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "✂️": Scissors,
  "✨": Sparkles,
  "💅": Heart,
  "🛡️": Shield,
};

interface CategoryCardProps {
  category: Category;
  onSelect: (id: string) => void;
  index: number;
}

const CategoryCard = ({ category, onSelect, index }: CategoryCardProps) => {
  const Icon = iconMap[category.icon] || Sparkles;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(category.id)}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="absolute inset-0 bg-[var(--gradient-soft)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
          {category.title}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
          {category.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary">
            {category.questionCount} questions
          </span>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Start →
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default CategoryCard;
