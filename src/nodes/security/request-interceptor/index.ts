import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context } from "@nanoservice-ts/shared";
import { db } from "../../../../database/config";
import { 
  systemLogs, 
  type NewSystemLog, 
  ActionType, 
  LogRiskLevel, 
  ResourceType 
} from "../../../../database/schemas";

interface InputType {
  // Phase of the request lifecycle
  phase: 'start' | 'complete';
  
  // User context (automatically extracted from auth context)
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  
  // Request details (automatically extracted from context)
  httpMethod?: string;
  endpoint?: string;
  requestBody?: Record<string, any>;
  
  // Workflow context
  workflowName?: string;
  nodeName?: string;
  
  // For complete phase
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  responseData?: Record<string, any>;
  
  // Override automatic detection
  actionType?: ActionType;
  resourceType?: ResourceType | string;
  resourceId?: string;
  resourceName?: string;
  riskLevel?: LogRiskLevel;
  
  // Disable logging for specific cases
  skipLogging?: boolean;
}

/**
 * Request Interceptor Node
 * 
 * Automatically intercepts and logs HTTP requests in workflows.
 * Can be used in two phases:
 * 1. 'start' - Called at the beginning of a workflow to record request start
 * 2. 'complete' - Called at the end to record the final outcome
 * 
 * This node automatically extracts user context, request details, and workflow information
 * from the Blok context and logs them to the system logs for accountability.
 * 
 * Usage in workflows:
 * - Add as first step with phase: 'start'
 * - Add as last step with phase: 'complete'
 */
export default class RequestInterceptor extends NanoService<InputType> {
  constructor() {
    super();

    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        phase: {
          type: "string",
          enum: ["start", "complete"],
          description: "Phase of the request lifecycle"
        },
        skipLogging: {
          type: "boolean",
          description: "Skip logging for this request"
        },
        actionType: {
          type: "string",
          enum: ["CREATE", "UPDATE", "DELETE", "BULK_UPDATE", "BULK_DELETE"]
        },
        resourceType: { type: "string" },
        resourceId: { type: "string" },
        resourceName: { type: "string" },
        riskLevel: {
          type: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        statusCode: { type: "number" },
        success: { type: "boolean" }
      },
      required: ["phase"]
    };

    this.outputSchema = {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        logged: { type: "boolean" },
        interceptorData: { type: "object" }
      }
    };
  }

  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Skip logging if explicitly disabled
      if (inputs.skipLogging) {
        response.setSuccess({
          success: true,
          logged: false,
          message: "Logging skipped",
          interceptorData: {}
        });
        return response;
      }

      // Extract context information
      const contextData = this.extractContextData(ctx, inputs);
      
      // Only log action methods (POST, PUT, PATCH, DELETE)
      if (!this.shouldLogRequest(contextData.httpMethod)) {
        response.setSuccess({
          success: true,
          logged: false,
          message: "Request method not logged",
          interceptorData: contextData as any
        });
        return response;
      }

      // Log the request using SystemActionLogger
      const logResult = await this.logRequest(ctx, inputs, contextData);

      // Store interceptor data in context for later use
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.interceptorData = {
        ...contextData,
        logged: logResult.logged,
        phase: inputs.phase,
        timestamp: new Date().toISOString()
      } as unknown as ParamsDictionary;

      response.setSuccess({
        success: true,
        logged: logResult.logged,
        message: logResult.message || `Request ${inputs.phase} intercepted`,
        interceptorData: contextData as any
      });

    } catch (error: unknown) {
      // Don't fail the workflow if logging fails
      console.error('Request interceptor error:', error);
      
      response.setSuccess({
        success: true,
        logged: false,
        message: `Interceptor error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        interceptorData: {}
      });
    }

    return response;
  }

  /**
   * Extract relevant data from the Blok context
   */
  private extractContextData(ctx: Context, inputs: InputType) {
    const request = ctx.request || {};
    const user = ctx.vars?.currentUser || {};
    
    // Try to get user info from multiple sources
    const userId = inputs.userId || (user as any).id || (ctx.vars?.authResult as any)?.user?.id;
    const userEmail = inputs.userEmail || (user as any).email || (ctx.vars?.authResult as any)?.user?.email;
    const userName = inputs.userName || (user as any).name || (ctx.vars?.authResult as any)?.user?.name;
    const userRole = inputs.userRole || (user as any).role || (ctx.vars?.authResult as any)?.user?.role;
    
    // Only fall back to system user if we truly have no user data
    const finalUserId = userId || 'system';
    const finalUserEmail = userEmail || 'system@blok.app';
    const finalUserName = userName || 'System';
    const finalUserRole = userRole || 'system';
    
    // Log warning if we're falling back to system user when we shouldn't
    if (finalUserId === 'system' && ctx.vars?.isAuthenticated) {
      console.warn('RequestInterceptor Warning: Falling back to system user despite authentication being present');
    }
    
    return {
      // User context
      userId: finalUserId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      userRole: finalUserRole,
      
      // Request details
      httpMethod: inputs.httpMethod || (request as any).method || 'UNKNOWN',
      endpoint: inputs.endpoint || (request as any).path || (request as any).url || 'unknown',
      requestBody: inputs.requestBody || (request as any).body,
      
      // Network details
      ipAddress: this.extractIpAddress(ctx),
      userAgent: this.extractUserAgent(ctx),
      sessionId: (ctx.vars?.sessionId as any) || (ctx.vars?.currentSession as any)?.id || null,
      
      // Workflow context
      workflowName: inputs.workflowName || (ctx.vars?.workflowName as any) || 'unknown-workflow',
      nodeName: inputs.nodeName || 'request-interceptor',
      
      // Response details (for complete phase)
      statusCode: inputs.statusCode || 200,
      success: inputs.success !== false,
      errorMessage: inputs.errorMessage,
      responseData: inputs.responseData
    };
  }

  /**
   * Determine if we should log this request method
   */
  private shouldLogRequest(httpMethod: string): boolean {
    const actionMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return actionMethods.includes(httpMethod.toUpperCase());
  }

  /**
   * Log the request directly to the database
   */
  private async logRequest(ctx: Context, inputs: InputType, contextData: any) {
    try {
      // Skip logging for GET requests and non-action endpoints
      if (inputs.phase === 'start') {
        // For start phase, just store timing information
        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.requestStartTime = Date.now() as unknown as ParamsDictionary;
        return {
          logged: false,
          message: 'Start phase - timing recorded'
        };
      }

      // For complete phase, create comprehensive log entry
      const logEntry: NewSystemLog = {
        userId: contextData.userId,
        userEmail: contextData.userEmail,
        userName: contextData.userName,
        userRole: contextData.userRole,
        actionType: inputs.actionType || this.inferActionType(contextData.httpMethod),
        resourceType: inputs.resourceType || this.inferResourceType(contextData.endpoint),
        resourceId: inputs.resourceId || this.extractResourceId(contextData.endpoint, contextData.requestBody),
        resourceName: inputs.resourceName || this.extractResourceName(contextData.requestBody, contextData.responseData),
        httpMethod: contextData.httpMethod,
        endpoint: contextData.endpoint,
        workflowName: contextData.workflowName,
        nodeName: contextData.nodeName,
        statusCode: contextData.statusCode,
        success: contextData.success,
        errorMessage: contextData.errorMessage || null,
        executionTimeMs: ctx.vars?.requestStartTime ? 
          Date.now() - (ctx.vars.requestStartTime as unknown as number) : null,
        requestSize: contextData.requestBody ? JSON.stringify(contextData.requestBody).length : null,
        changesSummary: this.extractChangesSummary(contextData.requestBody, contextData.responseData) ? 
          JSON.stringify(this.extractChangesSummary(contextData.requestBody, contextData.responseData)) : null,
        ipAddress: contextData.ipAddress,
        userAgent: contextData.userAgent || null,
        sessionId: contextData.sessionId || null,
        affectedUsersCount: this.countAffectedUsers(contextData.requestBody, contextData.responseData) || 0,
        complianceFlags: JSON.stringify(['audit_trail', 'blame_tracking', 'enterprise_logging']),
        riskLevel: inputs.riskLevel || this.assessRiskLevel(contextData)
      };

      // Asynchronous logging to prevent performance impact
      setImmediate(async () => {
        try {
          await db.insert(systemLogs).values(logEntry);
        } catch (error) {
          console.error('Database logging failed:', error);
        }
      });

      return {
        logged: true,
        message: 'Request logged successfully',
        riskLevel: logEntry.riskLevel,
        executionTime: logEntry.executionTimeMs
      };
      
    } catch (error) {
      console.error('Request logging failed:', error);
      return {
        logged: false,
        message: `Logging error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper methods for data extraction and inference
  
  private extractIpAddress(ctx: Context): string {
    const request = ctx.request as any || {};
    return request.headers?.['x-forwarded-for'] || 
           request.headers?.['x-real-ip'] || 
           request.connection?.remoteAddress || 
           'unknown';
  }

  private extractUserAgent(ctx: Context): string {
    const request = ctx.request as any || {};
    return request.headers?.['user-agent'] || 'unknown';
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
    // Extract resource type from endpoint patterns
    if (endpoint.includes('/user')) return ResourceType.USER;
    if (endpoint.includes('/profile')) return ResourceType.PROFILE;
    if (endpoint.includes('/setting')) return ResourceType.SETTINGS;
    if (endpoint.includes('/role')) return ResourceType.ROLE;
    if (endpoint.includes('/auth')) return ResourceType.AUTH;
    if (endpoint.includes('/security')) return ResourceType.SECURITY;
    if (endpoint.includes('/admin')) return ResourceType.SYSTEM;
    return ResourceType.SYSTEM;
  }

  private extractResourceId(endpoint: string, requestBody?: any): string | undefined {
    // Try to extract ID from URL path
    const pathMatch = endpoint.match(/\/([a-f0-9-]{36}|\d+)(?:\/|$)/i);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    // Try to extract from request body
    if (requestBody) {
      return requestBody.id || requestBody.userId || requestBody.resourceId;
    }
    
    return undefined;
  }

  private extractResourceName(requestBody?: any, responseData?: any): string | undefined {
    // Try to extract meaningful name from request or response
    if (requestBody) {
      return requestBody.name || requestBody.title || requestBody.email;
    }
    
    if (responseData) {
      return responseData.name || responseData.title || responseData.email;
    }
    
    return undefined;
  }

  private assessRiskLevel(contextData: any): LogRiskLevel {
    const { httpMethod, endpoint, requestBody } = contextData;
    
    // Critical risk patterns
    if (httpMethod === 'DELETE' && endpoint.includes('/user')) {
      return LogRiskLevel.CRITICAL;
    }
    
    if (requestBody?.action === 'bulk_delete' || requestBody?.userIds?.length > 10) {
      return LogRiskLevel.CRITICAL;
    }
    
    // High risk patterns
    if (httpMethod === 'DELETE') {
      return LogRiskLevel.HIGH;
    }
    
    if (endpoint.includes('/role') || endpoint.includes('/permission')) {
      return LogRiskLevel.HIGH;
    }
    
    if (requestBody?.role || requestBody?.permissions) {
      return LogRiskLevel.HIGH;
    }
    
    // Medium risk patterns
    if (requestBody?.userIds?.length > 1 || requestBody?.bulk === true) {
      return LogRiskLevel.MEDIUM;
    }
    
    if (endpoint.includes('/admin') || endpoint.includes('/system')) {
      return LogRiskLevel.MEDIUM;
    }
    
    // Default to low risk
    return LogRiskLevel.LOW;
  }

  private extractChangesSummary(requestBody?: any, responseData?: any): Record<string, any> | undefined {
    if (!requestBody) return undefined;
    
    const changes: Record<string, any> = {};
    
    // Track specific field changes
    const trackableFields = ['name', 'email', 'role', 'status', 'permissions', 'settings'];
    
    for (const field of trackableFields) {
      if (requestBody[field] !== undefined) {
        changes[field] = {
          to: requestBody[field],
          // If we have response data with previous values, include them
          ...(responseData?.previous?.[field] && { from: responseData.previous[field] })
        };
      }
    }
    
    // Track bulk operations
    if (requestBody.userIds) {
      changes.bulkOperation = {
        type: requestBody.action || 'update',
        affectedUsers: requestBody.userIds.length,
        userIds: requestBody.userIds
      };
    }
    
    return Object.keys(changes).length > 0 ? changes : undefined;
  }

  private countAffectedUsers(requestBody?: any, responseData?: any): number {
    // Count affected users from various sources
    if (requestBody?.userIds) {
      return requestBody.userIds.length;
    }
    
    if (responseData?.affectedCount) {
      return responseData.affectedCount;
    }
    
    if (requestBody?.userId || responseData?.userId) {
      return 1;
    }
    
    return 0;
  }

  /**
   * Static helper method for manual logging from other nodes
   */
  static async intercept(ctx: Context, phase: 'start' | 'complete', overrides: Partial<InputType> = {}) {
    const interceptor = new RequestInterceptor();
    return await interceptor.handle(ctx, { phase, ...overrides });
  }
}
