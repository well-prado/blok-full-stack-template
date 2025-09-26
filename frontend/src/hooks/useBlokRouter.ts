/**
 * useBlokRouter Hook - React hook for Blok navigation
 * Provides Next.js-style router functionality for programmatic navigation
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { blokRouter, type VisitOptions, type PageData, type NavigationState } from '../lib/blok-router';

export interface BlokRouterHook {
  // Navigation methods
  push: (url: string, options?: Omit<VisitOptions, 'method'>) => Promise<void>;
  replace: (url: string, options?: Omit<VisitOptions, 'method' | 'replace'>) => Promise<void>;
  back: () => void;
  forward: () => void;
  reload: (options?: Omit<VisitOptions, 'method'>) => Promise<void>;
  
  // HTTP methods
  post: (url: string, data?: Record<string, any>, options?: Omit<VisitOptions, 'method' | 'data'>) => Promise<void>;
  put: (url: string, data?: Record<string, any>, options?: Omit<VisitOptions, 'method' | 'data'>) => Promise<void>;
  patch: (url: string, data?: Record<string, any>, options?: Omit<VisitOptions, 'method' | 'data'>) => Promise<void>;
  delete: (url: string, options?: Omit<VisitOptions, 'method'>) => Promise<void>;
  
  // State
  isNavigating: boolean;
  currentUrl: string;
  pageData: PageData | null;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Utilities
  isActive: (url: string) => boolean;
  prefetch: (url: string) => Promise<void>;
}

/**
 * Hook for accessing Blok router functionality
 * Similar to Next.js useRouter() hook
 */
export function useBlokRouter(): BlokRouterHook {
  // Subscribe to router state changes using React 18's useSyncExternalStore
  const state = useSyncExternalStore(
    useCallback((listener: (state: NavigationState) => void) => {
      return blokRouter.subscribe(listener);
    }, []),
    useCallback(() => blokRouter.getSnapshot(), []),
    useCallback(() => blokRouter.getSnapshot(), [])
  );

  // Navigation methods (memoized to prevent unnecessary re-renders)
  const push = useCallback(async (url: string, options?: Omit<VisitOptions, 'method'>) => {
    return blokRouter.push(url, options);
  }, []);

  const replace = useCallback(async (url: string, options?: Omit<VisitOptions, 'method' | 'replace'>) => {
    return blokRouter.replace(url, options);
  }, []);

  const back = useCallback(() => {
    blokRouter.back();
  }, []);

  const forward = useCallback(() => {
    blokRouter.forward();
  }, []);

  const reload = useCallback(async (options?: Omit<VisitOptions, 'method'>) => {
    return blokRouter.reload(options);
  }, []);

  // HTTP methods
  const post = useCallback(async (
    url: string, 
    data: Record<string, any> = {}, 
    options?: Omit<VisitOptions, 'method' | 'data'>
  ) => {
    return blokRouter.post(url, data, options);
  }, []);

  const put = useCallback(async (
    url: string, 
    data: Record<string, any> = {}, 
    options?: Omit<VisitOptions, 'method' | 'data'>
  ) => {
    return blokRouter.put(url, data, options);
  }, []);

  const patch = useCallback(async (
    url: string, 
    data: Record<string, any> = {}, 
    options?: Omit<VisitOptions, 'method' | 'data'>
  ) => {
    return blokRouter.patch(url, data, options);
  }, []);

  const deleteMethod = useCallback(async (
    url: string, 
    options?: Omit<VisitOptions, 'method'>
  ) => {
    return blokRouter.delete(url, options);
  }, []);

  // Utility functions
  const isActive = useCallback((url: string) => {
    return state.currentUrl === url || 
           state.currentUrl.startsWith(url + '/') ||
           (url !== '/' && state.currentUrl.startsWith(url));
  }, [state.currentUrl]);

  const prefetch = useCallback(async (url: string) => {
    // Prefetch page data without navigation
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Inertia': 'true',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        // Cache the response for faster navigation
        await response.json();
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  }, []);

  return {
    // Navigation methods
    push,
    replace,
    back,
    forward,
    reload,
    
    // HTTP methods
    post,
    put,
    patch,
    delete: deleteMethod,
    
    // State
    isNavigating: state.isNavigating,
    currentUrl: state.currentUrl,
    pageData: state.pageData,
    canGoBack: state.canGoBack,
    canGoForward: state.canGoForward,
    
    // Utilities
    isActive,
    prefetch,
  };
}

/**
 * Hook for navigation loading state
 * Useful for showing loading indicators during navigation
 */
export function useNavigationState() {
  const { isNavigating, currentUrl } = useBlokRouter();
  const [previousUrl, setPreviousUrl] = useState(currentUrl);

  useEffect(() => {
    if (!isNavigating && currentUrl !== previousUrl) {
      setPreviousUrl(currentUrl);
    }
  }, [isNavigating, currentUrl, previousUrl]);

  return {
    isNavigating,
    currentUrl,
    previousUrl,
    hasNavigated: currentUrl !== previousUrl,
  };
}

/**
 * Hook for checking if a route is active
 * Useful for navigation highlighting
 */
export function useActiveRoute(url: string, exact: boolean = false) {
  const { currentUrl } = useBlokRouter();
  
  const isActive = exact 
    ? currentUrl === url
    : currentUrl === url || currentUrl.startsWith(url + '/');
    
  return isActive;
}

/**
 * Hook for handling navigation events
 * Useful for analytics, logging, or cleanup
 */
export function useNavigationEvents() {
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const { currentUrl } = useBlokRouter();

  useEffect(() => {
    setNavigationHistory(prev => [...prev, currentUrl]);
  }, [currentUrl]);

  const clearHistory = useCallback(() => {
    setNavigationHistory([currentUrl]);
  }, [currentUrl]);

  return {
    navigationHistory,
    clearHistory,
    visitCount: navigationHistory.length,
    lastVisited: navigationHistory[navigationHistory.length - 2],
  };
}
