import { Activity, Shield, TrendingUp, Users } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";

import type { AdminDashboard } from "../lib/api";
import { AppLayout } from "../layouts/AppLayout";
import { DashboardHeader } from "../components/DashboardHeader";
import { QuickActions } from "../components/QuickActions";
import { RecentActivity } from "../components/RecentActivity";
import { StatsCards } from "../components/StatsCards";
import { useAuth } from "../contexts/AuthContext";
import { useWorkflowQuery } from "../blok-types";

// Lazy load the ChartSection to avoid loading recharts in the main bundle
const ChartSection = React.lazy(() =>
  import("../components/ChartSection").then((module) => ({
    default: module.ChartSection,
  }))
);

// Loading component for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading charts...</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(
    null
  );

  // SDK hook for dashboard data
  const dashboardQuery = useWorkflowQuery({
    workflowKey: "admin-dashboard",
    input: {},
    enabled: isAdmin, // Only fetch when user is admin
  });

  const loading = dashboardQuery.isLoading;
  const error = dashboardQuery.error?.message || null;

  // Update dashboard data when query data changes
  useEffect(() => {
    if (dashboardQuery.data?.success) {
      setDashboardData(dashboardQuery.data as any);
    }
  }, [dashboardQuery.data]);

  // Old loadDashboardData function removed - now using SDK hooks

  // Prepare stats data from backend
  const getStatsData = () => {
    if (!dashboardData?.dashboard) {
      return [
        {
          title: "Total Users",
          value: "Loading...",
          change: "+0%",
          trend: "up" as const,
          icon: Users,
        },
        {
          title: "Admin Users",
          value: "Loading...",
          change: "+0%",
          trend: "up" as const,
          icon: Shield,
        },
        {
          title: "Regular Users",
          value: "Loading...",
          change: "+0%",
          trend: "up" as const,
          icon: Users,
        },
        {
          title: "Verified Users",
          value: "Loading...",
          change: "+0%",
          trend: "up" as const,
          icon: Activity,
        },
      ];
    }

    const { stats } = dashboardData.dashboard;
    return [
      {
        title: "Total Users",
        value: stats.totalUsers.toString(),
        change: "+12.5%",
        trend: "up" as const,
        icon: Users,
      },
      {
        title: "Admin Users",
        value: stats.adminUsers.toString(),
        change: "+2.1%",
        trend: "up" as const,
        icon: Shield,
      },
      {
        title: "Regular Users",
        value: stats.regularUsers.toString(),
        change: "+15.3%",
        trend: "up" as const,
        icon: Users,
      },
      {
        title: "Verified Users",
        value: stats.verifiedUsers.toString(),
        change: "+8.7%",
        trend: "up" as const,
        icon: Activity,
      },
    ];
  };

  // Prepare activity data from backend
  const getActivityData = () => {
    if (!dashboardData?.dashboard) {
      return [
        {
          user: user?.name || "User",
          action: "logged in",
          time: "Just now",
          initials: user?.name?.charAt(0).toUpperCase() || "U",
        },
        {
          user: "System",
          action: "loading...",
          time: "Loading...",
          initials: "SYS",
        },
      ];
    }

    return [
      {
        user: user?.name || "Admin",
        action: "logged in",
        time: "Just now",
        initials: user?.name?.charAt(0).toUpperCase() || "A",
      },
      {
        user: "System",
        action: dashboardData.dashboard.recentActivity.systemStatus,
        time: dashboardData.dashboard.recentActivity.lastLogin,
        initials: "SYS",
      },
      {
        user: "Database",
        action: "backup completed",
        time: "1 hour ago",
        initials: "DB",
      },
      {
        user: "Security",
        action: "scan completed",
        time: "2 hours ago",
        initials: "SEC",
      },
    ];
  };

  // Chart data generation
  const getChartData = () => {
    // Generate mock data based on user stats
    const baseValue = dashboardData?.dashboard?.stats?.totalUsers || 1000;
    return Array.from({ length: 12 }, (_, i) => ({
      name: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i],
      total: Math.floor(
        baseValue * (0.8 + Math.random() * 0.4) * (1 + i * 0.1)
      ),
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="glass-card p-8 text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <span className="text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="glass-card p-8 text-center max-w-md">
            <TrendingUp className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => dashboardQuery.refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors glass-button glass-button-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <DashboardHeader />
        <StatsCards stats={getStatsData()} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartLoader />}>
              <ChartSection
                data={getChartData()}
                title="User Growth Overview"
                subtitle="Monthly user registrations for the past year"
              />
            </Suspense>
          </div>
          <div className="space-y-6">
            <RecentActivity activities={getActivityData()} />
            <QuickActions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
