import { useBackgroundUpload } from "@/contexts/BackgroundUploadContext";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, X, AlertTriangle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

const BackgroundUploadBanner = () => {
  const { isProcessing, progress, progressMessage, activeModuleName, activeModuleId, completed, error, dismiss } = useBackgroundUpload();
  const navigate = useNavigate();
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>();

  const visible = isProcessing || completed || !!error;

  useEffect(() => {
    if (completed) {
      autoDismissRef.current = setTimeout(dismiss, 12000);
      return () => clearTimeout(autoDismissRef.current);
    }
  }, [completed, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="rounded-xl border shadow-2xl p-4 bg-card text-card-foreground backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0 mt-0.5" />}
              {completed && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              {error && <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {completed ? `✓ ${activeModuleName} is ready!` : error ? "Processing failed" : activeModuleName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {error || progressMessage}
                </p>

                {isProcessing && (
                  <Progress value={progress} className="h-1.5 mt-2" />
                )}

                {completed && activeModuleId && (
                  <Button
                    size="sm"
                    className="mt-2 gap-1.5 h-7 text-xs"
                    onClick={() => { navigate(`/module/${activeModuleId}`); dismiss(); }}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> View Module
                  </Button>
                )}

                {error && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    onClick={() => { navigate("/upload"); dismiss(); }}
                  >
                    Try Again
                  </Button>
                )}
              </div>

              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isProcessing && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                You can navigate anywhere — processing continues in the background
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundUploadBanner;
