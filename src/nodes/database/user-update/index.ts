import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import * as bcrypt from 'bcryptjs';
import { db } from '../../../../database/config';

type UserUpdateInputType = {
  id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'user';
  emailVerified?: boolean;
  password?: string;
  saltRounds?: number;
};

type UpdatedUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserUpdateOutputType = {
  success: boolean;
  user?: UpdatedUserType;
  message: string;
  statusCode: number;
  fieldsUpdated: string[];
};

export default class UserUpdate extends NanoService<UserUpdateInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "User ID to update"
        },
        email: {
          type: "string",
          format: "email",
          description: "New email address"
        },
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          description: "New user name"
        },
        role: {
          type: "string",
          enum: ["admin", "user"],
          description: "New user role"
        },
        emailVerified: {
          type: "boolean",
          description: "Email verification status"
        },
        password: {
          type: "string",
          minLength: 6,
          description: "New password (will be hashed)"
        },
        saltRounds: {
          type: "number",
          minimum: 10,
          maximum: 15,
          default: 12,
          description: "BCrypt salt rounds for password hashing (default: 12)"
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
          description: "Whether the user was updated successfully"
        },
        user: {
          type: "object",
          description: "Updated user information (only present on success)",
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
          enum: [200, 400, 404, 409, 500]
        },
        fieldsUpdated: {
          type: "array",
          description: "List of fields that were updated",
          items: {
            type: "string",
            enum: ["email", "name", "role", "emailVerified", "password"]
          }
        }
      },
      required: ["success", "message", "statusCode", "fieldsUpdated"]
    };
  }

  async handle(ctx: Context, inputs: UserUpdateInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.id || typeof inputs.id !== 'string') {
        throw new Error('User ID is required and must be a string');
      }

      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: {
          id: inputs.id
        },
        select: {
          id: true,
          email: true
        }
      });

      if (!existingUser) {
        const result: UserUpdateOutputType = {
          success: false,
          message: 'User not found',
          statusCode: 404,
          fieldsUpdated: []
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log(`Updating user: ${inputs.id}`);

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {};
      const fieldsUpdated: string[] = [];

      if (inputs.email !== undefined) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inputs.email)) {
          const result: UserUpdateOutputType = {
            success: false,
            message: 'Invalid email format',
            statusCode: 400,
            fieldsUpdated: []
          };

          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
          
          response.setSuccess(result as unknown as JsonLikeObject);
          return response;
        }

        // Check if email is already taken by another user
        const emailCheck = await db.user.findUnique({
          where: {
            email: inputs.email.toLowerCase()
          },
          select: {
            id: true
          }
        });

        if (emailCheck && emailCheck.id !== inputs.id) {
          const result: UserUpdateOutputType = {
            success: false,
            message: 'Email already taken by another user',
            statusCode: 409,
            fieldsUpdated: []
          };

          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
          
          response.setSuccess(result as unknown as JsonLikeObject);
          return response;
        }

        updateData.email = inputs.email.toLowerCase();
        fieldsUpdated.push('email');
      }

      if (inputs.name !== undefined) {
        if (inputs.name.trim().length < 1) {
          const result: UserUpdateOutputType = {
            success: false,
            message: 'Name cannot be empty',
            statusCode: 400,
            fieldsUpdated: []
          };

          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
          
          response.setSuccess(result as unknown as JsonLikeObject);
          return response;
        }

        updateData.name = inputs.name.trim();
        fieldsUpdated.push('name');
      }

      if (inputs.role !== undefined) {
        updateData.role = inputs.role;
        fieldsUpdated.push('role');
      }

      if (inputs.emailVerified !== undefined) {
        updateData.emailVerified = inputs.emailVerified;
        fieldsUpdated.push('emailVerified');
      }

      if (inputs.password !== undefined) {
        if (inputs.password.length < 6) {
          const result: UserUpdateOutputType = {
            success: false,
            message: 'Password must be at least 6 characters long',
            statusCode: 400,
            fieldsUpdated: []
          };

          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
          
          response.setSuccess(result as unknown as JsonLikeObject);
          return response;
        }

        // Hash the new password
        const saltRounds = inputs.saltRounds || 12;
        const hashedPassword = await bcrypt.hash(inputs.password, saltRounds);
        updateData.password = hashedPassword;
        fieldsUpdated.push('password');
      }

      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        const result: UserUpdateOutputType = {
          success: false,
          message: 'No fields provided to update',
          statusCode: 400,
          fieldsUpdated: []
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Add updated timestamp
      updateData.updatedAt = new Date().toISOString();

      // Perform the update
      const updatedUser = await db.user.update({
        where: {
          id: inputs.id
        },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      const userData: UpdatedUserType = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      };

      const result: UserUpdateOutputType = {
        success: true,
        user: userData,
        message: `User updated successfully (${fieldsUpdated.length} fields)`,
        statusCode: 200,
        fieldsUpdated
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.userUpdateResult = result as unknown as ParamsDictionary;
      ctx.vars.updatedUser = userData as unknown as ParamsDictionary;
      ctx.vars.fieldsUpdated = fieldsUpdated as unknown as ParamsDictionary;

      ctx.logger.log(`User updated: ${updatedUser.email} (fields: ${fieldsUpdated.join(', ')})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User update operation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User update error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}
