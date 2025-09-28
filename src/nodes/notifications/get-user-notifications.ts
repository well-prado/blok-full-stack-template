import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { type ParamsDictionary, type JsonLikeObject } from "@nanoservice-ts/runner";

import { db } from "../../../database/config";

interface GetUserNotificationsInput {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  includeExpired?: boolean;
}

export default class GetUserNotifications extends NanoService<GetUserNotificationsInput> {
  constructor() {
    super();
    
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the notifications were retrieved successfully"
        },
        data: {
          type: "object",
          properties: {
            notifications: {
              type: "array",
              items: {
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
                  readAt: {
                    type: ["string", "null"],
                    description: "ISO timestamp when the notification was read"
                  },
                  expiresAt: {
                    type: ["string", "null"],
                    description: "ISO timestamp when the notification expires"
                  }
                },
                required: ["id", "title", "message", "type", "priority", "isRead", "createdAt"]
              },
              description: "Array of user notifications"
            },
            pagination: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Number of notifications per page"
                },
                offset: {
                  type: "number",
                  description: "Number of notifications skipped"
                },
                totalCount: {
                  type: "number",
                  description: "Total number of notifications matching the criteria"
                },
                hasMore: {
                  type: "boolean",
                  description: "Whether there are more notifications available"
                }
              },
              required: ["limit", "offset", "totalCount", "hasMore"]
            },
            unreadCount: {
              type: "number",
              description: "Number of unread notifications for the user"
            }
          },
          required: ["notifications", "pagination", "unreadCount"]
        },
        message: {
          type: "string",
          description: "Success message"
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
          description: "ID of the user to get notifications for"
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 50,
          description: "Maximum number of notifications to return"
        },
        offset: {
          type: "number",
          minimum: 0,
          default: 0,
          description: "Number of notifications to skip"
        },
        unreadOnly: {
          type: "boolean",
          default: false,
          description: "Return only unread notifications"
        },
        includeExpired: {
          type: "boolean",
          default: false,
          description: "Include expired notifications"
        }
      },
      required: ["userId"]
    };
  }

  async handle(ctx: Context, inputs: GetUserNotificationsInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate required inputs
      if (!inputs.userId) {
        throw new Error("userId is required");
      }

      const limit = inputs.limit || 50;
      const offset = inputs.offset || 0;
      const unreadOnly = inputs.unreadOnly || false;
      const includeExpired = inputs.includeExpired || false;

      // Build query conditions for Prisma
      const where: any = {
        userId: inputs.userId
      };

      // Filter by read status if requested
      if (unreadOnly) {
        where.isRead = false;
      }

      // Filter out expired notifications unless requested
      if (!includeExpired) {
        const now = new Date();
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ];
      }

      // Get notifications
      const userNotifications = await db.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      // Get total count for pagination
      const totalCount = await db.notification.count({
        where
      });

      // Get unread count
      const unreadWhere: any = {
        userId: inputs.userId,
        isRead: false
      };
      
      if (!includeExpired) {
        const now = new Date();
        unreadWhere.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ];
      }

      const unreadCount = await db.notification.count({
        where: unreadWhere
      });

      // Format notifications
      const formattedNotifications = userNotifications.map((notification: any) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        category: notification.category,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
        sourceWorkflow: notification.sourceWorkflow,
        sourceNode: notification.sourceNode,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        expiresAt: notification.expiresAt,
      }));

      // Store data in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.userNotifications = {
        notifications: formattedNotifications,
        totalCount: totalCount,
        unreadCount: unreadCount,
        hasMore: (offset + limit) < totalCount,
      } as unknown as ParamsDictionary;

      // Return success response
      response.setSuccess({
        success: true,
        data: {
          notifications: formattedNotifications,
          pagination: {
            limit,
            offset,
            totalCount: totalCount,
            hasMore: (offset + limit) < totalCount,
          },
          unreadCount: unreadCount,
        },
        message: "Notifications retrieved successfully"
      } as unknown as JsonLikeObject);

    } catch (error: unknown) {
      console.error("Get user notifications error:", error);
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to get notifications"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }
}
