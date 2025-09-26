import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from '../../../../database/config';

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

      // Build the where condition
      const where: any = {};
      if (inputs.id && inputs.email) {
        // If both provided, use OR condition
        where.OR = [
          { id: inputs.id },
          { email: inputs.email.toLowerCase() }
        ];
      } else if (inputs.id) {
        where.id = inputs.id;
      } else if (inputs.email) {
        where.email = inputs.email.toLowerCase();
      }

      // Execute the query with conditional field selection
      const user = await db.user.findFirst({
        where,
        select: {
          id: true,
          email: true,
          passwordHash: inputs.includePassword || false,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
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

      // Build the response user object
      const userData: FoundUserType = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };

      // Include password if requested
      if (inputs.includePassword && user.passwordHash) {
        userData.password = user.passwordHash;
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

      ctx.logger.log(`User found: ${user.email} (${user.role})`);
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
