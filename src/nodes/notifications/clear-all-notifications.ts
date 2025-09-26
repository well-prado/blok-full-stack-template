import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { type ParamsDictionary, type JsonLikeObject } from "@nanoservice-ts/runner";

import { db } from "../../../database/config";

interface ClearAllNotificationsInput {
  userId: string;
  markAsRead?: boolean; // If true, mark as read instead of deleting
  olderThanDays?: number; // Only clear notifications older than X days
}

export default class ClearAllNotifications extends NanoService<ClearAllNotificationsInput> {
  constructor() {
    super();
    
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the notifications were cleared successfully"
        },
        data: {
          type: "object",
          properties: {
            affectedCount: {
              type: "number",
              description: "Number of notifications that were affected"
            },
            action: {
              type: "string",
              enum: ["marked_as_read", "deleted"],
              description: "The action that was performed on the notifications"
            },
            userId: {
              type: "string",
              description: "ID of the user whose notifications were cleared"
            }
          },
          required: ["affectedCount", "action", "userId"]
        },
        message: {
          type: "string",
          description: "Success message describing the operation result"
        }
      },
      required: ["success", "data", "message"]
    };
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "ID of the user whose notifications to clear"
        },
        markAsRead: {
          type: "boolean",
          default: false,
          description: "Mark as read instead of deleting"
        },
        olderThanDays: {
          type: "number",
          minimum: 0,
          description: "Only clear notifications older than this many days"
        }
      },
      required: ["userId"]
    };
  }

  async handle(ctx: Context, inputs: ClearAllNotificationsInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate required inputs
      if (!inputs.userId) {
        throw new Error("userId is required");
      }

      const markAsRead = inputs.markAsRead || false;
      const olderThanDays = inputs.olderThanDays;

      // Build conditions for Prisma
      const where: any = {
        userId: inputs.userId
      };

      // Add date filter if specified
      if (olderThanDays !== undefined && olderThanDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        where.createdAt = {
          lt: cutoffDate
        };
      }

      let affectedCount = 0;

      if (markAsRead) {
        // Mark notifications as read
        const readAt = new Date();
        const result = await db.notification.updateMany({
          where,
          data: {
            isRead: true,
            readAt,
          }
        });
        
        affectedCount = result.count;
      } else {
        // Delete notifications
        const result = await db.notification.deleteMany({
          where
        });
        
        affectedCount = result.count;
      }

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.clearedNotifications = {
        affectedCount,
        action: markAsRead ? 'marked_as_read' : 'deleted',
        userId: inputs.userId,
      } as unknown as ParamsDictionary;

      // Return success response
      response.setSuccess({
        success: true,
        data: {
          affectedCount,
          action: markAsRead ? 'marked_as_read' : 'deleted',
          userId: inputs.userId,
        },
        message: `${affectedCount} notifications ${markAsRead ? 'marked as read' : 'cleared'} successfully`
      } as unknown as JsonLikeObject);

    } catch (error: unknown) {
      console.error("Clear all notifications error:", error);
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to clear notifications"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }
}
