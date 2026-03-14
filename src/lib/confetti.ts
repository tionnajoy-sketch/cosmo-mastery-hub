import confetti from "canvas-confetti";

export const fireBlockCompleteConfetti = () => {
  const duration = 2000;
  const end = Date.now() + duration;

  const colors = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#3b82f6"];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Initial burst
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });

  frame();
};
