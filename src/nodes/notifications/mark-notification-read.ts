import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { type ParamsDictionary, type JsonLikeObject } from "@nanoservice-ts/runner";

import { db } from "../../../database/config";

interface MarkNotificationReadInput {
  notificationId: string;
  userId: string;
  isRead?: boolean;
}

export default class MarkNotificationRead extends NanoService<MarkNotificationReadInput> {
  constructor() {
    super();
    
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the notification was updated successfully"
        },
        notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the notification"
            },
            title: {
              type: "string",
              description: "Notification title"
            },
            message: {
              type: "string",
              description: "Notification message content"
            },
            type: {
              type: "string",
              enum: ["info", "success", "warning", "error", "system"],
              description: "Type of notification"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Priority level of the notification"
            },
            isRead: {
              type: "boolean",
              description: "Whether the notification has been read"
            },
            readAt: {
              type: ["string", "null"],
              description: "ISO timestamp when the notification was read"
            },
            actionUrl: {
              type: ["string", "null"],
              description: "URL to navigate when notification is clicked"
            },
            actionLabel: {
              type: ["string", "null"],
              description: "Label for the action button"
            },
            category: {
              type: ["string", "null"],
              description: "Notification category"
            },
            metadata: {
              type: ["object", "null"],
              description: "Additional metadata as JSON object"
            },
            createdAt: {
              type: "string",
              description: "ISO timestamp when the notification was created"
            }
          },
          required: ["id", "title", "message", "type", "priority", "isRead", "createdAt"]
        },
        message: {
          type: "string",
          description: "Success message indicating the action performed"
        }
      },
      required: ["success", "notification", "message"]
    };
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        notificationId: {
          type: "string",
          description: "ID of the notification to update"
        },
        userId: {
          type: "string",
          description: "ID of the user (for security verification)"
        },
        isRead: {
          type: "boolean",
          default: true,
          description: "Mark as read (true) or unread (false)"
        }
      },
      required: ["notificationId", "userId"]
    };
  }

  async handle(ctx: Context, inputs: MarkNotificationReadInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate required inputs
      if (!inputs.notificationId || !inputs.userId) {
        throw new Error("notificationId and userId are required");
      }

      const isRead = inputs.isRead !== undefined ? inputs.isRead : true;
      const readAt = isRead ? new Date().toISOString() : null;

      // Update notification (only if it belongs to the user)
      const updatedNotification = await db.notification.update({
        where: {
          id: inputs.notificationId,
          userId: inputs.userId
        },
        data: {
          isRead,
          readAt: readAt ? new Date(readAt) : null,
        }
      });

      if (!updatedNotification) {
        throw new Error("Notification not found or access denied");
      }

      // Store updated notification in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.updatedNotification = {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
        readAt: updatedNotification.readAt,
      } as unknown as ParamsDictionary;

      // Return success response
      response.setSuccess({
        success: true,
        notification: {
          id: updatedNotification.id,
          title: updatedNotification.title,
          message: updatedNotification.message,
          type: updatedNotification.type,
          priority: updatedNotification.priority,
          isRead: updatedNotification.isRead,
          readAt: updatedNotification.readAt,
          actionUrl: updatedNotification.actionUrl,
          actionLabel: updatedNotification.actionLabel,
          category: updatedNotification.category,
          metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : null,
          createdAt: updatedNotification.createdAt,
        },
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`
      } as unknown as JsonLikeObject);

    } catch (error: unknown) {
      console.error("Mark notification read error:", error);
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to update notification"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }
}
