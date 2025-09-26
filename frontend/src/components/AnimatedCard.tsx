import { Card } from "./ui/card";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useAnimation } from "../contexts/AnimationContext";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enableHover?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, enableHover = true, ...props }, ref) => {
    const { shouldAnimateMicroInteractions } = useAnimation();

    if (!shouldAnimateMicroInteractions) {
      return (
        <Card ref={ref} {...props}>
          {children}
        </Card>
      );
    }

    return (
      <motion.div
        whileHover={enableHover ? { y: -2, scale: 1.01 } : {}}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Card ref={ref} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";
