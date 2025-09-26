import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { db } from '../../../../database/config';
import { users, sessions, type NewSession } from '../../../../database/schemas';

type UserLoginInputType = {
  email: string;
  password: string;
  sessionDurationHours?: number; // Default: 1 hour
};

type LoggedInUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  profileImage: string | null;
  preferences: Record<string, any>;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreatedSessionType = {
  id: string;
  token: string;
  expiresAt: string;
};

type UserLoginOutputType = {
  success: boolean;
  user?: LoggedInUserType;
  session?: CreatedSessionType;
  message: string;
  statusCode: number;
};

export default class UserLogin extends NanoService<UserLoginInputType> {
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
          minLength: 1,
          description: "User's password"
        },
        sessionDurationHours: {
          type: "number",
          minimum: 1,
          maximum: 168, // 7 days max
          default: 1,
          description: "Session duration in hours (default: 1)"
        }
      },
      required: ["email", "password"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the login was successful"
        },
        user: {
          type: "object",
          description: "Logged in user information (only present on success)",
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
            }
          },
          required: ["id", "email", "name", "role", "emailVerified"]
        },
        session: {
          type: "object",
          description: "Created session information (only present on success)",
          properties: {
            id: {
              type: "string",
              description: "Unique session identifier"
            },
            token: {
              type: "string",
              description: "JWT session token"
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Session expiration timestamp"
            }
          },
          required: ["id", "token", "expiresAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 400, 401, 500]
        }
      },
      required: ["success", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: UserLoginInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.email || typeof inputs.email !== 'string') {
        throw new Error('Email is required and must be a string');
      }

      if (!inputs.password || typeof inputs.password !== 'string') {
        throw new Error('Password is required and must be a string');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputs.email)) {
        const result: UserLoginOutputType = {
          success: false,
          message: 'Invalid email format',
          statusCode: 400
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.loginResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log(`Attempting login for user: ${inputs.email}`);

      // Find user by email - get ALL user fields
      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
          profileImage: users.profileImage,
          preferences: users.preferences,
          twoFactorEnabled: users.twoFactorEnabled,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.email, inputs.email.toLowerCase()))
        .limit(1);

      if (userResult.length === 0) {
        const result: UserLoginOutputType = {
          success: false,
          message: 'Invalid email or password',
          statusCode: 401
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.loginResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      const user = userResult[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(inputs.password, user.passwordHash);

      if (!isPasswordValid) {
        const result: UserLoginOutputType = {
          success: false,
          message: 'Invalid email or password',
          statusCode: 401
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.loginResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Generate session token (using crypto.randomUUID + timestamp for uniqueness)
      const sessionToken = `${crypto.randomUUID()}-${Date.now()}`;
      
      // Calculate session expiration
      const sessionDurationHours = inputs.sessionDurationHours || 1;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + sessionDurationHours);

      // Create session
      const newSession: NewSession = {
        userId: user.id,
        token: sessionToken,
        expiresAt: expiresAt.toISOString()
      };

      const sessionResult = await db.insert(sessions).values(newSession).returning({
        id: sessions.id,
        token: sessions.token,
        expiresAt: sessions.expiresAt
      });

      if (sessionResult.length === 0) {
        throw new Error('Failed to create session');
      }

      const createdSession = sessionResult[0];

      // Parse preferences JSON if it exists
      let parsedPreferences = {};
      if (user.preferences) {
        try {
          parsedPreferences = JSON.parse(user.preferences);
        } catch (e) {
          console.warn('Failed to parse user preferences during login:', e);
          parsedPreferences = {};
        }
      }

      const userData: LoggedInUserType = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        profileImage: user.profileImage,
        preferences: parsedPreferences,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const sessionData: CreatedSessionType = {
        id: createdSession.id,
        token: createdSession.token,
        expiresAt: createdSession.expiresAt
      };

      const result: UserLoginOutputType = {
        success: true,
        user: userData,
        session: sessionData,
        message: 'Login successful',
        statusCode: 200
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.loginResult = result as unknown as ParamsDictionary;
      ctx.vars.currentUser = userData as unknown as ParamsDictionary;
      ctx.vars.currentSession = sessionData as unknown as ParamsDictionary;

      // Set HTTP-only session cookie via context response
      const cookieExpires = new Date(expiresAt.getTime()).toUTCString();
      const sessionCookie = `blok_session_token=${sessionToken}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Expires=${cookieExpires}`;
      
      // Store cookie information in context for HttpTrigger to set
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.setCookieHeader = sessionCookie as unknown as ParamsDictionary;

      ctx.logger.log(`User logged in successfully: ${user.email} (session expires: ${expiresAt.toISOString()})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User login failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User login error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}