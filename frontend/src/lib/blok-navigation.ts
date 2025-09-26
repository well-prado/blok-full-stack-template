/**
 * Blok Navigation - Main export file
 * Provides easy imports for all navigation functionality
 */

import BlokLink, { ActiveLink, BlokButton } from '../components/BlokLink';

import { BlokNavigationProvider } from '../contexts/BlokNavigationContext';
// Import dependencies first
import { blokRouter } from './blok-router';
import { useBlokRouter } from '../hooks/useBlokRouter';

// Core router
export { blokRouter, BlokRouter } from './blok-router';
export type { VisitOptions, PageData, NavigationState } from './blok-router';

// React hook
export { useBlokRouter, useNavigationState, useActiveRoute, useNavigationEvents } from '../hooks/useBlokRouter';
export type { BlokRouterHook } from '../hooks/useBlokRouter';

// Components
export { default as BlokLink, BlokButton, ActiveLink } from '../components/BlokLink';
export type { BlokLinkProps, BlokButtonProps, ActiveLinkProps } from '../components/BlokLink';

// Context
export { BlokNavigationProvider, useBlokNavigation, withBlokNavigation } from '../contexts/BlokNavigationContext';

// Utilities
export const navigation = {
  // Quick access to router methods
  push: (url: string, options?: any) => blokRouter.push(url, options),
  replace: (url: string, options?: any) => blokRouter.replace(url, options),
  reload: (options?: any) => blokRouter.reload(options),
  back: () => blokRouter.back(),
  forward: () => blokRouter.forward(),
  
  // HTTP methods
  post: (url: string, data?: any, options?: any) => blokRouter.post(url, data, options),
  put: (url: string, data?: any, options?: any) => blokRouter.put(url, data, options),
  patch: (url: string, data?: any, options?: any) => blokRouter.patch(url, data, options),
  delete: (url: string, options?: any) => blokRouter.delete(url, options),
  
  // State
  isNavigating: () => blokRouter.isNavigating(),
  getCurrentUrl: () => blokRouter.getCurrentUrl(),
  getPageData: () => blokRouter.getPageData(),
};

// Default export for convenience
export default {
  BlokLink,
  BlokButton,
  ActiveLink,
  useBlokRouter,
  BlokNavigationProvider,
  navigation,
};
