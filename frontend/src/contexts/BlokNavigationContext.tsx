/**
 * Blok Navigation Context - Global navigation state management
 * Provides navigation state and methods throughout the React app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { blokRouter, type NavigationState } from "../lib/blok-router";

interface BlokNavigationContextType extends NavigationState {
  // Navigation methods
  visit: (url: string, options?: any) => Promise<void>;
  push: (url: string, options?: any) => Promise<void>;
  replace: (url: string, options?: any) => Promise<void>;
  reload: (options?: any) => Promise<void>;
  back: () => void;
  forward: () => void;

  // Utilities
  isActive: (url: string, exact?: boolean) => boolean;
  prefetch: (url: string) => Promise<void>;
}

const BlokNavigationContext = createContext<
  BlokNavigationContextType | undefined
>(undefined);

interface BlokNavigationProviderProps {
  children: ReactNode;
}

/**
 * Navigation Provider - Wraps app with navigation context
 */
export function BlokNavigationProvider({
  children,
}: BlokNavigationProviderProps) {
  const [state, setState] = useState<NavigationState>(blokRouter.getState());

  useEffect(() => {
    // Subscribe to router state changes
    const unsubscribe = blokRouter.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Navigation methods
  const visit = async (url: string, options: any = {}) => {
    return blokRouter.visit(url, options);
  };

  const push = async (url: string, options: any = {}) => {
    return blokRouter.push(url, options);
  };

  const replace = async (url: string, options: any = {}) => {
    return blokRouter.replace(url, options);
  };

  const reload = async (options: any = {}) => {
    return blokRouter.reload(options);
  };

  const back = () => {
    blokRouter.back();
  };

  const forward = () => {
    blokRouter.forward();
  };

  // Utilities
  const isActive = (url: string, exact: boolean = false) => {
    return exact
      ? state.currentUrl === url
      : state.currentUrl === url || state.currentUrl.startsWith(url + "/");
  };

  const prefetch = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Inertia": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });

      if (response.ok) {
        await response.json();
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  };

  const contextValue: BlokNavigationContextType = {
    // State
    ...state,

    // Methods
    visit,
    push,
    replace,
    reload,
    back,
    forward,

    // Utilities
    isActive,
    prefetch,
  };

  return (
    <BlokNavigationContext.Provider value={contextValue}>
      {children}
    </BlokNavigationContext.Provider>
  );
}

/**
 * Hook to use navigation context
 */
export function useBlokNavigation() {
  const context = useContext(BlokNavigationContext);
  if (context === undefined) {
    throw new Error(
      "useBlokNavigation must be used within a BlokNavigationProvider"
    );
  }
  return context;
}

/**
 * Higher-order component for navigation
 */
export function withBlokNavigation<P extends object>(
  Component: React.ComponentType<P>
) {
  return function BlokNavigationComponent(props: P) {
    const navigation = useBlokNavigation();
    return <Component {...props} navigation={navigation} />;
  };
}

export default BlokNavigationContext;
