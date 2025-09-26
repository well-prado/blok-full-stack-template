import React, { createContext, useContext, useEffect, useState } from "react";
import { type User } from "../lib/api";
import { ErrorHandler } from "../lib/error-handler";
import { blokRouter } from "../lib/blok-router";
import { useWorkflowMutation } from "../blok-types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Internal component that handles SDK mutations
function AuthProviderInternal({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SDK Mutations
  const loginMutation = useWorkflowMutation({
    workflowName: "auth-login",
    onSuccess: (data) => {
      if (data.success && data.user) {
        const userWithPreferences = data.user as unknown as User;
        setUser(userWithPreferences);
        ErrorHandler.showSuccess(
          "Welcome back!",
          `Logged in as ${userWithPreferences.name}`
        );
      }
    },
    onError: (error) => {
      ErrorHandler.handleGenericError(error);
    },
  });

  const registerMutation = useWorkflowMutation({
    workflowName: "auth-register",
    onSuccess: (data) => {
      if (data.success && data.user) {
        setUser(data.user as unknown as User);
      }
    },
    onError: (error) => {
      console.error("Registration error:", error);
    },
  });

  const logoutMutation = useWorkflowMutation({
    workflowName: "auth-logout" as any, // Use auth-logout workflow (not in types due to auth requirements)
    onSuccess: () => {
      // Clear user state immediately
      setUser(null);

      // Clear session cookies
      document.cookie =
        "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Navigate to login page
      blokRouter.push("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout API fails, clear local state and redirect
      setUser(null);
      document.cookie =
        "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      blokRouter.push("/login");
    },
  });

  useEffect(() => {
    // Initialize auth state from server-injected data (Laravel + Inertia.js style)
    const initAuth = () => {
      // Get server-injected auth data
      const serverAuthData = (window as any).__BLOK_AUTH__;

      if (
        serverAuthData &&
        serverAuthData.isAuthenticated &&
        serverAuthData.user
      ) {
        setUser(serverAuthData.user);
      } else {
        setUser(null);
        // If no valid auth data and we're on a protected route, redirect to login
        const currentPath = window.location.pathname;
        const isProtectedRoute = !["/login", "/register", "/"].includes(
          currentPath
        );

        if (isProtectedRoute) {
          // Clear any stale cookies
          document.cookie =
            "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie =
            "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie =
            "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          // Redirect to login with return path
          blokRouter.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Listen for auth state changes from API calls
    const handleAuthError = () => {
      // Clear user state
      setUser(null);

      // Clear all session cookies
      document.cookie =
        "blok_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "blok_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // The ErrorHandler will handle the redirect, so we don't need to do it here
    };

    // Custom event listener for auth errors
    window.addEventListener("auth-error", handleAuthError);

    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const result = await registerMutation.mutateAsync({
        email,
        password,
        name,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({});
    } catch (error) {
      // Already handled in onError
      throw error;
    }
  };

  // Method to update user data (for profile updates)
  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Main AuthProvider that wraps the internal component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderInternal>{children}</AuthProviderInternal>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
