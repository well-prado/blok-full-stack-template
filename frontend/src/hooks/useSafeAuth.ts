import { useAuth } from "../contexts/AuthContext";

/**
 * Safe wrapper for useAuth that handles cases where AuthProvider isn't ready yet
 * This prevents crashes during app initialization and hot reloads
 */
export function useSafeAuth() {
  try {
    return useAuth();
  } catch (error) {
    // AuthProvider not ready yet, return safe defaults
    console.log("AuthProvider not ready yet, returning safe defaults");
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,
      login: async () => ({ success: false, error: "Auth not ready" }),
      register: async () => ({ success: false, error: "Auth not ready" }),
      logout: async () => {},
      checkAuth: async () => {},
      updateUser: () => {},
    };
  }
}
