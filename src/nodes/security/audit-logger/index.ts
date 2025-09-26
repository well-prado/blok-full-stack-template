import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from "../../../../database/config";

// Type definition for audit log creation
interface NewAuditLog {
  userId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}

interface InputType {
  action: 'log' | 'query' | 'getRecentActivity';
  // For logging
  userId?: string;
  event?: string; // Only required for 'log' action
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  // For querying
  limit?: number;
  offset?: number;
  filterUserId?: string;
  filterAction?: string;
  filterResource?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditQueryResult {
  logs: any[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Audit Logger Node
 * 
 * This node handles security audit logging:
 * - Log security events and user actions
 * - Query audit logs with filtering
 * - Get recent activity summaries
 * - Track failed login attempts and suspicious activity
 */
export default class AuditLogger extends NanoService<InputType> {
  /**
   * Initializes a new instance of the AuditLogger class.
   */
  constructor() {
    super();

    this.inputSchema = {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["log", "query", "getRecentActivity"]
        },
        limit: { type: "number" },
        offset: { type: "number" }
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

  /**
   * Handles the audit logging request
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response: NanoServiceResponse = new NanoServiceResponse();


    try {
      let result;
      
      switch (inputs.action) {
        case 'log':
          result = await this.logEvent(inputs);
          break;
        case 'query':
          result = await this.queryLogs(inputs);
          break;
        case 'getRecentActivity':
          result = await this.getRecentActivity(inputs);
          break;
        default:
          throw new Error(`Unsupported action: ${inputs.action}`);
      }

      response.setSuccess({
        success: true,
        message: "Audit operation completed successfully",
        data: result as any
      });

    } catch (error: unknown) {
      const nodeError: GlobalError = new GlobalError((error as Error).message);
      nodeError.setCode(400);
      nodeError.setStack((error as Error).stack);
      nodeError.setName("audit-logger");
      response.setError(nodeError);
    }

    return response;
  }

  /**
   * Log a security event
   */
  private async logEvent(inputs: InputType) {
    if (!inputs.event) {
      throw new Error("Event name is required for logging");
    }

    const logEntry: NewAuditLog = {
      userId: inputs.userId || null,
      action: inputs.event,
      resource: inputs.resource || null,
      resourceId: inputs.resourceId || null,
      details: inputs.details ? JSON.stringify(inputs.details) : null,
      ipAddress: inputs.ipAddress || null,
      userAgent: inputs.userAgent || null,
      success: inputs.success !== undefined ? inputs.success : true,
      errorMessage: inputs.errorMessage || null,
    };

    const insertedLog = await db.auditLog.create({
      data: logEntry
    });

    return {
      logged: true,
      logId: insertedLog.id,
      timestamp: insertedLog.createdAt.toISOString()
    };
  }

  /**
   * Query audit logs with filtering
   */
  private async queryLogs(inputs: InputType): Promise<AuditQueryResult> {
    const limit = inputs.limit || 50;
    const offset = inputs.offset || 0;
    
    // Build where conditions
    const where: any = {};
    
    if (inputs.filterUserId) {
      where.userId = inputs.filterUserId;
    }
    
    if (inputs.filterAction) {
      where.action = { contains: inputs.filterAction };
    }
    
    if (inputs.filterResource) {
      where.resource = inputs.filterResource;
    }
    
    if (inputs.startDate || inputs.endDate) {
      where.createdAt = {};
      if (inputs.startDate) {
        where.createdAt.gte = new Date(inputs.startDate);
      }
      if (inputs.endDate) {
        where.createdAt.lte = new Date(inputs.endDate);
      }
    }

    // Execute query
    const logs = await db.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await db.auditLog.count({
      where
    });
    
    const total = totalCount;

    // Parse details field for each log
    const parsedLogs = logs.map((log: { id: string; userId: string; action: string; resourceType: string; resourceId: string | null; details: string | null; ipAddress: string; userAgent: string; createdAt: Date }) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    return {
      logs: parsedLogs,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }

  /**
   * Get recent activity summary
   */
  private async getRecentActivity(inputs: InputType) {
    const limit = inputs.limit || 20;
    
    // Get recent logs
    const recentLogs = await db.auditLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get activity statistics
    const stats = {
      totalEvents: recentLogs.length,
      successfulEvents: recentLogs.filter((log: any) => log.success).length,
      failedEvents: recentLogs.filter((log: any) => !log.success).length,
      uniqueUsers: new Set(recentLogs.filter((log: any) => log.userId).map((log: any) => log.userId)).size,
      topActions: this.getTopActions(recentLogs),
      recentFailures: recentLogs.filter((log: any) => !log.success).slice(0, 5)
    };

    const parsedLogs = recentLogs.map((log: { id: string; userId: string; action: string; resourceType: string; resourceId: string | null; details: string | null; ipAddress: string; userAgent: string; createdAt: Date; success?: boolean }) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    return {
      recentActivity: parsedLogs,
      statistics: stats,
      timeRange: "Last 24 hours"
    };
  }

  /**
   * Get top actions from logs
   */
  private getTopActions(logs: any[]) {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }

  /**
   * Static helper method to log common events
   */
  static async logSecurityEvent(
    event: string,
    userId?: string,
    details?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ) {
    try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action: event,
        resource: 'security',
        details: details ? JSON.stringify(details) : null,
        success,
        errorMessage: errorMessage || null,
      }
    });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
