import { AnimatePresence, motion } from "framer-motion";

import { useAnimation } from "../contexts/AnimationContext";

interface AnimatedTabContentProps {
  activeTab: string;
  children: React.ReactNode;
  tabKey: string;
}

export function AnimatedTabContent({
  activeTab,
  children,
  tabKey,
}: AnimatedTabContentProps) {
  const { shouldAnimate } = useAnimation();

  if (!shouldAnimate) {
    // If animations are disabled, render content directly
    return activeTab === tabKey ? <>{children}</> : null;
  }

  return (
    <AnimatePresence mode="wait">
      {activeTab === tabKey && (
        <motion.div
          key={tabKey}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth feel
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alternative implementation with different animation styles
export function AnimatedTabContentSlide({
  activeTab,
  children,
  tabKey,
}: AnimatedTabContentProps) {
  const { shouldAnimate } = useAnimation();

  if (!shouldAnimate) {
    return activeTab === tabKey ? <>{children}</> : null;
  }

  return (
    <AnimatePresence mode="wait">
      {activeTab === tabKey && (
        <motion.div
          key={tabKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fade-only animation for subtle effect
export function AnimatedTabContentFade({
  activeTab,
  children,
  tabKey,
}: AnimatedTabContentProps) {
  const { shouldAnimate } = useAnimation();

  if (!shouldAnimate) {
    return activeTab === tabKey ? <>{children}</> : null;
  }

  return (
    <AnimatePresence mode="wait">
      {activeTab === tabKey && (
        <motion.div
          key={tabKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
