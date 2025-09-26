/**
 * BlokApp - Inertia.js-style app component
 * Renders components based on server-provided pageData instead of URL-based routing
 */

import React, { Suspense } from "react";
import { useBlokRouter } from "../hooks/useBlokRouter";

// Lazy load all page components for code splitting
const AnalyticsPage = React.lazy(() => import("../pages/Analytics"));
const DashboardPage = React.lazy(() => import("../pages/Dashboard"));
const HelpPage = React.lazy(() => import("../pages/Help"));
const HomePage = React.lazy(() => import("../pages/Home"));
const LoginPage = React.lazy(() => import("../pages/Login"));
const NavigationTestPage = React.lazy(() => import("../pages/NavigationTest"));
const NotFoundPage = React.lazy(() => import("../pages/NotFound"));
const ProfilePage = React.lazy(() => import("../pages/Profile"));
const RegisterPage = React.lazy(() => import("../pages/Register"));
const SecurityPage = React.lazy(() => import("../pages/Security"));
const SettingsPage = React.lazy(() => import("../pages/Settings"));
const SystemPage = React.lazy(() => import("../pages/System"));
const ThemesPage = React.lazy(() => import("../pages/Themes"));
const UsersPage = React.lazy(() => import("../pages/Users"));

// Component mapping - maps server component names to React components
const componentMap: Record<string, React.ComponentType<any>> = {
  Home: HomePage,
  Login: LoginPage,
  Register: RegisterPage,
  Dashboard: DashboardPage,
  Profile: ProfilePage,
  Security: SecurityPage,
  Settings: SettingsPage,
  Users: UsersPage,
  Analytics: AnalyticsPage,
  System: SystemPage,
  Themes: ThemesPage,
  Help: HelpPage,
  NavigationTest: NavigationTestPage,
  NotFound: NotFoundPage,
};

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export default function BlokApp() {
  const router = useBlokRouter();

  // Get the current page data from the router
  const { pageData } = router;

  // If no page data, show loading or default component
  if (!pageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Get the component to render
  const Component = componentMap[pageData.component];

  // If component doesn't exist, render NotFound
  if (!Component) {
    console.warn(`Component "${pageData.component}" not found in componentMap`);
    const NotFound = componentMap["NotFound"];
    return (
      <Suspense fallback={<PageLoader />}>
        <NotFound {...pageData.props} />
      </Suspense>
    );
  }

  // Render the component with props from the server
  return (
    <Suspense fallback={<PageLoader />}>
      <Component {...pageData.props} />
    </Suspense>
  );
}
