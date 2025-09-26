import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { eq, or } from 'drizzle-orm';
import { db } from '../../../../database/config';
import { users } from '../../../../database/schemas';

type UserFindInputType = {
  id?: string;
  email?: string;
  includePassword?: boolean;
};

type FoundUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string; // Only included if includePassword is true
};

type UserFindOutputType = {
  success: boolean;
  user?: FoundUserType;
  message: string;
  statusCode: number;
};

export default class UserFind extends NanoService<UserFindInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "User ID to find"
        },
        email: {
          type: "string",
          format: "email",
          description: "User email to find"
        },
        includePassword: {
          type: "boolean",
          default: false,
          description: "Whether to include password hash in response (default: false)"
        }
      },
      anyOf: [
        { required: ["id"] },
        { required: ["email"] }
      ]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the user was found successfully"
        },
        user: {
          type: "object",
          description: "Found user information (only present if user exists)",
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
            emailVerified: {
              type: "boolean",
              description: "Whether user's email is verified"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            },
            password: {
              type: "string",
              description: "Password hash (only included if includePassword is true)"
            }
          },
          required: ["id", "email", "name", "role", "emailVerified", "createdAt", "updatedAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 400, 404, 500]
        }
      },
      required: ["success", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: UserFindInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs - at least one identifier must be provided
      if (!inputs.id && !inputs.email) {
        const result: UserFindOutputType = {
          success: false,
          message: 'Either id or email must be provided',
          statusCode: 400
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.userFindResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log(`Finding user by ${inputs.id ? 'ID: ' + inputs.id : 'email: ' + inputs.email}`);

      // Build the query conditions
      const conditions = [];
      if (inputs.id) {
        conditions.push(eq(users.id, inputs.id));
      }
      if (inputs.email) {
        conditions.push(eq(users.email, inputs.email.toLowerCase()));
      }

      // Execute the query with conditional field selection
      const userResult = inputs.includePassword 
        ? await db
            .select({
              id: users.id,
              email: users.email,
              passwordHash: users.passwordHash,
              name: users.name,
              role: users.role,
              emailVerified: users.emailVerified,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt
            })
            .from(users)
            .where(conditions.length === 1 ? conditions[0] : or(...conditions))
            .limit(1)
        : await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              role: users.role,
              emailVerified: users.emailVerified,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt
            })
            .from(users)
            .where(conditions.length === 1 ? conditions[0] : or(...conditions))
            .limit(1);

      if (userResult.length === 0) {
        const result: UserFindOutputType = {
          success: false,
          message: 'User not found',
          statusCode: 404
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.userFindResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      const foundUser = userResult[0];

      // Build the response user object
      const userData: FoundUserType = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        emailVerified: foundUser.emailVerified,
        createdAt: foundUser.createdAt,
        updatedAt: foundUser.updatedAt
      };

      // Include password if requested
      if (inputs.includePassword && 'password' in foundUser) {
        userData.password = foundUser.password as string;
      }

      const result: UserFindOutputType = {
        success: true,
        user: userData,
        message: 'User found successfully',
        statusCode: 200
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.userFindResult = result as unknown as ParamsDictionary;
      ctx.vars.foundUser = userData as unknown as ParamsDictionary;

      ctx.logger.log(`User found: ${foundUser.email} (${foundUser.role})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User find operation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User find error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}
