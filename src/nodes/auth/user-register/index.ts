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

type UserRegisterInputType = {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
  saltRounds?: number;
};

type CreatedUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
};

type UserRegisterOutputType = {
  success: boolean;
  user?: CreatedUserType;
  message: string;
  statusCode: number;
};

export default class UserRegister extends NanoService<UserRegisterInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
          description: "User's email address"
        },
        password: {
          type: "string",
          minLength: 6,
          description: "User's password (minimum 6 characters)"
        },
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          description: "User's full name"
        },
        role: {
          type: "string",
          enum: ["admin", "user"],
          default: "user",
          description: "User's role (default: user)"
        },
        saltRounds: {
          type: "number",
          minimum: 10,
          maximum: 15,
          default: 12,
          description: "BCrypt salt rounds (default: 12)"
        }
      },
      required: ["email", "password", "name"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the registration was successful"
        },
        user: {
          type: "object",
          description: "Created user information (only present on success)",
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
            }
          },
          required: ["id", "email", "name", "role", "emailVerified", "createdAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 201, 400, 409, 500]
        }
      },
      required: ["success", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: UserRegisterInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.email || typeof inputs.email !== 'string') {
        throw new Error('Email is required and must be a string');
      }

      if (!inputs.password || typeof inputs.password !== 'string') {
        throw new Error('Password is required and must be a string');
      }

      if (!inputs.name || typeof inputs.name !== 'string') {
        throw new Error('Name is required and must be a string');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputs.email)) {
        const result: UserRegisterOutputType = {
          success: false,
          message: 'Invalid email format',
          statusCode: 400
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.registerResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Password validation
      if (inputs.password.length < 6) {
        const result: UserRegisterOutputType = {
          success: false,
          message: 'Password must be at least 6 characters long',
          statusCode: 400
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.registerResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Name validation
      if (inputs.name.trim().length < 1) {
        const result: UserRegisterOutputType = {
          success: false,
          message: 'Name cannot be empty',
          statusCode: 400
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.registerResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log(`Attempting to register user: ${inputs.email}`);

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: {
          email: inputs.email.toLowerCase()
        },
        select: {
          id: true
        }
      });

      if (existingUser) {
        const result: UserRegisterOutputType = {
          success: false,
          message: 'User with this email already exists',
          statusCode: 409
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.registerResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Hash the password
      const saltRounds = inputs.saltRounds || 12;
      const hashedPassword = await bcrypt.hash(inputs.password, saltRounds);

      // Create new user
      const createdUser = await db.user.create({
        data: {
          email: inputs.email.toLowerCase(),
          passwordHash: hashedPassword,
          name: inputs.name.trim(),
          role: inputs.role === 'admin' ? 'ADMIN' : 'USER',
          emailVerified: false
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true
        }
      });

      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      const userData: CreatedUserType = {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        emailVerified: createdUser.emailVerified,
        createdAt: createdUser.createdAt.toISOString()
      };

      const result: UserRegisterOutputType = {
        success: true,
        user: userData,
        message: 'User registered successfully',
        statusCode: 201
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.registerResult = result as unknown as ParamsDictionary;
      ctx.vars.newUser = userData as unknown as ParamsDictionary;

      ctx.logger.log(`User registered successfully: ${createdUser.email}`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User registration failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User registration error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}