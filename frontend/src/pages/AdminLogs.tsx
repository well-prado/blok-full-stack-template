import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useBlokRouter } from "../hooks/useBlokRouter";
import { useWorkflowQuery } from "../blok-types";

// TypeScript interfaces based on our backend schema
interface SystemLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  httpMethod: string;
  endpoint: string;
  workflowName?: string;
  nodeName?: string;
  createdAt: string;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  executionTimeMs?: number;
  requestSize?: number;
  changesSummary?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  affectedUsersCount?: number;
  complianceFlags?: string[];
  riskLevel: string;
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  highRiskActions: number;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topActions: Array<{ actionType: string; count: number }>;
  topResources: Array<{ resourceType: string; count: number }>;
  riskDistribution: Record<string, number>;
}

interface LogFilters {
  searchQuery: string;
  filterActionType: string;
  filterResourceType: string;
  filterRiskLevel: string;
  filterSuccess: string;
  dateRange?: { start: string; end: string };
}

export default function AdminLogsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useBlokRouter();

  // State management
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  // Removed loading state - now using logsQuery.isLoading
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    searchQuery: "",
    filterActionType: "",
    filterResourceType: "",
    filterRiskLevel: "",
    filterSuccess: "",
  });
  const [pagination, setPagination] = useState({
    limit: 3, // Start with only 3 logs
    offset: 0,
    total: 0,
    hasMore: false,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "csv" as "csv" | "json",
    limit: 1000,
    dateFrom: "",
    dateTo: "",
    exportAll: false,
  });

  // SDK Hooks - with pagination support
  const logsQuery = useWorkflowQuery({
    workflowName: "admin-logs",
    input: {
      page: Math.floor(pagination.offset / pagination.limit) + 1,
      limit: pagination.limit,
      search: filters.searchQuery,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(filters.filterActionType && {
        filterActionType: filters.filterActionType,
      }),
      ...(filters.filterResourceType && {
        filterResourceType: filters.filterResourceType,
      }),
      ...(filters.filterRiskLevel && {
        filterRiskLevel: filters.filterRiskLevel,
      }),
      ...(filters.filterSuccess && { filterSuccess: filters.filterSuccess }),
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  // Handle SDK data changes - replace fetch logic with Load More support
  useEffect(() => {
    if (logsQuery.data && logsQuery.data.success) {
      const newLogs = Array.isArray(logsQuery.data.data?.logs)
        ? logsQuery.data.data.logs
        : [];
      const total = logsQuery.data.data?.total || 0;

      // Replace logs with new data (since we're increasing limit, not offset)
      setLogs(newLogs);

      const totalCount = typeof total === "number" ? total : 0;
      setPagination((prev) => ({
        ...prev,
        total: totalCount,
        hasMore: newLogs.length < totalCount, // More logs available if we haven't loaded all
      }));
    } else if (logsQuery.error) {
      // Fallback to mock data on error
      setLogs(getMockLogs());
      setPagination((prev) => ({ ...prev, total: 100, hasMore: true }));
    }
  }, [logsQuery.data, logsQuery.error, pagination.offset]);

  // Load stats on initial component mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  // Auto-refresh logs and stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLogs();
      loadSystemStats(); // Refresh stats too, but less frequently
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Removed loadSystemLogs - now handled by SDK useWorkflowQuery

  const loadSystemStats = async () => {
    // For now, use mock stats - will be implemented with SDK later
    setStats(getMockStats());
  };

  const refreshLogs = async () => {
    setRefreshing(true);
    logsQuery.refetch();
    setRefreshing(false);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    // Convert "all" to empty string for API calls
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
    setPagination((prev) => ({ ...prev, limit: 3, offset: 0 })); // Reset to initial state
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      filterActionType: "",
      filterResourceType: "",
      filterRiskLevel: "",
      filterSuccess: "",
    });
    setPagination((prev) => ({ ...prev, limit: 3, offset: 0 })); // Reset to initial state
  };

  const handleExportLogs = async () => {
    try {
      // Prepare export parameters
      const exportParams: any = {
        action: "export",
        exportFormat: exportOptions.format,
        limit: exportOptions.exportAll ? 999999 : exportOptions.limit, // Large number for "all"
        offset: 0,
      };

      // Add current filters
      if (filters.searchQuery) exportParams.searchQuery = filters.searchQuery;
      if (filters.filterActionType)
        exportParams.filterActionType = filters.filterActionType;
      if (filters.filterResourceType)
        exportParams.filterResourceType = filters.filterResourceType;
      if (filters.filterRiskLevel)
        exportParams.filterRiskLevel = filters.filterRiskLevel;
      if (filters.filterSuccess)
        exportParams.filterSuccess = filters.filterSuccess;

      // Add date range if specified
      if (exportOptions.dateFrom || exportOptions.dateTo) {
        exportParams.dateRange = {
          from: exportOptions.dateFrom || null,
          to: exportOptions.dateTo || null,
        };
      }

      const response = await fetch("/api/admin-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(exportParams),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Create download link
          const blob = new Blob(
            [
              exportOptions.format === "csv"
                ? result.data.csvData
                : JSON.stringify(result.data.data, null, 2),
            ],
            {
              type:
                exportOptions.format === "csv"
                  ? "text/csv"
                  : "application/json",
            }
          );
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Create descriptive filename
          const dateStr = new Date().toISOString().split("T")[0];
          const recordCount = exportOptions.exportAll
            ? "all"
            : exportOptions.limit.toString();
          const dateRange =
            exportOptions.dateFrom || exportOptions.dateTo
              ? `_${exportOptions.dateFrom || "start"}-to-${
                  exportOptions.dateTo || "end"
                }`
              : "";

          link.download = `system-logs-${recordCount}${dateRange}_${dateStr}.${exportOptions.format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Close dialog and show success
          setShowExportDialog(false);
          toast.success(
            `Logs exported successfully! ${
              result.data.totalRecords || 0
            } records exported as ${exportOptions.format.toUpperCase()}.`
          );
        }
      } else {
        throw new Error(`Export failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
      toast.error("Failed to export logs");
    }
  };

  const handleLoadMore = () => {
    // Increase the limit instead of offset to show more logs
    // This way we load more logs incrementally (3, then 6, then 9, etc.)
    setPagination((prev) => ({
      ...prev,
      limit: prev.limit + 10, // Load 10 more logs each time
    }));
  };

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case "CREATE":
        return <Database className="h-4 w-4 text-green-500" />;
      case "UPDATE":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "BULK_UPDATE":
        return <Activity className="h-4 w-4 text-orange-500" />;
      case "BULK_DELETE":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Mock data for development
  const getMockLogs = (): SystemLog[] => [
    {
      id: "1",
      userId: "admin-123",
      userEmail: "admin@example.com",
      userName: "Admin User",
      userRole: "admin",
      actionType: "UPDATE",
      resourceType: "user",
      resourceId: "user-456",
      resourceName: "John Doe",
      httpMethod: "PUT",
      endpoint: "/api/user-update",
      workflowName: "user-update",
      nodeName: "user-update",
      createdAt: new Date().toISOString(),
      statusCode: 200,
      success: true,
      executionTimeMs: 145,
      requestSize: 256,
      changesSummary: { role: { from: "user", to: "admin" } },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      sessionId: "session-123",
      affectedUsersCount: 1,
      complianceFlags: ["audit_trail", "blame_tracking"],
      riskLevel: "high",
    },
    {
      id: "2",
      userId: "admin-123",
      userEmail: "admin@example.com",
      userName: "Admin User",
      userRole: "admin",
      actionType: "DELETE",
      resourceType: "user",
      resourceId: "user-789",
      resourceName: "Jane Smith",
      httpMethod: "DELETE",
      endpoint: "/api/user-delete",
      workflowName: "user-delete",
      nodeName: "user-delete",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      statusCode: 200,
      success: true,
      executionTimeMs: 89,
      requestSize: 128,
      changesSummary: { deleted: true },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      sessionId: "session-123",
      affectedUsersCount: 1,
      complianceFlags: ["audit_trail", "blame_tracking"],
      riskLevel: "critical",
    },
    {
      id: "3",
      userId: "user-456",
      userEmail: "user@example.com",
      userName: "Regular User",
      userRole: "user",
      actionType: "UPDATE",
      resourceType: "profile",
      resourceId: "profile-456",
      resourceName: "Profile Settings",
      httpMethod: "PATCH",
      endpoint: "/api/profile-update",
      workflowName: "profile-update",
      nodeName: "user-profile-update",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      statusCode: 200,
      success: true,
      executionTimeMs: 67,
      requestSize: 192,
      changesSummary: { name: { from: "Old Name", to: "New Name" } },
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0...",
      sessionId: "session-456",
      affectedUsersCount: 1,
      complianceFlags: ["audit_trail"],
      riskLevel: "low",
    },
  ];

  const getMockStats = (): LogStats => ({
    totalLogs: 1547,
    todayLogs: 89,
    failedActions: 12,
    highRiskActions: 23,
    topUsers: [
      { userId: "admin-123", userName: "Admin User", count: 45 },
      { userId: "user-456", userName: "Regular User", count: 23 },
      { userId: "user-789", userName: "Another User", count: 12 },
    ],
    topActions: [
      { actionType: "UPDATE", count: 234 },
      { actionType: "CREATE", count: 156 },
      { actionType: "DELETE", count: 67 },
    ],
    topResources: [
      { resourceType: "user", count: 345 },
      { resourceType: "profile", count: 234 },
      { resourceType: "settings", count: 123 },
    ],
    riskDistribution: {
      low: 456,
      medium: 234,
      high: 67,
      critical: 23,
    },
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              System Logs
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Comprehensive admin-only system logs for accountability and blame
              tracking. Monitor all POST/PUT/PATCH/DELETE operations across the
              application.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Logs
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.totalLogs.toLocaleString()}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Today's Actions
                    </p>
                    <p className="text-2xl font-bold">{stats.todayLogs}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Failed Actions
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {stats.failedActions}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      High Risk Actions
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      {stats.highRiskActions}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Controls */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name, email, endpoint, resource, or changes..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    handleFilterChange("searchQuery", e.target.value)
                  }
                  className="glass-input pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={refreshLogs}
                  disabled={logsQuery.isLoading || refreshing}
                  variant="outline"
                  size="sm"
                  className="glass-button glass-button-hover"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>

                <Dialog
                  open={showExportDialog}
                  onOpenChange={setShowExportDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-button glass-button-hover"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export System Logs
                      </DialogTitle>
                      <DialogDescription>
                        Configure your export settings. Current filters will be
                        applied to the export.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                      {/* Export Format */}
                      <div className="grid gap-2">
                        <Label htmlFor="format">Export Format</Label>
                        <Select
                          value={exportOptions.format}
                          onValueChange={(value: "csv" | "json") =>
                            setExportOptions({
                              ...exportOptions,
                              format: value,
                            })
                          }
                        >
                          <SelectTrigger id="format" className="glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">
                              CSV (Comma Separated Values)
                            </SelectItem>
                            <SelectItem value="json">
                              JSON (JavaScript Object Notation)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Record Limit */}
                      <div className="grid gap-2">
                        <Label htmlFor="limit">Record Limit</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="limit"
                            type="number"
                            min="1"
                            max="100000"
                            value={exportOptions.limit}
                            onChange={(e) =>
                              setExportOptions({
                                ...exportOptions,
                                limit: parseInt(e.target.value) || 1000,
                                exportAll: false,
                              })
                            }
                            disabled={exportOptions.exportAll}
                            className="glass-input"
                            placeholder="1000"
                          />
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="exportAll"
                              checked={exportOptions.exportAll}
                              onChange={(e) =>
                                setExportOptions({
                                  ...exportOptions,
                                  exportAll: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="exportAll" className="text-sm">
                              Export All Records
                            </Label>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {exportOptions.exportAll
                            ? "All matching records will be exported (may take longer for large datasets)"
                            : `Export up to ${exportOptions.limit.toLocaleString()} records`}
                        </p>
                      </div>

                      {/* Date Range */}
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date Range (Optional)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label
                              htmlFor="dateFrom"
                              className="text-xs text-muted-foreground"
                            >
                              From Date
                            </Label>
                            <Input
                              id="dateFrom"
                              type="date"
                              value={exportOptions.dateFrom}
                              onChange={(e) =>
                                setExportOptions({
                                  ...exportOptions,
                                  dateFrom: e.target.value,
                                })
                              }
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="dateTo"
                              className="text-xs text-muted-foreground"
                            >
                              To Date
                            </Label>
                            <Input
                              id="dateTo"
                              type="date"
                              value={exportOptions.dateTo}
                              onChange={(e) =>
                                setExportOptions({
                                  ...exportOptions,
                                  dateTo: e.target.value,
                                })
                              }
                              className="glass-input"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave blank to export all dates. Current search and
                          filter criteria will also be applied.
                        </p>
                      </div>

                      {/* Current Filters Summary */}
                      {(filters.searchQuery ||
                        filters.filterActionType ||
                        filters.filterResourceType ||
                        filters.filterRiskLevel ||
                        filters.filterSuccess) && (
                        <div className="grid gap-2">
                          <Label className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Active Filters (will be applied to export)
                          </Label>
                          <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
                            {filters.searchQuery && (
                              <div>
                                Search:{" "}
                                <span className="font-medium">
                                  {filters.searchQuery}
                                </span>
                              </div>
                            )}
                            {filters.filterActionType && (
                              <div>
                                Action:{" "}
                                <span className="font-medium">
                                  {filters.filterActionType}
                                </span>
                              </div>
                            )}
                            {filters.filterResourceType && (
                              <div>
                                Resource:{" "}
                                <span className="font-medium">
                                  {filters.filterResourceType}
                                </span>
                              </div>
                            )}
                            {filters.filterRiskLevel && (
                              <div>
                                Risk:{" "}
                                <span className="font-medium">
                                  {filters.filterRiskLevel}
                                </span>
                              </div>
                            )}
                            {filters.filterSuccess && (
                              <div>
                                Status:{" "}
                                <span className="font-medium">
                                  {filters.filterSuccess === "true"
                                    ? "Success"
                                    : "Failed"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowExportDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleExportLogs}
                        className="glass-button glass-button-hover"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export {exportOptions.format.toUpperCase()}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="glass-button glass-button-hover"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Select
                value={filters.filterActionType || "all"}
                onValueChange={(value) =>
                  handleFilterChange("filterActionType", value)
                }
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="BULK_UPDATE">Bulk Update</SelectItem>
                  <SelectItem value="BULK_DELETE">Bulk Delete</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.filterResourceType || "all"}
                onValueChange={(value) =>
                  handleFilterChange("filterResourceType", value)
                }
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.filterRiskLevel || "all"}
                onValueChange={(value) =>
                  handleFilterChange("filterRiskLevel", value)
                }
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.filterSuccess || "all"}
                onValueChange={(value) =>
                  handleFilterChange("filterSuccess", value)
                }
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              System Activity Logs
              {logsQuery.isLoading && (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              )}
            </CardTitle>
            <CardDescription>
              Showing {logs.length} of {pagination.total.toLocaleString()} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(log.id)}
                            >
                              {expandedRows.has(log.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.userEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.actionType)}
                              <span>{log.actionType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.resourceType}</p>
                              {log.resourceName && (
                                <p className="text-xs text-muted-foreground">
                                  {log.resourceName}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {log.httpMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.success ? "secondary" : "destructive"
                              }
                            >
                              {log.success ? "Success" : "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRiskLevelColor(log.riskLevel)}>
                              {log.riskLevel.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatExecutionTime(log.executionTimeMs)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ipAddress}
                          </TableCell>
                        </TableRow>

                        {/* Expanded row details */}
                        {expandedRows.has(log.id) && (
                          <TableRow>
                            <TableCell colSpan={10} className="bg-muted/20">
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium">Endpoint:</p>
                                    <p className="font-mono text-muted-foreground">
                                      {log.endpoint}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Workflow:</p>
                                    <p className="text-muted-foreground">
                                      {log.workflowName || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Node:</p>
                                    <p className="text-muted-foreground">
                                      {log.nodeName || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Session ID:</p>
                                    <p className="font-mono text-muted-foreground">
                                      {log.sessionId || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Request Size:</p>
                                    <p className="text-muted-foreground">
                                      {log.requestSize
                                        ? `${log.requestSize} bytes`
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      Affected Users:
                                    </p>
                                    <p className="text-muted-foreground">
                                      {log.affectedUsersCount || 0}
                                    </p>
                                  </div>
                                </div>

                                {log.changesSummary && (
                                  <div>
                                    <p className="font-medium mb-2">
                                      Changes Summary:
                                    </p>
                                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(
                                        log.changesSummary,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                )}

                                {log.errorMessage && (
                                  <div>
                                    <p className="font-medium mb-2">
                                      Error Message:
                                    </p>
                                    <p className="text-red-500 text-sm bg-red-50 p-2 rounded">
                                      {log.errorMessage}
                                    </p>
                                  </div>
                                )}

                                {log.userAgent && (
                                  <div>
                                    <p className="font-medium mb-1">
                                      User Agent:
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono break-all">
                                      {log.userAgent}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={logsQuery.isLoading}
                      variant="outline"
                      className="glass-button glass-button-hover"
                    >
                      {logsQuery.isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      )}
                      Load More Logs
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {logsQuery.isLoading
                    ? "Loading system logs..."
                    : "No system logs found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
