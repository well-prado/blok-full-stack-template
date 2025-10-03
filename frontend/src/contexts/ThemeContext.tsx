import React, { createContext, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";
import { useWorkflowMutation } from "../blok-types";

export interface ThemeDefinition {
  id: string;
  name: string;
  category:
    | "Professional"
    | "Creative"
    | "High-contrast"
    | "Focus"
    | "Energetic";
  description: string;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export type ThemeMode = "light" | "dark";
export type ThemeId =
  | "classic"
  | "ocean"
  | "forest"
  | "sunset"
  | "purple"
  | "rose";

interface ThemeContextType {
  themeId: ThemeId;
  themeMode: ThemeMode;
  setTheme: (themeId: ThemeId, mode?: ThemeMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  currentTheme: ThemeDefinition;
  allThemes: ThemeDefinition[];
  isTransitioning: boolean;
}

const themeDefinitions: ThemeDefinition[] = [
  {
    id: "classic",
    name: "Classic",
    category: "Professional",
    description: "Clean, professional design with excellent readability",
    colors: {
      light: {
        "--background": "oklch(1 0 0)",
        "--foreground": "oklch(0.145 0 0)",
        "--card": "oklch(1 0 0)",
        "--card-foreground": "oklch(0.145 0 0)",
        "--popover": "oklch(1 0 0)",
        "--popover-foreground": "oklch(0.145 0 0)",
        "--primary": "oklch(0.205 0 0)",
        "--primary-foreground": "oklch(0.985 0 0)",
        "--secondary": "oklch(0.97 0 0)",
        "--secondary-foreground": "oklch(0.205 0 0)",
        "--muted": "oklch(0.97 0 0)",
        "--muted-foreground": "oklch(0.556 0 0)",
        "--accent": "oklch(0.97 0 0)",
        "--accent-foreground": "oklch(0.205 0 0)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.577 0.245 27.325)",
        "--border": "oklch(0.922 0 0)",
        "--input": "oklch(0.922 0 0)",
        "--ring": "oklch(0.708 0 0)",
      },
      dark: {
        "--background": "oklch(0.08 0 0)",
        "--foreground": "oklch(0.98 0 0)",
        "--card": "oklch(0.08 0 0)",
        "--card-foreground": "oklch(0.98 0 0)",
        "--popover": "oklch(0.08 0 0)",
        "--popover-foreground": "oklch(0.98 0 0)",
        "--primary": "oklch(0.98 0 0)",
        "--primary-foreground": "oklch(0.08 0 0)",
        "--secondary": "oklch(0.12 0 0)",
        "--secondary-foreground": "oklch(0.98 0 0)",
        "--muted": "oklch(0.12 0 0)",
        "--muted-foreground": "oklch(0.65 0 0)",
        "--accent": "oklch(0.12 0 0)",
        "--accent-foreground": "oklch(0.98 0 0)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.98 0 0)",
        "--border": "oklch(0.15 0 0)",
        "--input": "oklch(0.12 0 0)",
        "--ring": "oklch(0.35 0 0)",
      },
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    category: "Professional",
    description: "Calming blue tones perfect for focus and productivity",
    colors: {
      light: {
        "--background": "oklch(0.98 0.005 240)",
        "--foreground": "oklch(0.15 0.02 240)",
        "--card": "oklch(0.99 0.003 240)",
        "--card-foreground": "oklch(0.15 0.02 240)",
        "--popover": "oklch(0.99 0.003 240)",
        "--popover-foreground": "oklch(0.15 0.02 240)",
        "--primary": "oklch(0.55 0.15 240)",
        "--primary-foreground": "oklch(0.98 0.005 240)",
        "--secondary": "oklch(0.95 0.01 240)",
        "--secondary-foreground": "oklch(0.25 0.05 240)",
        "--muted": "oklch(0.95 0.01 240)",
        "--muted-foreground": "oklch(0.55 0.05 240)",
        "--accent": "oklch(0.92 0.02 240)",
        "--accent-foreground": "oklch(0.25 0.05 240)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.98 0.005 240)",
        "--border": "oklch(0.9 0.02 240)",
        "--input": "oklch(0.9 0.02 240)",
        "--ring": "oklch(0.55 0.15 240)",
      },
      dark: {
        "--background": "oklch(0.08 0.02 240)",
        "--foreground": "oklch(0.95 0.01 240)",
        "--card": "oklch(0.1 0.02 240)",
        "--card-foreground": "oklch(0.95 0.01 240)",
        "--popover": "oklch(0.1 0.02 240)",
        "--popover-foreground": "oklch(0.95 0.01 240)",
        "--primary": "oklch(0.65 0.15 240)",
        "--primary-foreground": "oklch(0.08 0.02 240)",
        "--secondary": "oklch(0.15 0.03 240)",
        "--secondary-foreground": "oklch(0.9 0.01 240)",
        "--muted": "oklch(0.15 0.03 240)",
        "--muted-foreground": "oklch(0.6 0.05 240)",
        "--accent": "oklch(0.18 0.04 240)",
        "--accent-foreground": "oklch(0.9 0.01 240)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.95 0.01 240)",
        "--border": "oklch(0.2 0.04 240)",
        "--input": "oklch(0.18 0.04 240)",
        "--ring": "oklch(0.65 0.15 240)",
      },
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    category: "Focus",
    description: "Natural green tones that reduce eye strain and promote focus",
    colors: {
      light: {
        "--background": "oklch(0.98 0.005 150)",
        "--foreground": "oklch(0.15 0.02 150)",
        "--card": "oklch(0.99 0.003 150)",
        "--card-foreground": "oklch(0.15 0.02 150)",
        "--popover": "oklch(0.99 0.003 150)",
        "--popover-foreground": "oklch(0.15 0.02 150)",
        "--primary": "oklch(0.45 0.12 150)",
        "--primary-foreground": "oklch(0.98 0.005 150)",
        "--secondary": "oklch(0.95 0.01 150)",
        "--secondary-foreground": "oklch(0.25 0.05 150)",
        "--muted": "oklch(0.95 0.01 150)",
        "--muted-foreground": "oklch(0.55 0.05 150)",
        "--accent": "oklch(0.92 0.02 150)",
        "--accent-foreground": "oklch(0.25 0.05 150)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.98 0.005 150)",
        "--border": "oklch(0.9 0.02 150)",
        "--input": "oklch(0.9 0.02 150)",
        "--ring": "oklch(0.45 0.12 150)",
      },
      dark: {
        "--background": "oklch(0.08 0.02 150)",
        "--foreground": "oklch(0.95 0.01 150)",
        "--card": "oklch(0.1 0.02 150)",
        "--card-foreground": "oklch(0.95 0.01 150)",
        "--popover": "oklch(0.1 0.02 150)",
        "--popover-foreground": "oklch(0.95 0.01 150)",
        "--primary": "oklch(0.6 0.12 150)",
        "--primary-foreground": "oklch(0.08 0.02 150)",
        "--secondary": "oklch(0.15 0.03 150)",
        "--secondary-foreground": "oklch(0.9 0.01 150)",
        "--muted": "oklch(0.15 0.03 150)",
        "--muted-foreground": "oklch(0.6 0.05 150)",
        "--accent": "oklch(0.18 0.04 150)",
        "--accent-foreground": "oklch(0.9 0.01 150)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.95 0.01 150)",
        "--border": "oklch(0.2 0.04 150)",
        "--input": "oklch(0.18 0.04 150)",
        "--ring": "oklch(0.6 0.12 150)",
      },
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    category: "Energetic",
    description: "Warm, energizing colors that inspire creativity and action",
    colors: {
      light: {
        "--background": "oklch(0.98 0.005 50)",
        "--foreground": "oklch(0.15 0.02 50)",
        "--card": "oklch(0.99 0.003 50)",
        "--card-foreground": "oklch(0.15 0.02 50)",
        "--popover": "oklch(0.99 0.003 50)",
        "--popover-foreground": "oklch(0.15 0.02 50)",
        "--primary": "oklch(0.6 0.15 50)",
        "--primary-foreground": "oklch(0.98 0.005 50)",
        "--secondary": "oklch(0.95 0.01 50)",
        "--secondary-foreground": "oklch(0.25 0.05 50)",
        "--muted": "oklch(0.95 0.01 50)",
        "--muted-foreground": "oklch(0.55 0.05 50)",
        "--accent": "oklch(0.92 0.02 50)",
        "--accent-foreground": "oklch(0.25 0.05 50)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.98 0.005 50)",
        "--border": "oklch(0.9 0.02 50)",
        "--input": "oklch(0.9 0.02 50)",
        "--ring": "oklch(0.6 0.15 50)",
      },
      dark: {
        "--background": "oklch(0.08 0.02 50)",
        "--foreground": "oklch(0.95 0.01 50)",
        "--card": "oklch(0.1 0.02 50)",
        "--card-foreground": "oklch(0.95 0.01 50)",
        "--popover": "oklch(0.1 0.02 50)",
        "--popover-foreground": "oklch(0.95 0.01 50)",
        "--primary": "oklch(0.7 0.15 50)",
        "--primary-foreground": "oklch(0.08 0.02 50)",
        "--secondary": "oklch(0.15 0.03 50)",
        "--secondary-foreground": "oklch(0.9 0.01 50)",
        "--muted": "oklch(0.15 0.03 50)",
        "--muted-foreground": "oklch(0.6 0.05 50)",
        "--accent": "oklch(0.18 0.04 50)",
        "--accent-foreground": "oklch(0.9 0.01 50)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.95 0.01 50)",
        "--border": "oklch(0.2 0.04 50)",
        "--input": "oklch(0.18 0.04 50)",
        "--ring": "oklch(0.7 0.15 50)",
      },
    },
  },
  {
    id: "purple",
    name: "Royal Purple",
    category: "Creative",
    description: "Rich purple tones that spark creativity and innovation",
    colors: {
      light: {
        "--background": "oklch(0.98 0.005 300)",
        "--foreground": "oklch(0.15 0.02 300)",
        "--card": "oklch(0.99 0.003 300)",
        "--card-foreground": "oklch(0.15 0.02 300)",
        "--popover": "oklch(0.99 0.003 300)",
        "--popover-foreground": "oklch(0.15 0.02 300)",
        "--primary": "oklch(0.5 0.15 300)",
        "--primary-foreground": "oklch(0.98 0.005 300)",
        "--secondary": "oklch(0.95 0.01 300)",
        "--secondary-foreground": "oklch(0.25 0.05 300)",
        "--muted": "oklch(0.95 0.01 300)",
        "--muted-foreground": "oklch(0.55 0.05 300)",
        "--accent": "oklch(0.92 0.02 300)",
        "--accent-foreground": "oklch(0.25 0.05 300)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.98 0.005 300)",
        "--border": "oklch(0.9 0.02 300)",
        "--input": "oklch(0.9 0.02 300)",
        "--ring": "oklch(0.5 0.15 300)",
      },
      dark: {
        "--background": "oklch(0.08 0.02 300)",
        "--foreground": "oklch(0.95 0.01 300)",
        "--card": "oklch(0.1 0.02 300)",
        "--card-foreground": "oklch(0.95 0.01 300)",
        "--popover": "oklch(0.1 0.02 300)",
        "--popover-foreground": "oklch(0.95 0.01 300)",
        "--primary": "oklch(0.65 0.15 300)",
        "--primary-foreground": "oklch(0.08 0.02 300)",
        "--secondary": "oklch(0.15 0.03 300)",
        "--secondary-foreground": "oklch(0.9 0.01 300)",
        "--muted": "oklch(0.15 0.03 300)",
        "--muted-foreground": "oklch(0.6 0.05 300)",
        "--accent": "oklch(0.18 0.04 300)",
        "--accent-foreground": "oklch(0.9 0.01 300)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.95 0.01 300)",
        "--border": "oklch(0.2 0.04 300)",
        "--input": "oklch(0.18 0.04 300)",
        "--ring": "oklch(0.65 0.15 300)",
      },
    },
  },
  {
    id: "rose",
    name: "Rose Pink",
    category: "Creative",
    description: "Elegant pink tones that create a warm, welcoming atmosphere",
    colors: {
      light: {
        "--background": "oklch(0.98 0.005 350)",
        "--foreground": "oklch(0.15 0.02 350)",
        "--card": "oklch(0.99 0.003 350)",
        "--card-foreground": "oklch(0.15 0.02 350)",
        "--popover": "oklch(0.99 0.003 350)",
        "--popover-foreground": "oklch(0.15 0.02 350)",
        "--primary": "oklch(0.55 0.12 350)",
        "--primary-foreground": "oklch(0.98 0.005 350)",
        "--secondary": "oklch(0.95 0.01 350)",
        "--secondary-foreground": "oklch(0.25 0.05 350)",
        "--muted": "oklch(0.95 0.01 350)",
        "--muted-foreground": "oklch(0.55 0.05 350)",
        "--accent": "oklch(0.92 0.02 350)",
        "--accent-foreground": "oklch(0.25 0.05 350)",
        "--destructive": "oklch(0.577 0.245 27.325)",
        "--destructive-foreground": "oklch(0.98 0.005 350)",
        "--border": "oklch(0.9 0.02 350)",
        "--input": "oklch(0.9 0.02 350)",
        "--ring": "oklch(0.55 0.12 350)",
      },
      dark: {
        "--background": "oklch(0.08 0.02 350)",
        "--foreground": "oklch(0.95 0.01 350)",
        "--card": "oklch(0.1 0.02 350)",
        "--card-foreground": "oklch(0.95 0.01 350)",
        "--popover": "oklch(0.1 0.02 350)",
        "--popover-foreground": "oklch(0.95 0.01 350)",
        "--primary": "oklch(0.65 0.12 350)",
        "--primary-foreground": "oklch(0.08 0.02 350)",
        "--secondary": "oklch(0.15 0.03 350)",
        "--secondary-foreground": "oklch(0.9 0.01 350)",
        "--muted": "oklch(0.15 0.03 350)",
        "--muted-foreground": "oklch(0.6 0.05 350)",
        "--accent": "oklch(0.18 0.04 350)",
        "--accent-foreground": "oklch(0.9 0.01 350)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.95 0.01 350)",
        "--border": "oklch(0.2 0.04 350)",
        "--input": "oklch(0.18 0.04 350)",
        "--ring": "oklch(0.65 0.12 350)",
      },
    },
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    // Migration: check for old theme format first
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "light" || oldTheme === "dark") {
      localStorage.removeItem("theme");
      return "classic";
    }

    const saved = localStorage.getItem("themeId") as ThemeId;
    return saved || "classic";
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Migration: check for old theme format first
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "light" || oldTheme === "dark") {
      localStorage.removeItem("theme");
      return oldTheme as ThemeMode;
    }

    const saved = localStorage.getItem("themeMode") as ThemeMode;
    if (saved) return saved;

    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });

  // Safely get auth state - handle case where AuthProvider isn't ready yet
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    isAuthenticated = authContext?.isAuthenticated || false;
  } catch (error) {
    console.warn("AuthProvider not ready yet, defaulting to unauthenticated");
    isAuthenticated = false;
  }

  // SDK hook for theme preferences
  const themePreferencesMutation = useWorkflowMutation({
    workflowKey: "theme-preferences",
    onError: (error) => {
      console.warn("Failed to save theme preferences to database:", error);
    },
  });

  const currentTheme =
    themeDefinitions.find((t) => t.id === themeId) || themeDefinitions[0];

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes and data attributes
    root.classList.remove("light", "dark");
    themeDefinitions.forEach((theme) => {
      root.removeAttribute(`data-theme-${theme.id}`);
    });

    // Add current theme mode class
    root.classList.add(themeMode);

    // Set theme data attributes for CSS targeting
    root.setAttribute("data-theme", themeMode);
    root.setAttribute(`data-theme-${themeId}`, "true");

    // Apply CSS variables
    const colors = currentTheme.colors[themeMode];
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Save to localStorage
    localStorage.setItem("themeId", themeId);
    localStorage.setItem("themeMode", themeMode);
  }, [themeId, themeMode, currentTheme]);

  const setTheme = async (newThemeId: ThemeId, newMode?: ThemeMode) => {
    const targetMode = newMode || themeMode;

    // Start transition animation
    setIsTransitioning(true);

    // Small delay to ensure animation starts
    setTimeout(() => {
      setThemeId(newThemeId);
      if (newMode) {
        setThemeMode(newMode);
      }

      // Save to database if user is authenticated
      if (isAuthenticated) {
        themePreferencesMutation.mutate({
          themeId: newThemeId,
          themeMode: targetMode,
        });
      }
    }, 100);
  };

  const updateThemeMode = async (newMode: ThemeMode) => {
    // Start transition animation
    setIsTransitioning(true);

    // Small delay to ensure animation starts
    setTimeout(() => {
      setThemeMode(newMode);

      // Save to database if user is authenticated
      if (isAuthenticated) {
        themePreferencesMutation.mutate({
          themeId,
          themeMode: newMode,
        });
      }
    }, 100);
  };

  const toggleThemeMode = async () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    await updateThemeMode(newMode);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        themeMode,
        setTheme,
        setThemeMode: updateThemeMode,
        toggleThemeMode,
        currentTheme,
        allThemes: themeDefinitions,
        isTransitioning,
      }}
    >
      {children}
      {/* Theme transition overlay */}
      <div
        id="theme-transition-overlay"
        className={`fixed inset-0 z-[9999] pointer-events-none theme-transition-overlay ${
          isTransitioning ? "animate-sweep" : ""
        }`}
        style={{
          background: "var(--background)",
          clipPath: "polygon(0% 100%, 0% 100%, 0% 100%)",
          display: isTransitioning ? "block" : "none",
        }}
        onAnimationEnd={handleTransitionComplete}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
