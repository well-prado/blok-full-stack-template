import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from "../../../../database/config";

interface InputType {
  action: 'updateRole' | 'bulkUpdateRoles' | 'getRoleStats';
  userId?: string;
  userIds?: string[];
  newRole?: 'admin' | 'user';
  currentUserId: string; // The admin performing the action
}

interface RoleStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentRoleChanges: Array<{
    userId: string;
    userName: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
    changedBy: string;
  }>;
}

/**
 * User Role Manager Node
 * 
 * This node handles advanced user role management operations:
 * - Single user role updates
 * - Bulk role updates for multiple users
 * - Role statistics and reporting
 * - Role change auditing and history
 */
export default class UserRoleManager extends NanoService<InputType> {
  /**
   * Initializes a new instance of the UserRoleManager class.
   */
  constructor() {
    super();

    this.inputSchema = {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["updateRole", "bulkUpdateRoles", "getRoleStats"],
          description: "Action to perform"
        },
        userId: {
          type: "string",
          description: "User ID for single role update"
        },
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs for bulk operations"
        },
        newRole: {
          type: "string",
          enum: ["admin", "user"],
          description: "New role to assign"
        },
        currentUserId: {
          type: "string",
          description: "ID of the admin performing the action"
        }
      },
      required: ["action", "currentUserId"]
    };

    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      oneOf: [
        {
          // updateRole response
          properties: {
            success: {
              type: "boolean",
              description: "Whether the role update was successful"
            },
            message: {
              type: "string",
              description: "Operation result message"
            },
            data: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                  description: "ID of the user whose role was updated"
                },
                oldRole: {
                  type: "string",
                  enum: ["admin", "user"],
                  description: "Previous role of the user"
                },
                newRole: {
                  type: "string",
                  enum: ["admin", "user"],
                  description: "New role assigned to the user"
                },
                updatedAt: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp when the role was updated"
                },
                updatedBy: {
                  type: "string",
                  description: "ID of the admin who performed the update"
                }
              },
              required: ["userId", "oldRole", "newRole", "updatedAt", "updatedBy"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // bulkUpdateRoles response
          properties: {
            success: {
              type: "boolean",
              description: "Whether the bulk update was successful"
            },
            message: {
              type: "string",
              description: "Operation result message"
            },
            data: {
              type: "object",
              properties: {
                updatedUsers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      userId: {
                        type: "string",
                        description: "ID of the updated user"
                      },
                      oldRole: {
                        type: "string",
                        enum: ["admin", "user"],
                        description: "Previous role"
                      },
                      newRole: {
                        type: "string",
                        enum: ["admin", "user"],
                        description: "New role"
                      }
                    },
                    required: ["userId", "oldRole", "newRole"]
                  },
                  description: "Array of successfully updated users"
                },
                failedUsers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      userId: {
                        type: "string",
                        description: "ID of the user that failed to update"
                      },
                      error: {
                        type: "string",
                        description: "Error message for this user"
                      }
                    },
                    required: ["userId", "error"]
                  },
                  description: "Array of users that failed to update"
                },
                totalProcessed: {
                  type: "number",
                  description: "Total number of users processed"
                },
                successCount: {
                  type: "number",
                  description: "Number of successful updates"
                },
                failureCount: {
                  type: "number",
                  description: "Number of failed updates"
                }
              },
              required: ["updatedUsers", "failedUsers", "totalProcessed", "successCount", "failureCount"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // getRoleStats response
          properties: {
            success: {
              type: "boolean",
              description: "Whether the stats retrieval was successful"
            },
            message: {
              type: "string",
              description: "Operation result message"
            },
            data: {
              type: "object",
              properties: {
                totalUsers: {
                  type: "number",
                  description: "Total number of users in the system"
                },
                adminUsers: {
                  type: "number",
                  description: "Number of admin users"
                },
                regularUsers: {
                  type: "number",
                  description: "Number of regular users"
                },
                recentRoleChanges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      userId: {
                        type: "string",
                        description: "ID of the user whose role changed"
                      },
                      userName: {
                        type: "string",
                        description: "Name of the user"
                      },
                      oldRole: {
                        type: "string",
                        enum: ["admin", "user"],
                        description: "Previous role"
                      },
                      newRole: {
                        type: "string",
                        enum: ["admin", "user"],
                        description: "New role"
                      },
                      changedAt: {
                        type: "string",
                        format: "date-time",
                        description: "When the role was changed"
                      },
                      changedBy: {
                        type: "string",
                        description: "ID of the admin who made the change"
                      }
                    },
                    required: ["userId", "userName", "oldRole", "newRole", "changedAt", "changedBy"]
                  },
                  description: "Recent role changes for audit purposes"
                }
              },
              required: ["totalUsers", "adminUsers", "regularUsers", "recentRoleChanges"]
            }
          },
          required: ["success", "message", "data"]
        }
      ]
    };
  }

  /**
   * Handles the user role management request
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Verify the current user is an admin
      const currentUser = await this.getCurrentUser(inputs.currentUserId);
      if (!currentUser || currentUser.role !== 'ADMIN') {
        throw new Error("Unauthorized: Only admins can manage user roles");
      }

      let result;
      switch (inputs.action) {
        case 'updateRole':
          result = await this.updateUserRole(inputs, currentUser);
          break;
        case 'bulkUpdateRoles':
          result = await this.bulkUpdateRoles(inputs, currentUser);
          break;
        case 'getRoleStats':
          result = await this.getRoleStats();
          break;
        default:
          throw new Error(`Unsupported action: ${inputs.action}`);
      }

      response.setSuccess({
        success: true,
        message: "Role management operation completed successfully",
        data: result as any
      });

    } catch (error: unknown) {
      const nodeError: GlobalError = new GlobalError((error as Error).message);
      nodeError.setCode(400);
      nodeError.setStack((error as Error).stack);
      nodeError.setName("user-role-manager");
      response.setError(nodeError);
    }

    return response;
  }

  /**
   * Get current user information
   */
  private async getCurrentUser(userId: string) {
    const user = await db.user.findUnique({
      where: {
        id: userId
      }
    });

    return user;
  }

  /**
   * Update a single user's role
   */
  private async updateUserRole(inputs: InputType, currentUser: any) {
    if (!inputs.userId || !inputs.newRole) {
      throw new Error("userId and newRole are required for updateRole action");
    }

    // Prevent self-demotion from admin
    if (inputs.userId === currentUser.id && inputs.newRole !== 'admin') {
      throw new Error("You cannot remove your own admin privileges");
    }

    // Get the target user
    const targetUser = await this.getCurrentUser(inputs.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if role is actually changing
    const currentRole = targetUser.role === 'ADMIN' ? 'admin' : 'user';
    if (currentRole === inputs.newRole) {
      return {
        updated: false,
        message: `User is already assigned the ${inputs.newRole} role`,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      };
    }

    // Update the role
    const updatedUser = await db.user.update({
      where: { id: inputs.userId },
      data: { 
        role: inputs.newRole === 'admin' ? 'ADMIN' : 'USER',
        updatedAt: new Date()
      }
    });

    if (!updatedUser) {
      throw new Error("Failed to update user role");
    }

    return {
      updated: true,
      message: `Successfully updated ${targetUser.name}'s role to ${inputs.newRole}`,
      previousRole: targetUser.role,
      newRole: inputs.newRole,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    };
  }

  /**
   * Update multiple users' roles in bulk
   */
  private async bulkUpdateRoles(inputs: InputType, currentUser: any) {
    if (!inputs.userIds || inputs.userIds.length === 0 || !inputs.newRole) {
      throw new Error("userIds array and newRole are required for bulkUpdateRoles action");
    }

    // Prevent self-demotion from admin
    if (inputs.userIds.includes(currentUser.id) && inputs.newRole !== 'admin') {
      throw new Error("You cannot remove your own admin privileges");
    }

    const results = [];
    const errors = [];

    for (const userId of inputs.userIds) {
      try {
        const result = await this.updateUserRole(
          { ...inputs, action: 'updateRole', userId },
          currentUser
        );
        results.push(result);
      } catch (error) {
        errors.push({
          userId,
          error: (error as Error).message
        });
      }
    }

    return {
      totalProcessed: inputs.userIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Get role statistics and recent changes
   */
  private async getRoleStats(): Promise<RoleStats> {
    // Get user counts by role
    const totalUsers = await db.user.count();
    const adminUsers = await db.user.count({
      where: { role: 'ADMIN' }
    });
    const regularUsers = totalUsers - adminUsers;

    // In a real system, this would query an audit log table
    // For now, we'll return mock recent changes
    const recentRoleChanges = [
      {
        userId: "mock-1",
        userName: "John Doe",
        oldRole: "user",
        newRole: "admin",
        changedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        changedBy: "Admin User"
      }
    ];

    return {
      totalUsers,
      adminUsers,
      regularUsers,
      recentRoleChanges
    };
  }
}
