/**
 * Enhanced Error Handler with Blok Navigation
 * Replaces window.location navigation with SPA navigation
 */

import { toast } from "sonner";
import { blokRouter } from "./blok-router";

interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectToLogin?: boolean;
  customMessage?: string;
}

// Global flags to prevent multiple redirects and toasts
let isRedirecting = false;
let lastAuthErrorTime = 0;

export class BlokErrorHandler {
  /**
   * Handle HTTP response errors gracefully with Blok navigation
   */
  static async handleResponse(response: Response, options: ErrorHandlerOptions = {}) {
    const { showToast = true, redirectToLogin = true, customMessage } = options;

    if (!response.ok) {
      let errorMessage = customMessage || `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }

      // Handle authentication errors with deduplication
      if (response.status === 401) {
        const now = Date.now();
        
        // Prevent multiple auth error toasts within 5 seconds
        if (now - lastAuthErrorTime > 5000) {
          lastAuthErrorTime = now;
          
          if (showToast) {
            toast.error("Authentication Required", {
              description: "Please log in to continue",
              action: {
                label: "Login",
                onClick: () => {
                  // Use Blok navigation instead of window.location
                  this.redirectToLogin();
                }
              }
            });
          }
        }

        if (redirectToLogin) {
          this.redirectToLogin();
        }
        return;
      }

      // Handle other errors
      if (showToast) {
        if (response.status >= 500) {
          toast.error("Server Error", {
            description: "Something went wrong on our end. Please try again later."
          });
        } else if (response.status === 403) {
          toast.error("Access Denied", {
            description: "You don't have permission to access this resource."
          });
        } else if (response.status === 404) {
          toast.error("Not Found", {
            description: "The requested resource could not be found."
          });
        } else {
          toast.error("Error", {
            description: errorMessage
          });
        }
      }

      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Handle generic errors with proper navigation
   */
  static handleGenericError(error: unknown, options: ErrorHandlerOptions = {}) {
    const { showToast = true, customMessage } = options;
    
    console.error('Error occurred:', error);

    if (showToast) {
      const message = customMessage || 
        (error instanceof Error ? error.message : 'An unexpected error occurred');
      
      toast.error("Error", {
        description: message
      });
    }

    // Check if it's an auth-related error
    if (error instanceof Error && 
        (error.message.includes('401') || 
         error.message.includes('Unauthorized') ||
         error.message.includes('Authentication'))) {
      this.redirectToLogin();
    }
  }

  /**
   * Show success message
   */
  static showSuccess(message: string, description?: string) {
    toast.success(message, {
      description
    });
  }

  /**
   * Show info message
   */
  static showInfo(message: string, description?: string) {
    toast.info(message, {
      description
    });
  }

  /**
   * Show warning message
   */
  static showWarning(message: string, description?: string) {
    toast.warning(message, {
      description
    });
  }

  /**
   * Centralized login redirect with Blok navigation
   */
  static redirectToLogin() {
    if (isRedirecting) return; // Prevent multiple redirects
    
    isRedirecting = true;
    
    // Clear session cookies
    document.cookie = "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Use Blok navigation for SPA redirect
    setTimeout(async () => {
      try {
        await blokRouter.push("/login");
      } catch (error) {
        console.error("Blok navigation failed, falling back to window.location:", error);
        // Fallback to regular navigation if Blok navigation fails
        window.location.href = "/login";
      } finally {
        isRedirecting = false;
      }
    }, 1000);
  }

  /**
   * Reload current page with Blok navigation
   */
  static async reloadPage() {
    try {
      await blokRouter.reload();
    } catch (error) {
      console.error("Blok reload failed, falling back to window.location.reload:", error);
      // Fallback to regular reload if Blok navigation fails
      window.location.reload();
    }
  }
}

/**
 * Utility function for API calls with built-in error handling
 */
export async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  errorOptions: ErrorHandlerOptions = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    await BlokErrorHandler.handleResponse(response, errorOptions);
    return await response.json();
  } catch (error) {
    BlokErrorHandler.handleGenericError(error, errorOptions);
    throw error;
  }
}

// Export for backward compatibility
export const ErrorHandler = BlokErrorHandler;
