import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft } from "lucide-react";
import { categories } from "@/data/quizData";
import CategoryCard from "@/components/CategoryCard";
import QuizView from "@/components/QuizView";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

type AppState = { view: "home" } | { view: "quiz"; categoryId: string; categoryTitle: string };

const Index = () => {
  const [state, setState] = useState<AppState>({ view: "home" });

  const handleSelectCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) setState({ view: "quiz", categoryId: id, categoryTitle: cat.title });
  };

  const handleHome = () => setState({ view: "home" });

  if (state.view === "quiz") {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={handleHome}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Button>
          <QuizView
            categoryId={state.categoryId}
            categoryTitle={state.categoryTitle}
            onBack={handleHome}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Beauty tools and styling"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <BookOpen className="h-4 w-4" />
              State Board Exam Prep
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ace Your{" "}
              <span className="text-primary">Cosmetology</span>{" "}
              State Board
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
              Practice with real exam-style questions across all major categories.
              Build confidence and pass your state board on the first try.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Study Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a topic to start practicing
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSelect={handleSelectCategory}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
