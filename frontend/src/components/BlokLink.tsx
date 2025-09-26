/**
 * BlokLink Component - Inertia.js-inspired Link component
 * Provides seamless SPA navigation with server-side integration
 */

import React, { forwardRef, useCallback, MouseEvent, ReactNode } from "react";
import { blokRouter, type VisitOptions } from "../lib/blok-router";
import { useBlokRouter } from "../hooks/useBlokRouter";
import { cn } from "../lib/utils";

export interface BlokLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  data?: Record<string, any>;
  preserveState?: boolean;
  preserveScroll?: boolean;
  replace?: boolean;
  only?: string[];
  headers?: Record<string, string>;
  prefetch?: boolean;
  disabled?: boolean;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
  children: ReactNode;
}

/**
 * BlokLink - Main navigation component
 * Intercepts clicks and performs SPA navigation
 */
export const BlokLink = forwardRef<HTMLAnchorElement, BlokLinkProps>(
  (
    {
      href,
      method = "get",
      data = {},
      preserveState = false,
      preserveScroll = false,
      replace = false,
      only = [],
      headers = {},
      prefetch = false,
      disabled = false,
      onStart,
      onFinish,
      onError,
      onClick,
      onMouseEnter,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isNavigating, prefetch: prefetchUrl } = useBlokRouter();

    // Handle click events
    const handleClick = useCallback(
      async (event: MouseEvent<HTMLAnchorElement>) => {
        // Call original onClick if provided
        onClick?.(event);

        // Don't intercept if:
        // - Default prevented
        // - Disabled
        // - Modifier keys pressed (ctrl, cmd, shift)
        // - Right click or middle click
        // - External link
        if (
          event.defaultPrevented ||
          disabled ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.button !== 0 ||
          href.startsWith("http") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) {
          return;
        }

        // Prevent default navigation
        event.preventDefault();

        // Perform SPA navigation
        try {
          const options: VisitOptions = {
            method,
            data,
            preserveState,
            preserveScroll,
            replace,
            only,
            headers,
            onStart,
            onFinish,
            onError,
          };

          await blokRouter.visit(href, options);
        } catch (error) {
          console.error("BlokLink navigation error:", error);
          onError?.(error);

          // Fallback to regular navigation
          if (method === "get") {
            window.location.href = href;
          }
        }
      },
      [
        href,
        method,
        data,
        preserveState,
        preserveScroll,
        replace,
        only,
        headers,
        disabled,
        onStart,
        onFinish,
        onError,
        onClick,
      ]
    );

    // Handle mouse enter for prefetching
    const handleMouseEnter = useCallback(
      (event: MouseEvent<HTMLAnchorElement>) => {
        onMouseEnter?.(event);

        // Prefetch on hover if enabled and it's a GET request
        if (prefetch && method === "get" && !disabled) {
          prefetchUrl(href);
        }
      },
      [prefetch, method, disabled, href, prefetchUrl, onMouseEnter]
    );

    // Determine if link should appear disabled
    const isDisabled = disabled || (isNavigating && method !== "get");

    return (
      <a
        ref={ref}
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={cn(
          // Base styles
          "cursor-pointer transition-colors",
          // Disabled styles
          isDisabled && "cursor-not-allowed opacity-50 pointer-events-none",
          // Loading styles
          isNavigating && method !== "get" && "cursor-wait",
          className
        )}
        aria-disabled={isDisabled}
        {...props}
      >
        {children}
      </a>
    );
  }
);

BlokLink.displayName = "BlokLink";

/**
 * BlokButton - Button that performs navigation
 * Useful for form submissions and actions
 */
export interface BlokButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  href: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  data?: Record<string, any>;
  preserveState?: boolean;
  preserveScroll?: boolean;
  replace?: boolean;
  only?: string[];
  headers?: Record<string, string>;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
  children: ReactNode;
}

export const BlokButton = forwardRef<HTMLButtonElement, BlokButtonProps>(
  (
    {
      href,
      method = "post",
      data = {},
      preserveState = false,
      preserveScroll = false,
      replace = false,
      only = [],
      headers = {},
      onStart,
      onFinish,
      onError,
      onClick,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isNavigating } = useBlokRouter();

    const handleClick = useCallback(
      async (event: MouseEvent<HTMLButtonElement>) => {
        // Call original onClick if provided
        onClick?.(event);

        if (event.defaultPrevented || disabled) {
          return;
        }

        // Prevent default form submission
        event.preventDefault();

        try {
          const options: VisitOptions = {
            method,
            data,
            preserveState,
            preserveScroll,
            replace,
            only,
            headers,
            onStart,
            onFinish,
            onError,
          };

          await blokRouter.visit(href, options);
        } catch (error) {
          console.error("BlokButton navigation error:", error);
          onError?.(error);
        }
      },
      [
        href,
        method,
        data,
        preserveState,
        preserveScroll,
        replace,
        only,
        headers,
        disabled,
        onStart,
        onFinish,
        onError,
        onClick,
      ]
    );

    const isDisabled = disabled || isNavigating;

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "transition-colors",
          isNavigating && "cursor-wait",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BlokButton.displayName = "BlokButton";

/**
 * Active Link wrapper - automatically adds active styles
 */
export interface ActiveLinkProps extends BlokLinkProps {
  activeClassName?: string;
  inactiveClassName?: string;
  exact?: boolean;
}

export const ActiveLink = forwardRef<HTMLAnchorElement, ActiveLinkProps>(
  (
    {
      href,
      activeClassName = "",
      inactiveClassName = "",
      exact = false,
      className,
      ...props
    },
    ref
  ) => {
    const { currentUrl } = useBlokRouter();

    const isActive = exact
      ? currentUrl === href
      : currentUrl === href || currentUrl.startsWith(href + "/");

    const combinedClassName = cn(
      className,
      isActive ? activeClassName : inactiveClassName
    );

    return (
      <BlokLink
        ref={ref}
        href={href}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

ActiveLink.displayName = "ActiveLink";

// Export default as BlokLink
export default BlokLink;
