import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { type ParamsDictionary, type JsonLikeObject } from "@nanoservice-ts/runner";

import { db } from "../../../database/config";

// Define interfaces locally since we no longer use Drizzle schemas
interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  actionUrl?: string;
  actionLabel?: string;
  category?: string;
  expiresAt?: Date;
  metadata?: string;
  sourceWorkflow?: string;
  sourceNode?: string;
}

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  category?: string;
  metadata?: Record<string, any>;
  sourceWorkflow?: string;
  sourceNode?: string;
  expiresAt?: string;
}

export default class CreateNotification extends NanoService<CreateNotificationInput> {
  constructor() {
    super();
    
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the notification was created successfully"
        },
        notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the notification"
            },
            userId: {
              type: "string",
              description: "ID of the user who will receive the notification"
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
            sourceWorkflow: {
              type: ["string", "null"],
              description: "Name of the workflow that created this notification"
            },
            sourceNode: {
              type: ["string", "null"],
              description: "Name of the node that created this notification"
            },
            createdAt: {
              type: "string",
              description: "ISO timestamp when the notification was created"
            },
            expiresAt: {
              type: ["string", "null"],
              description: "ISO timestamp when the notification expires"
            }
          },
          required: ["id", "userId", "title", "message", "type", "priority", "isRead", "createdAt"]
        },
        message: {
          type: "string",
          description: "Success message"
        }
      },
      required: ["success", "notification", "message"]
    };
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "ID of the user to notify"
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
          default: "info",
          description: "Type of notification"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
          description: "Priority level"
        },
        actionUrl: {
          type: "string",
          description: "URL to navigate when notification is clicked"
        },
        actionLabel: {
          type: "string",
          description: "Label for the action button"
        },
        category: {
          type: "string",
          description: "Notification category (e.g., workflow, system, user)"
        },
        metadata: {
          type: "object",
          description: "Additional metadata as JSON object"
        },
        sourceWorkflow: {
          type: "string",
          description: "Name of the workflow that created this notification"
        },
        sourceNode: {
          type: "string",
          description: "Name of the node that created this notification"
        },
        expiresAt: {
          type: "string",
          description: "ISO date string when notification expires"
        }
      },
      required: ["userId", "title", "message"]
    };
  }

  async handle(ctx: Context, inputs: CreateNotificationInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate required inputs
      if (!inputs.userId || !inputs.title || !inputs.message) {
        throw new Error("userId, title, and message are required");
      }

      // Prepare notification data
      const notificationData: CreateNotificationPayload = {
        userId: inputs.userId,
        title: inputs.title.trim(),
        message: inputs.message.trim(),
        type: inputs.type || 'info',
        priority: inputs.priority || 'medium',
        actionUrl: inputs.actionUrl?.trim() || undefined,
        actionLabel: inputs.actionLabel?.trim() || undefined,
        category: inputs.category?.trim() || undefined,
        metadata: inputs.metadata ? JSON.stringify(inputs.metadata) : undefined,
        sourceWorkflow: inputs.sourceWorkflow?.trim() || undefined,
        sourceNode: inputs.sourceNode?.trim() || undefined,
        expiresAt: inputs.expiresAt ? new Date(inputs.expiresAt) : undefined,
      };

      // Insert notification into database
      const createdNotification = await db.notification.create({
        data: {
          ...notificationData,
          type: notificationData.type ? notificationData.type.toUpperCase() as any : undefined,
          priority: notificationData.priority ? notificationData.priority.toUpperCase() as any : undefined,
          metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : undefined,
        }
      });

      // Store notification data in context for other nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.createdNotification = {
        id: createdNotification.id,
        userId: createdNotification.userId,
        title: createdNotification.title,
        message: createdNotification.message,
        type: createdNotification.type,
        priority: createdNotification.priority,
        isRead: createdNotification.isRead,
        createdAt: createdNotification.createdAt,
      } as unknown as ParamsDictionary;

      // Return success response
      response.setSuccess({
        success: true,
        notification: {
          id: createdNotification.id,
          userId: createdNotification.userId,
          title: createdNotification.title,
          message: createdNotification.message,
          type: createdNotification.type,
          priority: createdNotification.priority,
          isRead: createdNotification.isRead,
          actionUrl: createdNotification.actionUrl,
          actionLabel: createdNotification.actionLabel,
          category: createdNotification.category,
          metadata: createdNotification.metadata ? JSON.parse(createdNotification.metadata) : null,
          sourceWorkflow: createdNotification.sourceWorkflow,
          sourceNode: createdNotification.sourceNode,
          createdAt: createdNotification.createdAt,
          expiresAt: createdNotification.expiresAt,
        },
        message: "Notification created successfully"
      } as unknown as JsonLikeObject);

    } catch (error: unknown) {
      console.error("Create notification error:", error);
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to create notification"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }
}
