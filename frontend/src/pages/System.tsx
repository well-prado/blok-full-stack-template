import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  Mail,
  MemoryStick,
  RefreshCw,
  Server,
  Settings,
  Wifi,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { blokRouter } from "../lib/blok-router";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  uptime: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: "connected" | "disconnected";
    connections: number;
    maxConnections: number;
  };
}

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "error";
  port?: number;
  uptime?: string;
  description: string;
}

export default function SystemPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: "healthy",
    uptime: "5 days, 12 hours",
    memory: { used: 2.4, total: 8, percentage: 30 },
    cpu: { usage: 25 },
    disk: { used: 45, total: 100, percentage: 45 },
    database: { status: "connected", connections: 12, maxConnections: 100 },
  });

  const [services] = useState<ServiceStatus[]>([
    {
      name: "API Server",
      status: "running",
      port: 3000,
      uptime: "5 days, 12 hours",
      description: "Main application server",
    },
    {
      name: "Database",
      status: "running",
      uptime: "5 days, 12 hours",
      description: "SQLite database service",
    },
    {
      name: "Email Service",
      status: "running",
      uptime: "5 days, 12 hours",
      description: "Email notification service",
    },
    {
      name: "File Storage",
      status: "running",
      uptime: "5 days, 12 hours",
      description: "File upload and storage service",
    },
  ]);

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    blokRouter.push("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access denied. This page is only available to administrators.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const refreshSystemHealth = async () => {
    setLoading(true);
    try {
      // In a real app, this would call your system health API
      // For now, we'll simulate some dynamic data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSystemHealth((prev) => ({
        ...prev,
        cpu: { usage: Math.floor(Math.random() * 50) + 10 },
        memory: {
          ...prev.memory,
          percentage: Math.floor(Math.random() * 40) + 20,
        },
      }));

      toast.success("System health refreshed");
    } catch (error) {
      toast.error("Failed to refresh system health");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
      case "connected":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
      case "error":
      case "stopped":
      case "disconnected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "critical":
      case "error":
      case "stopped":
      case "disconnected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Server className="h-6 w-6" />
                  System Health
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Monitor system performance, services, and resource usage
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth.status)}
                  <span
                    className={`font-medium ${getStatusColor(
                      systemHealth.status
                    )}`}
                  >
                    {systemHealth.status.charAt(0).toUpperCase() +
                      systemHealth.status.slice(1)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshSystemHealth}
                  disabled={loading}
                  className="glass-button glass-button-hover"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Uptime */}
          <Card className="glass-card glass-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    System Uptime
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {systemHealth.uptime}
                  </p>
                </div>
                <div className="glass-icon-container">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CPU Usage */}
          <Card className="glass-card glass-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    CPU Usage
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {systemHealth.cpu.usage}%
                  </p>
                </div>
                <div className="glass-icon-container">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <Progress value={systemHealth.cpu.usage} className="h-2" />
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="glass-card glass-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Memory Usage
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {systemHealth.memory.used}GB / {systemHealth.memory.total}GB
                  </p>
                </div>
                <div className="glass-icon-container">
                  <MemoryStick className="h-6 w-6" />
                </div>
              </div>
              <Progress
                value={systemHealth.memory.percentage}
                className="h-2"
              />
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card className="glass-card glass-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Disk Usage
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {systemHealth.disk.used}GB / {systemHealth.disk.total}GB
                  </p>
                </div>
                <div className="glass-icon-container">
                  <HardDrive className="h-6 w-6" />
                </div>
              </div>
              <Progress value={systemHealth.disk.percentage} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Services Status
              </CardTitle>
              <CardDescription>
                Current status of all system services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg glass-card glass-card-hover"
                  >
                    <div className="flex items-center gap-4">
                      <div className="glass-icon-container">
                        {service.name === "API Server" && (
                          <Server className="h-5 w-5" />
                        )}
                        {service.name === "Database" && (
                          <Database className="h-5 w-5" />
                        )}
                        {service.name === "Email Service" && (
                          <Mail className="h-5 w-5" />
                        )}
                        {service.name === "File Storage" && (
                          <HardDrive className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{service.name}</p>
                          {service.port && (
                            <Badge variant="outline" className="text-xs">
                              :{service.port}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        {service.uptime && (
                          <p className="text-xs text-muted-foreground">
                            Uptime: {service.uptime}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {service.status.charAt(0).toUpperCase() +
                          service.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Database connection and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth.database.status)}
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      systemHealth.database.status
                    )}`}
                  >
                    {systemHealth.database.status.charAt(0).toUpperCase() +
                      systemHealth.database.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Active Connections
                  </span>
                  <span className="text-sm">
                    {systemHealth.database.connections} /{" "}
                    {systemHealth.database.maxConnections}
                  </span>
                </div>
                <Progress
                  value={
                    (systemHealth.database.connections /
                      systemHealth.database.maxConnections) *
                    100
                  }
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-3 rounded-lg glass-card">
                  <p className="text-sm text-muted-foreground">Tables</p>
                  <p className="text-lg font-bold">12</p>
                </div>
                <div className="text-center p-3 rounded-lg glass-card">
                  <p className="text-sm text-muted-foreground">Records</p>
                  <p className="text-lg font-bold">2.4K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Recent system alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  System backup completed successfully at{" "}
                  {new Date().toLocaleString()}
                </AlertDescription>
              </Alert>

              <Alert>
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  All services are running normally. No issues detected.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
