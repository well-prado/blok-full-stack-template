import { Button, ButtonProps } from "./ui/button";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useAnimation } from "../contexts/AnimationContext";

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ children, ...props }, ref) => {
  const { shouldAnimateMicroInteractions } = useAnimation();

  if (!shouldAnimateMicroInteractions) {
    return (
      <Button ref={ref} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Button ref={ref} {...props}>
        {children}
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = "AnimatedButton";
