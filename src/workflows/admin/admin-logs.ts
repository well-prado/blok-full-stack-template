import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Admin Logs Input Type
 * 
 * Defines all possible input parameters for the admin logs workflow.
 * These types are automatically enforced in useWorkflowQuery/Mutation.
 */
export interface AdminLogsInput {
  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
  
  // Sorting
  sortBy?: 'createdAt' | 'actionType' | 'resourceType' | 'riskLevel' | 'userId';
  sortOrder?: 'asc' | 'desc';
  
  // Filters
  search?: string;
  searchQuery?: string;
  filterUserId?: string;
  filterActionType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE' | 'READ';
  filterResourceType?: 'user' | 'profile' | 'settings' | 'role' | 'auth' | 'security' | 'system';
  filterRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  filterSuccess?: string | boolean;
  
  // Date range
  dateRange?: {
    start?: string;
    end?: string;
    from?: string | null;
    to?: string | null;
  };
  
  // Actions
  action?: 'query' | 'getStats' | 'export' | 'cleanup';
  exportFormat?: 'json' | 'csv';
}

/**
 * Admin Logs Output Type
 * 
 * Defines the response structure for the admin logs workflow.
 * Includes system logs with comprehensive metadata for accountability.
 */
export interface AdminLogsOutput {
  success: boolean;
  data?: {
    logs: Array<{
      id: string;
      userId: string;
      userEmail: string;
      userName: string;
      userRole: string;
      actionType: string;
      resourceType: string;
      resourceId?: string | null;
      resourceName?: string | null;
      httpMethod: string;
      endpoint: string;
      workflowName?: string | null;
      nodeName?: string | null;
      createdAt: string;
      statusCode: number;
      success: boolean;
      errorMessage?: string | null;
      executionTimeMs?: number | null;
      requestSize?: number | null;
      changesSummary?: Record<string, any> | null;
      ipAddress: string;
      userAgent?: string | null;
      sessionId?: string | null;
      affectedUsersCount?: number | null;
      complianceFlags?: string[] | null;
      riskLevel: string;
    }>;
    total: number;
    page?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    // For stats action
    stats?: {
      totalLogs: number;
      todayLogs: number;
      failedActions: number;
      highRiskActions: number;
    };
    // For export action
    csvData?: string;
    totalRecords?: number;
  };
  error?: {
    message: string;
    code?: number;
  };
  message?: string;
}

/**
 * Admin Logs Workflow
 * 
 * Enterprise admin-only system logs management workflow.
 * Provides comprehensive blame tracking and audit trail capabilities.
 * 
 * Endpoint: GET/POST /api/admin-logs
 * Required: Admin authentication
 * 
 * Supported operations:
 * - Query system logs with advanced filtering
 * - Get system log statistics and analytics  
 * - Export logs for compliance reporting
 * - Perform retention cleanup
 * 
 * Query Parameters (GET):
 * - limit: Number of logs to return (default: 50, max: 1000)
 * - offset: Pagination offset (default: 0)
 * - dateRange: JSON object with start/end dates
 * - filterUserId: Filter by specific user ID
 * - filterActionType: Filter by action type (CREATE, UPDATE, DELETE, etc.)
 * - filterResourceType: Filter by resource type (user, profile, settings, etc.)
 * - filterRiskLevel: Filter by risk level (low, medium, high, critical)
 * - filterSuccess: Filter by success status (true/false)
 * - searchQuery: Full-text search across logs
 * 
 * Body Parameters (POST):
 * - action: 'query' | 'getStats' | 'export' | 'cleanup'
 * - Same query parameters as GET for filtering
 * - exportFormat: 'json' | 'csv' (for export action)
 */
const step: Step = Workflow({
  name: "Admin Logs Management API",
  version: "1.0.0",
  description: "Comprehensive system logs management for admin accountability and blame tracking",
})
.addTrigger("http", {
  method: "ANY",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "check-auth",
  node: "authentication-checker",
  type: "module",
  inputs: {
    requireAuth: true,
    requestMethod: "js/ctx.request.method",
    requestPath: "js/ctx.request.path", 
    headers: "js/ctx.request.headers || {}",
    cookies: "js/ctx.request.cookies || {}",
    sessionDurationHours: 1,
  },
})
.addCondition({
  node: {
    name: "auth-result-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // Admin GET request - Query logs with URL parameters
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "get"')
        .addStep({
          name: "query-system-logs-get",
          node: "system-action-logger",
          type: "module",
          inputs: {
            action: "query",
            limit: "js/parseInt(ctx.request.query.limit) || 50",
            offset: "js/parseInt(ctx.request.query.offset) || 0",
            dateRange: "js/ctx.request.query.dateRange ? JSON.parse(ctx.request.query.dateRange) : undefined",
            filterUserId: "js/ctx.request.query.filterUserId",
            filterActionType: "js/ctx.request.query.filterActionType", 
            filterResourceType: "js/ctx.request.query.filterResourceType",
            filterRiskLevel: "js/ctx.request.query.filterRiskLevel",
            filterSuccess: "js/ctx.request.query.filterSuccess === 'true' ? true : ctx.request.query.filterSuccess === 'false' ? false : undefined",
            searchQuery: "js/ctx.request.query.searchQuery",
          },
        })
        .build(),

      // Admin POST request with query action
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "post" && (ctx.request.body.action === "query" || !ctx.request.body.action)')
        .addStep({
          name: "query-system-logs-post",
          node: "system-action-logger",
          type: "module",
          inputs: {
            action: "query",
            limit: "js/ctx.request.body.limit || 50",
            offset: "js/ctx.request.body.offset || 0",
            dateRange: "js/ctx.request.body.dateRange",
            filterActionType: "js/ctx.request.body.filterActionType",
            filterResourceType: "js/ctx.request.body.filterResourceType",
            filterRiskLevel: "js/ctx.request.body.filterRiskLevel",
            filterSuccess: "js/ctx.request.body.filterSuccess ? (ctx.request.body.filterSuccess === 'true' ? true : ctx.request.body.filterSuccess === 'false' ? false : null) : null",
            searchQuery: "js/ctx.request.body.searchQuery",
          },
        })
        .build(),

      // Admin POST request with getStats action
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "post" && ctx.request.body.action === "getStats"')
        .addStep({
          name: "get-system-log-stats",
          node: "system-action-logger",
          type: "module",
          inputs: {
            action: "getStats",
            dateRange: "js/ctx.request.body.dateRange || null",
          },
        })
        .build(),

      // Admin POST request with export action
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "post" && ctx.request.body.action === "export"')
        .addStep({
          name: "export-system-logs",
          node: "system-action-logger",
          type: "module",
          inputs: {
            action: "export",
            exportFormat: "js/ctx.request.body.exportFormat || 'json'",
            limit: "js/ctx.request.body.limit || 1000",
            offset: "js/ctx.request.body.offset || 0",
            dateRange: "js/ctx.request.body.dateRange",
            filterActionType: "js/ctx.request.body.filterActionType",
            filterResourceType: "js/ctx.request.body.filterResourceType",
            filterRiskLevel: "js/ctx.request.body.filterRiskLevel",
            filterSuccess: "js/ctx.request.body.filterSuccess ? (ctx.request.body.filterSuccess === 'true' ? true : ctx.request.body.filterSuccess === 'false' ? false : null) : null",
            searchQuery: "js/ctx.request.body.searchQuery",
          },
        })
        .build(),

      // Admin POST request with cleanup action
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "post" && ctx.request.body.action === "cleanup"')
        .addStep({
          name: "cleanup-system-logs",
          node: "system-action-logger",
          type: "module",
          inputs: {
            action: "cleanup",
          },
        })
        .build(),

      // Invalid action for admin POST request
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && ctx.request.method.toLowerCase() === "post" && ctx.request.body.action && !["query", "getStats", "export", "cleanup"].includes(ctx.request.body.action)')
        .addStep({
          name: "invalid-action-error",
          node: "error",
          type: "module",
          inputs: {
            message: "js/'Invalid action. Supported actions: query, getStats, export, cleanup'",
            statusCode: "js/400",
          },
        })
        .build(),

      // Unsupported HTTP method for admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN" && !["get", "post"].includes(ctx.request.method.toLowerCase())')
        .addStep({
          name: "method-not-allowed",
          node: "error",
          type: "module",
          inputs: {
            message: "js/'Method not allowed. Supported methods: GET, POST'",
            statusCode: "js/405",
          },
        })
        .build(),
      
      // Unauthorized response for non-admin or unauthenticated users
      new AddElse()
        .addStep({
          name: "unauthorized-response",
          node: "error",
          type: "module",
          inputs: {
            message: "js/'Unauthorized. Admin access required for system logs.'",
            statusCode: "js/403",
          },
        })
        .build(),
    ];
  },
});

export default step;
