import {
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { blokRouter } from "../lib/blok-router";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

// Mock data for charts
const userGrowthData = [
  { name: "Jan", users: 1200, active: 800 },
  { name: "Feb", users: 1900, active: 1200 },
  { name: "Mar", users: 1700, active: 1100 },
  { name: "Apr", users: 2800, active: 1800 },
  { name: "May", users: 2200, active: 1500 },
  { name: "Jun", users: 3200, active: 2100 },
  { name: "Jul", users: 2800, active: 1900 },
  { name: "Aug", users: 3800, active: 2500 },
  { name: "Sep", users: 3200, active: 2200 },
  { name: "Oct", users: 4200, active: 2800 },
  { name: "Nov", users: 3800, active: 2600 },
  { name: "Dec", users: 4800, active: 3200 },
];

const deviceData = [
  { name: "Desktop", value: 45, color: "#8884d8" },
  { name: "Mobile", value: 35, color: "#82ca9d" },
  { name: "Tablet", value: 20, color: "#ffc658" },
];

const activityData = [
  { name: "Mon", logins: 240, registrations: 45 },
  { name: "Tue", logins: 320, registrations: 52 },
  { name: "Wed", logins: 280, registrations: 38 },
  { name: "Thu", logins: 390, registrations: 67 },
  { name: "Fri", logins: 420, registrations: 73 },
  { name: "Sat", logins: 180, registrations: 28 },
  { name: "Sun", logins: 150, registrations: 22 },
];

const topPagesData = [
  { page: "/dashboard", views: 8420, bounce: 0.23 },
  { page: "/users", views: 3240, bounce: 0.31 },
  { page: "/settings", views: 2180, bounce: 0.45 },
  { page: "/profile", views: 1960, bounce: 0.28 },
  { page: "/analytics", views: 1240, bounce: 0.52 },
];

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("30d");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    blokRouter.push("/login");
    return null;
  }

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Simulate export functionality
    const data = {
      userGrowth: userGrowthData,
      devices: deviceData,
      activity: activityData,
      topPages: topPagesData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dateRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      title: "Total Users",
      value: "12,345",
      change: "+12.5%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Active Users",
      value: "8,234",
      change: "+8.2%",
      trend: "up",
      icon: Activity,
    },
    {
      title: "Page Views",
      value: "45,678",
      change: "+15.3%",
      trend: "up",
      icon: BarChart3,
    },
    {
      title: "Avg. Session",
      value: "4m 32s",
      change: "-2.1%",
      trend: "down",
      icon: TrendingUp,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Comprehensive insights into your application's performance and
                  user behavior
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32 glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="glass-button glass-button-hover"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="glass-button glass-button-hover"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card glass-card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className="glass-icon-container">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>User Growth Over Time</CardTitle>
              <CardDescription>
                Total users and active users for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient
                        id="colorUsers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="rgba(99, 102, 241, 0.8)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="rgba(99, 102, 241, 0.1)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorActive"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="rgba(34, 197, 94, 0.8)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="rgba(34, 197, 94, 0.1)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.2)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        color: "inherit",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="rgb(99, 102, 241)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActive)"
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>User sessions by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "12px",
                        color: "inherit",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {deviceData.map((device, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <span className="text-sm">{device.name}</span>
                    </div>
                    <span className="text-sm font-medium">{device.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Logins and registrations by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.2)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "12px",
                        color: "inherit",
                      }}
                    />
                    <Bar
                      dataKey="logins"
                      fill="rgba(99, 102, 241, 0.8)"
                      radius={[4, 4, 0, 0]}
                      name="Logins"
                    />
                    <Bar
                      dataKey="registrations"
                      fill="rgba(34, 197, 94, 0.8)"
                      radius={[4, 4, 0, 0]}
                      name="Registrations"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>
              Most visited pages and their bounce rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPagesData.map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg glass-card glass-card-hover"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{page.page}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {(page.bounce * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">bounce rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
