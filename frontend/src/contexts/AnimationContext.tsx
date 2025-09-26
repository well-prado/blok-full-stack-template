import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AnimationPreferences {
  enableAnimations: boolean;
  enablePageTransitions: boolean;
  enableMicroInteractions: boolean;
  respectReducedMotion: boolean;
}

interface AnimationContextType {
  preferences: AnimationPreferences;
  updatePreferences: (updates: Partial<AnimationPreferences>) => void;
  shouldAnimate: boolean;
  shouldAnimatePageTransitions: boolean;
  shouldAnimateMicroInteractions: boolean;
}

const defaultPreferences: AnimationPreferences = {
  enableAnimations: true,
  enablePageTransitions: true,
  enableMicroInteractions: true,
  respectReducedMotion: true,
};

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] =
    useState<AnimationPreferences>(defaultPreferences);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize preferences from localStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animationPreferences");
      if (saved) {
        try {
          const savedPrefs = JSON.parse(saved);
          setPreferences({ ...defaultPreferences, ...savedPrefs });
        } catch {
          // Keep default preferences if parsing fails
        }
      }
    }
  }, []);

  // Check for system reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Persist preferences to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("animationPreferences", JSON.stringify(preferences));
    }
  }, [preferences]);

  const updatePreferences = useCallback(
    (updates: Partial<AnimationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Computed values that respect both user preferences and system settings
  const shouldAnimate =
    preferences.enableAnimations &&
    (!preferences.respectReducedMotion || !reducedMotion);

  const shouldAnimatePageTransitions =
    shouldAnimate && preferences.enablePageTransitions;

  const shouldAnimateMicroInteractions =
    shouldAnimate && preferences.enableMicroInteractions;

  const contextValue = useMemo(
    () => ({
      preferences,
      updatePreferences,
      shouldAnimate,
      shouldAnimatePageTransitions,
      shouldAnimateMicroInteractions,
    }),
    [
      preferences,
      updatePreferences,
      shouldAnimate,
      shouldAnimatePageTransitions,
      shouldAnimateMicroInteractions,
    ]
  );

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
}

// Utility hook for conditional animation props
export function useAnimationProps() {
  const {
    shouldAnimate,
    shouldAnimatePageTransitions,
    shouldAnimateMicroInteractions,
  } = useAnimation();

  return {
    // For page transitions
    pageTransition: shouldAnimatePageTransitions
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration: 0.2, ease: "easeInOut" },
        }
      : {},

    // For micro-interactions
    buttonHover: shouldAnimateMicroInteractions
      ? {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.1 },
        }
      : {},

    // For layout changes
    layout: shouldAnimate ? { layout: true } : {},

    // For theme transitions
    themeTransition: shouldAnimate
      ? {
          transition: { duration: 0.3, ease: "easeInOut" },
        }
      : {},
  };
}
