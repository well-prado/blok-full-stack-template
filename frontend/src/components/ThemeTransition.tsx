import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useAnimation } from "../contexts/AnimationContext";

interface ThemeTransitionProps {
  isTransitioning: boolean;
  onTransitionComplete: () => void;
}

export function ThemeTransition({
  isTransitioning,
  onTransitionComplete,
}: ThemeTransitionProps) {
  const { shouldAnimate } = useAnimation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning && shouldAnimate) {
      setIsVisible(true);
      // Complete transition after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        onTransitionComplete();
      }, 600); // Animation duration

      return () => clearTimeout(timer);
    } else if (isTransitioning) {
      // If animations are disabled, complete immediately
      onTransitionComplete();
    }
  }, [isTransitioning, shouldAnimate, onTransitionComplete]);

  if (!shouldAnimate || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            clipPath: "polygon(0% 100%, 0% 100%, 0% 100%)",
          }}
          animate={{
            clipPath: "polygon(0% 100%, 100% 0%, 100% 0%, 0% 100%)",
          }}
          exit={{
            clipPath: "polygon(100% 0%, 100% 0%, 100% 0%)",
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth sweep
          }}
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            background: "var(--background)",
            mixBlendMode: "difference", // Creates interesting visual effect during transition
          }}
        />
      )}
    </AnimatePresence>
  );
}

// Alternative implementation with CSS clip-path for better performance
export function ThemeTransitionCSS({
  isTransitioning,
  onTransitionComplete,
}: ThemeTransitionProps) {
  const { shouldAnimate } = useAnimation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning && shouldAnimate) {
      setIsVisible(true);

      // Trigger CSS animation
      const element = document.getElementById("theme-transition-overlay");
      if (element) {
        element.classList.add("animate-sweep");

        const handleAnimationEnd = () => {
          element.classList.remove("animate-sweep");
          setIsVisible(false);
          onTransitionComplete();
          element.removeEventListener("animationend", handleAnimationEnd);
        };

        element.addEventListener("animationend", handleAnimationEnd);
      }
    } else if (isTransitioning) {
      onTransitionComplete();
    }
  }, [isTransitioning, shouldAnimate, onTransitionComplete]);

  if (!shouldAnimate || !isVisible) {
    return null;
  }

  return (
    <div
      id="theme-transition-overlay"
      className="fixed inset-0 z-[9999] pointer-events-none theme-transition-overlay"
      style={{
        background: "var(--background)",
        clipPath: "polygon(0% 100%, 0% 100%, 0% 100%)",
      }}
    />
  );
}
