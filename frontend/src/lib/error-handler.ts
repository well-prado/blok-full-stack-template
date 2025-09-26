import { blokRouter } from "./blok-router";
import { toast } from "sonner";

/**
 * Error Handler Utility
 * 
 * Provides graceful error handling with toast notifications and automatic login redirects
 */

interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectToLogin?: boolean;
  customMessage?: string;
}

// Global state for error deduplication
let isRedirecting = false;
let lastAuthErrorTime = 0;
const AUTH_ERROR_COOLDOWN = 2000; // 2 seconds cooldown between auth error toasts

export class ErrorHandler {
  /**
   * Handle HTTP response errors gracefully
   */
  static async handleResponse(response: Response, options: ErrorHandlerOptions = {}) {
    const { showToast = true, redirectToLogin = true, customMessage } = options;

    if (!response.ok) {
      let errorMessage = customMessage || "An error occurred";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Handle authentication errors
      if (response.status === 401) {
        const now = Date.now();
        
        // Notify AuthContext about auth error
        window.dispatchEvent(new CustomEvent('auth-error'));
        
        // Prevent multiple auth error toasts within cooldown period
        if (showToast && (now - lastAuthErrorTime) > AUTH_ERROR_COOLDOWN) {
          lastAuthErrorTime = now;
          toast.error("Session expired", {
            description: "Please log in again to continue",
            action: {
              label: "Login",
              onClick: () => {
                ErrorHandler.redirectToLogin();
              },
            },
          });
        }
        
        // Always redirect on 401, but prevent multiple redirects
        if (redirectToLogin && !isRedirecting) {
          ErrorHandler.redirectToLogin();
        }
        return;
      }

      // Handle other HTTP errors
      if (showToast) {
        let toastTitle = "Error";
        let toastDescription = errorMessage;

        switch (response.status) {
          case 400:
            toastTitle = "Invalid Request";
            break;
          case 403:
            toastTitle = "Access Denied";
            toastDescription = "You don't have permission to perform this action";
            break;
          case 404:
            toastTitle = "Not Found";
            toastDescription = "The requested resource was not found";
            break;
          case 500:
            toastTitle = "Server Error";
            toastDescription = "Something went wrong on our end. Please try again later.";
            break;
          default:
            toastTitle = `Error ${response.status}`;
        }

        toast.error(toastTitle, {
          description: toastDescription,
        });
      }

      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Handle generic errors (network, parsing, etc.)
   */
  static handleGenericError(error: unknown, options: ErrorHandlerOptions = {}) {
    const { showToast = true, customMessage } = options;
    
    let errorMessage = customMessage || "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle network errors
    if (errorMessage.includes("fetch")) {
      errorMessage = "Network error. Please check your connection and try again.";
    }

    if (showToast) {
      toast.error("Error", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => {
            blokRouter.reload();
          },
        },
      });
    }

    console.error("Error handled by ErrorHandler:", error);
  }

  /**
   * Handle success messages
   */
  static showSuccess(message: string, description?: string) {
    toast.success(message, {
      description,
    });
  }

  /**
   * Handle info messages
   */
  static showInfo(message: string, description?: string) {
    toast.info(message, {
      description,
    });
  }

  /**
   * Handle warning messages
   */
  static showWarning(message: string, description?: string) {
    toast.warning(message, {
      description,
    });
  }

  /**
   * Centralized login redirect with proper cleanup
   */
  static redirectToLogin() {
    if (isRedirecting) return; // Prevent multiple redirects
    
    isRedirecting = true;
    
    // Clear session cookies
    document.cookie = "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Get current path for return URL
    const currentPath = window.location.pathname;
    const returnUrl = currentPath !== '/login' ? `?returnTo=${encodeURIComponent(currentPath)}` : '';
    
    // Redirect after a short delay to allow toast to show
    setTimeout(() => {
      blokRouter.push(`/login${returnUrl}`);
      // Reset redirect flag after navigation
      setTimeout(() => {
        isRedirecting = false;
      }, 500);
    }, 1000);
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
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include session cookies
    });

    await ErrorHandler.handleResponse(response, errorOptions);
    
    return await response.json();
  } catch (error) {
    ErrorHandler.handleGenericError(error, errorOptions);
    throw error;
  }
}
