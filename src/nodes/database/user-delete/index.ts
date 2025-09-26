import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from '../../../../database/config';

type UserDeleteInputType = {
  id: string;
  cascadeDelete?: boolean; // Delete associated sessions
};

type DeletedUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  deletedAt: string;
};

type UserDeleteOutputType = {
  success: boolean;
  deletedUser?: DeletedUserType;
  message: string;
  statusCode: number;
  sessionsDeleted: number;
};

export default class UserDelete extends NanoService<UserDeleteInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "User ID to delete"
        },
        cascadeDelete: {
          type: "boolean",
          default: true,
          description: "Delete associated sessions (default: true)"
        }
      },
      required: ["id"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the user was deleted successfully"
        },
        deletedUser: {
          type: "object",
          description: "Deleted user information (only present on success)",
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier"
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address"
            },
            name: {
              type: "string",
              description: "User's full name"
            },
            role: {
              type: "string",
              enum: ["admin", "user"],
              description: "User's role"
            },
            deletedAt: {
              type: "string",
              format: "date-time",
              description: "Deletion timestamp"
            }
          },
          required: ["id", "email", "name", "role", "deletedAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 400, 404, 500]
        },
        sessionsDeleted: {
          type: "number",
          minimum: 0,
          description: "Number of associated sessions deleted"
        }
      },
      required: ["success", "message", "statusCode", "sessionsDeleted"]
    };
  }

  async handle(ctx: Context, inputs: UserDeleteInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.id || typeof inputs.id !== 'string') {
        throw new Error('User ID is required and must be a string');
      }

      ctx.logger.log(`Attempting to delete user: ${inputs.id}`);

      // Check if user exists and get their data before deletion
      const existingUser = await db.user.findUnique({
        where: {
          id: inputs.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!existingUser) {
        const result: UserDeleteOutputType = {
          success: false,
          message: 'User not found',
          statusCode: 404,
          sessionsDeleted: 0
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.userDeleteResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // User exists, proceed with deletion
      let sessionsDeleted = 0;

      // Delete associated sessions if cascadeDelete is true (default)
      if (inputs.cascadeDelete !== false) {
        ctx.logger.log(`Deleting sessions for user: ${inputs.id}`);
        
        const deletedSessions = await db.session.deleteMany({
          where: {
            userId: inputs.id
          }
        });
        
        sessionsDeleted = deletedSessions.count;
        
        if (sessionsDeleted > 0) {
          ctx.logger.log(`Deleted ${sessionsDeleted} sessions for user: ${inputs.id}`);
        }
      }

      // Delete the user
      const deletedUser = await db.user.delete({
        where: {
          id: inputs.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!deletedUser) {
        throw new Error('Failed to delete user');
      }

      const deletedUserData: DeletedUserType = {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name,
        role: deletedUser.role,
        deletedAt: new Date().toISOString()
      };

      const result: UserDeleteOutputType = {
        success: true,
        deletedUser: deletedUserData,
        message: `User deleted successfully${sessionsDeleted > 0 ? ` (${sessionsDeleted} sessions also deleted)` : ''}`,
        statusCode: 200,
        sessionsDeleted
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.userDeleteResult = result as unknown as ParamsDictionary;
      ctx.vars.deletedUser = deletedUserData as unknown as ParamsDictionary;
      ctx.vars.sessionsDeleted = sessionsDeleted as unknown as ParamsDictionary;

      ctx.logger.log(`User deleted successfully: ${deletedUser.email} (${deletedUser.role})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User delete operation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User delete error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}
