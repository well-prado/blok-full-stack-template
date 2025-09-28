import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
  ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from "../../../../database/config";

// Enums that were previously imported from Drizzle schemas
enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ', 
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  BULK_DELETE = 'BULK_DELETE',
  BULK_UPDATE = 'BULK_UPDATE'
}

enum ResourceType {
  USER = 'USER',
  SESSION = 'SESSION',
  NOTIFICATION = 'NOTIFICATION',
  AUDIT_LOG = 'AUDIT_LOG',
  SYSTEM_LOG = 'SYSTEM_LOG',
  API_ENDPOINT = 'API_ENDPOINT',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  ROLE = 'ROLE',
  AUTH = 'AUTH',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM'
}

enum LogRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Types that were previously imported
interface NewSystemLog {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  httpMethod: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  details?: string;
  changesSummary?: string;
  workflowName?: string;
  nodeName?: string;
  executionTimeMs?: number;
  statusCode: number;
  success?: boolean;
  riskLevel: LogRiskLevel;
  complianceFlags?: string;
  createdAt?: Date;
}

interface SystemLogEntry extends NewSystemLog {
  id: string;
  createdAt: Date;
  changesSummary?: any;
}

interface InputType {
  // Action type
  action: 'log' | 'query' | 'getStats' | 'cleanup' | 'export';
  
  // For logging actions
  phase?: 'start' | 'complete'; // Track request lifecycle
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  actionType?: ActionType;
  resourceType?: ResourceType | string;
  resourceId?: string;
  resourceName?: string;
  httpMethod?: string;
  endpoint?: string;
  workflowName?: string;
  nodeName?: string;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  executionTimeMs?: number;
  requestSize?: number;
  changesSummary?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  affectedUsersCount?: number;
  startTime?: number; // For calculating execution time
  
  // For querying logs
  limit?: number;
  offset?: number;
  dateRange?: { start: string; end: string };
  filterUserId?: string;
  filterActionType?: ActionType;
  filterResourceType?: string;
  filterRiskLevel?: LogRiskLevel;
  filterSuccess?: boolean;
  searchQuery?: string;
  
  // For export
  exportFormat?: 'json' | 'csv';
}

interface SystemLogQueryResult {
  logs: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface SystemLogStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  highRiskActions: number;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topActions: Array<{ actionType: string; count: number }>;
  topResources: Array<{ resourceType: string; count: number }>;
  riskDistribution: Record<LogRiskLevel, number>;
}

/**
 * System Action Logger Node
 * 
 * Enterprise-grade logging system for admin accountability and blame tracking.
 * Automatically logs all POST/PUT/PATCH/DELETE operations with comprehensive context.
 * 
 * Features:
 * - Asynchronous logging for zero performance impact
 * - Risk-based action categorization
 * - Comprehensive audit trail for compliance
 * - Advanced querying and filtering capabilities
 * - Automated retention and cleanup policies
 */
export default class SystemActionLogger extends NanoService<InputType> {
  constructor() {
    super();

    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["log", "query", "getStats", "cleanup", "export"],
          description: "Action to perform"
        },
        phase: {
          type: "string",
          enum: ["start", "complete"],
          description: "Request lifecycle phase"
        },
        userId: { type: "string" },
        httpMethod: { type: "string" },
        endpoint: { type: "string" },
        actionType: { 
          type: "string",
          enum: ["CREATE", "UPDATE", "DELETE", "BULK_UPDATE", "BULK_DELETE"]
        },
        resourceType: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 1000 },
        offset: { type: "number", minimum: 0 },
        dateRange: { 
          type: ["object", "null"],
          description: "Optional date range filter"
        },
        filterUserId: { type: ["string", "null"] },
        filterActionType: { type: ["string", "null"] },
        filterResourceType: { type: ["string", "null"] },
        filterRiskLevel: { type: ["string", "null"] },
        filterSuccess: { type: ["boolean", "string", "null"] },
        searchQuery: { type: ["string", "null"] },
        exportFormat: { 
          type: "string",
          enum: ["json", "csv"]
        }
      },
      required: ["action"]
    };

    this.outputSchema = {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "object" }
      }
    };
  }

  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      let result;
      
      switch (inputs.action) {
        case 'log':
          result = await this.logSystemAction(inputs, ctx);
          break;
        case 'query':
          result = await this.querySystemLogs(inputs);
          break;
        case 'getStats':
          result = await this.getSystemLogStats(inputs);
          break;
        case 'cleanup':
          result = await this.performRetentionCleanup();
          break;
        case 'export':
          result = await this.exportSystemLogs(inputs);
          break;
        default:
          throw new Error(`Unsupported action: ${inputs.action}`);
      }

      // Store result in context for downstream nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.systemLogResult = result as unknown as ParamsDictionary;

      response.setSuccess({
        success: true,
        message: `System log ${inputs.action} completed successfully`,
        data: result as any
      });

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "System logging operation failed"
      );
      nodeError.setCode(500);
      nodeError.setStack(error instanceof Error ? error.stack : undefined);
      nodeError.setName("system-action-logger");
      response.setError(nodeError);
    }

    return response;
  }

  /**
   * Log a system action with comprehensive context
   * Uses asynchronous logging to prevent performance impact
   */
  private async logSystemAction(inputs: InputType, ctx: Context): Promise<any> {
    // Skip logging for GET requests and non-action endpoints
    if (inputs.httpMethod === 'GET' || !this.shouldLogEndpoint(inputs.endpoint || '')) {
      return { logged: false, reason: 'Endpoint not tracked' };
    }

    // For start phase, just store timing information
    if (inputs.phase === 'start') {
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.systemLogStartTime = Date.now() as unknown as ParamsDictionary;
      return { logged: false, reason: 'Start phase - timing recorded' };
    }

    // Build comprehensive log entry
    const logEntry: NewSystemLog = {
      userId: inputs.userId || 'system',
      userEmail: inputs.userEmail || 'system@blok.local',
      userName: inputs.userName || 'System',
      userRole: inputs.userRole || 'system',
      action: inputs.actionType || this.inferActionType(inputs.httpMethod || ''),
      actionType: inputs.actionType || this.inferActionType(inputs.httpMethod || ''),
      resourceType: inputs.resourceType || this.inferResourceType(inputs.endpoint || ''),
      resourceId: inputs.resourceId || undefined,
      resourceName: inputs.resourceName || undefined,
      httpMethod: inputs.httpMethod || 'UNKNOWN',
      endpoint: inputs.endpoint || 'unknown',
      workflowName: inputs.workflowName || undefined,
      nodeName: inputs.nodeName || undefined,
      statusCode: inputs.statusCode || 200,
      success: inputs.success !== false,
      executionTimeMs: inputs.executionTimeMs || 
        (ctx.vars?.systemLogStartTime ? Date.now() - (ctx.vars.systemLogStartTime as unknown as number) : 0),
      changesSummary: inputs.changesSummary ? JSON.stringify(inputs.changesSummary) : undefined,
      ipAddress: inputs.ipAddress || this.extractIpFromContext(ctx) || 'unknown',
      userAgent: inputs.userAgent || this.extractUserAgentFromContext(ctx) || 'unknown',
      complianceFlags: JSON.stringify(['audit_trail', 'blame_tracking', 'enterprise_logging']),
      riskLevel: this.assessRiskLevel(inputs.actionType, inputs.resourceType, inputs.affectedUsersCount || 0)
    };

    // Asynchronous logging to prevent performance impact
    setImmediate(async () => {
      try {
        await db.systemLog.create({ data: logEntry });
      } catch (error) {
        console.error('System logging failed:', error);
        // Could implement fallback logging to file here
      }
    });

    return {
      logged: true,
      riskLevel: logEntry.riskLevel,
      executionTime: logEntry.executionTimeMs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Query system logs with advanced filtering
   */
  private async querySystemLogs(inputs: InputType): Promise<SystemLogQueryResult> {
    const limit = Math.min(inputs.limit || 50, 1000); // Max 1000 for performance
    const offset = inputs.offset || 0;
    
    // Build where conditions for Prisma
    const where: any = {};
    
    if (inputs.filterActionType) {
      where.action = inputs.filterActionType;
    }
    
    if (inputs.filterResourceType) {
      where.resourceType = inputs.filterResourceType;
    }
    
    if (inputs.filterRiskLevel) {
      where.riskLevel = inputs.filterRiskLevel;
    }
    
    if (inputs.filterSuccess !== undefined && inputs.filterSuccess !== null) {
      // Convert string values to boolean
      let successValue: boolean;
      if (typeof inputs.filterSuccess === 'string') {
        if (inputs.filterSuccess === '') {
          // Skip empty strings
        } else {
          successValue = inputs.filterSuccess === 'true';
          where.success = successValue;
        }
      } else {
        successValue = Boolean(inputs.filterSuccess);
        where.success = successValue;
      }
    }
    
    if (inputs.dateRange) {
      where.createdAt = {
        gte: new Date(inputs.dateRange.start),
        lte: new Date(inputs.dateRange.end)
      };
    }
    
    if (inputs.searchQuery) {
      // Enhanced text search across multiple fields including user info
      const searchTerm = inputs.searchQuery;
      where.OR = [
        { userName: { contains: searchTerm } },
        { userEmail: { contains: searchTerm } },
        { endpoint: { contains: searchTerm } },
        { resourceName: { contains: searchTerm } },
        { changesSummary: { contains: searchTerm } },
        { workflowName: { contains: searchTerm } },
        { nodeName: { contains: searchTerm } },
        { resourceType: { contains: searchTerm } }
      ];
    }

    // Execute query with pagination
    const logs = await db.systemLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await db.systemLog.count({
      where
    });
    
    const total = totalCount;

    // Parse JSON fields
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      changesSummary: log.changesSummary ? JSON.parse(log.changesSummary) : null,
      complianceFlags: log.complianceFlags ? JSON.parse(log.complianceFlags) : []
    }));

    return {
      logs: parsedLogs,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get comprehensive system log statistics
   */
  private async getSystemLogStats(inputs: InputType): Promise<SystemLogStats> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get total logs count
    const totalLogs = await db.systemLog.count();

    // Get today's logs
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');
    const todayLogs = await db.systemLog.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get failed actions
    const failedActions = await db.systemLog.count({
      where: {
        success: false
      }
    });

    // Get high risk actions
    const highRiskActions = await db.systemLog.count({
      where: {
        riskLevel: LogRiskLevel.HIGH
      }
    });

    // Get recent logs for analysis
    const recentLogs = await db.systemLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Analyze last 1000 logs
    });

    // Calculate statistics from recent logs
    const topUsers = this.calculateTopUsers(recentLogs);
    const topActions = this.calculateTopActions(recentLogs);
    const topResources = this.calculateTopResources(recentLogs);
    const riskDistribution = this.calculateRiskDistribution(recentLogs);

    return {
      totalLogs,
      todayLogs,
      failedActions,
      highRiskActions,
      topUsers,
      topActions,
      topResources,
      riskDistribution
    };
  }

  /**
   * Perform automated retention cleanup
   */
  private async performRetentionCleanup(): Promise<any> {
    // Get retention policy (create default if none exists)
    let retentionPolicy = await db.logRetentionPolicy.findFirst();
    
    if (!retentionPolicy) {
      retentionPolicy = await db.logRetentionPolicy.create({
        data: {
          retentionDays: 1095, // 3 years
          archiveDays: 1825,   // 5 years total
        }
      });
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPolicy.archiveDays);

    // Delete logs older than retention period
    const deleteResult = await db.systemLog.deleteMany({
      where: {
        createdAt: {
          lte: cutoffDate
        }
      }
    });

    // Update last cleanup timestamp
    await db.logRetentionPolicy.update({
      where: { id: retentionPolicy.id },
      data: { lastCleanup: new Date() }
    });

    return {
      deletedLogs: deleteResult.count || 0,
      cutoffDate: cutoffDate.toISOString(),
      nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };
  }

  /**
   * Export system logs in various formats
   */
  private async exportSystemLogs(inputs: InputType): Promise<any> {
    const logs = await this.querySystemLogs(inputs);
    
    if (inputs.exportFormat === 'csv') {
      const csvData = this.convertLogsToCSV(logs.logs);
      return {
        format: 'csv',
        csvData,
        exportedAt: new Date().toISOString(),
        totalRecords: logs.total
      };
    }
    
    return {
      format: 'json',
      data: logs.logs,
      exportedAt: new Date().toISOString(),
      totalRecords: logs.total
    };
  }

  /**
   * Convert logs to CSV format
   */
  private convertLogsToCSV(logs: any[]): string {
    if (!logs || logs.length === 0) {
      return 'No logs to export';
    }

    // Define CSV headers
    const headers = [
      'ID', 'Timestamp', 'User ID', 'User Email', 'User Name', 'User Role',
      'Action Type', 'Resource Type', 'Resource ID', 'Resource Name',
      'HTTP Method', 'Endpoint', 'Workflow', 'Node',
      'Status Code', 'Success', 'Error Message', 'Execution Time (ms)',
      'Request Size', 'IP Address', 'User Agent', 'Session ID',
      'Affected Users', 'Risk Level', 'Changes Summary'
    ];

    // Convert logs to CSV rows
    const csvRows = logs.map(log => [
      log.id || '',
      log.createdAt || '',
      log.userId || '',
      log.userEmail || '',
      log.userName || '',
      log.userRole || '',
      log.actionType || '',
      log.resourceType || '',
      log.resourceId || '',
      log.resourceName || '',
      log.httpMethod || '',
      log.endpoint || '',
      log.workflowName || '',
      log.nodeName || '',
      log.statusCode || '',
      log.success ? 'true' : 'false',
      log.errorMessage || '',
      log.executionTimeMs || '',
      log.requestSize || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.sessionId || '',
      log.affectedUsersCount || 0,
      log.riskLevel || '',
      log.changesSummary ? JSON.stringify(log.changesSummary) : ''
    ].map(field => {
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    }));

    // Combine headers and rows
    return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  }

  // Helper methods
  private shouldLogEndpoint(endpoint: string): boolean {
    // Skip health checks, metrics, and other non-action endpoints
    const skipPatterns = ['/health', '/metrics', '/ping', '/status'];
    return !skipPatterns.some(pattern => endpoint.includes(pattern));
  }

  private inferActionType(httpMethod: string): ActionType {
    switch (httpMethod.toUpperCase()) {
      case 'POST': return ActionType.CREATE;
      case 'PUT': 
      case 'PATCH': return ActionType.UPDATE;
      case 'DELETE': return ActionType.DELETE;
      default: return ActionType.UPDATE;
    }
  }

  private inferResourceType(endpoint: string): string {
    if (endpoint.includes('/user')) return ResourceType.USER;
    if (endpoint.includes('/profile')) return ResourceType.PROFILE;
    if (endpoint.includes('/setting')) return ResourceType.SETTINGS;
    if (endpoint.includes('/role')) return ResourceType.ROLE;
    if (endpoint.includes('/auth')) return ResourceType.AUTH;
    if (endpoint.includes('/security')) return ResourceType.SECURITY;
    return ResourceType.SYSTEM;
  }

  private assessRiskLevel(
    actionType?: ActionType, 
    resourceType?: string, 
    affectedCount: number = 1
  ): LogRiskLevel {
    // Critical risk assessment
    if (actionType === ActionType.BULK_DELETE || affectedCount > 10) {
      return LogRiskLevel.CRITICAL;
    }
    
    if (actionType === ActionType.DELETE && resourceType === ResourceType.USER) {
      return LogRiskLevel.HIGH;
    }
    
    if (actionType === ActionType.UPDATE && resourceType === ResourceType.ROLE) {
      return LogRiskLevel.HIGH;
    }
    
    if (actionType === ActionType.BULK_UPDATE || affectedCount > 5) {
      return LogRiskLevel.MEDIUM;
    }
    
    return LogRiskLevel.LOW;
  }

  private extractIpFromContext(ctx: Context): string {
    return ctx.request?.headers?.['x-forwarded-for'] || 
           ctx.request?.headers?.['x-real-ip'] || 
           ctx.request?.connection?.remoteAddress || 
           'unknown';
  }

  private extractUserAgentFromContext(ctx: Context): string {
    return ctx.request?.headers?.['user-agent'] || 'unknown';
  }

  private calculateTopUsers(logs: any[]): Array<{ userId: string; userName: string; count: number }> {
    const userCounts = logs.reduce((acc, log) => {
      const key = `${log.userId}:${log.userName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([key, count]) => {
        const [userId, userName] = key.split(':');
        return { userId, userName, count: count as number };
      });
  }

  private calculateTopActions(logs: any[]): Array<{ actionType: string; count: number }> {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.actionType] = (acc[log.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([actionType, count]) => ({ actionType, count: count as number }));
  }

  private calculateTopResources(logs: any[]): Array<{ resourceType: string; count: number }> {
    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resourceType] = (acc[log.resourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(resourceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([resourceType, count]) => ({ resourceType, count: count as number }));
  }

  private calculateRiskDistribution(logs: any[]): Record<LogRiskLevel, number> {
    return logs.reduce((acc, log) => {
      acc[log.riskLevel as LogRiskLevel] = (acc[log.riskLevel as LogRiskLevel] || 0) + 1;
      return acc;
    }, {
      [LogRiskLevel.LOW]: 0,
      [LogRiskLevel.MEDIUM]: 0,
      [LogRiskLevel.HIGH]: 0,
      [LogRiskLevel.CRITICAL]: 0
    } as Record<LogRiskLevel, number>);
  }


  /**
   * Static helper method for easy logging from other nodes
   */
  static async logAction(entry: SystemLogEntry): Promise<void> {
    setImmediate(async () => {
      try {
        const logEntry: NewSystemLog = {
          ...entry,
          changesSummary: entry.changesSummary ? JSON.stringify(entry.changesSummary) : undefined,
          complianceFlags: JSON.stringify(['audit_trail', 'blame_tracking'])
        };
        
        await db.systemLog.create({ data: logEntry });
      } catch (error) {
        console.error('Static system logging failed:', error);
      }
    });
  }
}
