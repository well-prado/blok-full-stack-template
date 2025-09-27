import "./globals.css";

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";

// Core providers and components (keep these as static imports)
import { AnimationProvider } from "./contexts/AnimationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { BlokNavigationProvider } from "./contexts/BlokNavigationContext";
import BlokPageRenderer from "./components/BlokPageRenderer";
import { BlokProvider } from "@well-prado/blok-react-sdk";
import { ErrorHandler } from "./lib/error-handler";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/sonner";

// Lazy load all pages for code splitting
const HomePage = React.lazy(() => import("./pages/Home"));
const LoginPage = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
const ProfilePage = React.lazy(() => import("./pages/Profile"));
const SecurityPage = React.lazy(() => import("./pages/Security"));
const ThemesPage = React.lazy(() => import("./pages/Themes"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const HelpPage = React.lazy(() => import("./pages/Help"));
const AnalyticsPage = React.lazy(() => import("./pages/Analytics"));
const UsersPage = React.lazy(() => import("./pages/Users"));
const SystemPage = React.lazy(() => import("./pages/System"));
const NavigationTestPage = React.lazy(() => import("./pages/NavigationTest"));
const NotFoundPage = React.lazy(() => import("./pages/NotFound"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Global fetch interceptor for 401 handling
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);

    // Only handle 401s for API calls (not static assets)
    if (response.status === 401 && args[0].toString().includes("/api/")) {
      // Dispatch auth error event
      window.dispatchEvent(new CustomEvent("auth-error"));

      // Let ErrorHandler handle the redirect
      ErrorHandler.redirectToLogin();
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Blok SDK Configuration
const blokConfig = {
  baseUrl: "http://localhost:4000",
  credentials: "include" as const,
  timeout: 30000,
};

// Prevent multiple root creation during hot reloads
const rootElement = document.getElementById("root")!;
let root = (window as any).__reactRoot;

if (!root) {
  root = ReactDOM.createRoot(rootElement);
  (window as any).__reactRoot = root;
}

root.render(
  <React.StrictMode>
    <BlokProvider config={blokConfig}>
      <AuthProvider>
        <ThemeProvider>
          <AnimationProvider>
            <NotificationProvider>
              <BlokNavigationProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <BlokPageRenderer>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected routes - require authentication */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <DashboardPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/security"
                          element={
                            <ProtectedRoute>
                              <SecurityPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/themes"
                          element={
                            <ProtectedRoute>
                              <ThemesPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <SettingsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/help"
                          element={
                            <ProtectedRoute>
                              <HelpPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin-only routes */}
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute requireAdmin>
                              <AnalyticsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute requireAdmin>
                              <UsersPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/system"
                          element={
                            <ProtectedRoute requireAdmin>
                              <SystemPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/logs"
                          element={
                            <ProtectedRoute requireAdmin>
                              <div>Admin Logs temporarily unavailable</div>
                            </ProtectedRoute>
                          }
                        />

                        {/* Development/Testing routes - Public access */}
                        <Route
                          path="/navigation-test"
                          element={<NavigationTestPage />}
                        />

                        {/* Catch-all route for 404 pages */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </BlokPageRenderer>
                </Router>
                <Toaster />
              </BlokNavigationProvider>
            </NotificationProvider>
          </AnimationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BlokProvider>
  </React.StrictMode>
);
