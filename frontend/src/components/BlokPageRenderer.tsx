/**
 * BlokPageRenderer - Renders components based on server pageData during SPA navigation
 * This component listens to BlokRouter state and renders the component specified by the server
 */

import React, { useEffect, useState, Suspense } from "react";
import { useBlokRouter } from "../hooks/useBlokRouter";

// Lazy load all page components for code splitting
const AdminLogsPage = React.lazy(() => import("../pages/AdminLogs"));
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

// Component mapping with lazy components
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
  AdminLogs: AdminLogsPage,
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

interface BlokPageRendererProps {
  children: React.ReactNode; // Fallback content (React Router routes)
}

export default function BlokPageRenderer({ children }: BlokPageRendererProps) {
  const router = useBlokRouter();
  const [shouldRenderBlokPage, setShouldRenderBlokPage] = useState(false);

  useEffect(() => {
    // If we have pageData from a Blok navigation, render the Blok component
    // Otherwise, let React Router handle it
    const hasBlokPageData = !!(router.pageData && router.pageData.component);
    const isBlokNavigation = window.history.state?.blokNavigation === true;

    setShouldRenderBlokPage(hasBlokPageData && isBlokNavigation);
  }, [router.pageData]);

  // If we should render a Blok page, render it
  if (shouldRenderBlokPage && router.pageData) {
    const Component = componentMap[router.pageData.component];

    if (Component) {
      return (
        <Suspense fallback={<PageLoader />}>
          <Component {...router.pageData.props} />
        </Suspense>
      );
    } else {
      console.warn(`Component "${router.pageData.component}" not found`);
      const NotFound = componentMap["NotFound"];
      return (
        <Suspense fallback={<PageLoader />}>
          <NotFound {...router.pageData.props} />
        </Suspense>
      );
    }
  }

  // Otherwise, render the React Router content
  return <>{children}</>;
}
