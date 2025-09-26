import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { eq } from 'drizzle-orm';
import { db } from '../../../../database/config';
import { sessions, users } from '../../../../database/schemas';

type AuthenticationCheckerInputType = {
  requireAuth: boolean;
  requestMethod: string;
  requestPath: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  sessionDurationHours?: number; // Default: 1 hour
};

type UserDataType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
};

type SessionDataType = {
  id: string;
  expiresAt: string;
};

type AuthenticationCheckerOutputType = {
  isAuthenticated: boolean;
  user?: UserDataType;
  session?: SessionDataType;
  message: string;
  statusCode: number;
};

export default class AuthenticationChecker extends NanoService<AuthenticationCheckerInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        requireAuth: {
          type: "boolean",
          description: "Whether authentication is required for this request"
        },
        requestMethod: {
          type: "string",
          description: "HTTP method of the request"
        },
        requestPath: {
          type: "string",
          description: "Path of the request"
        },
        headers: {
          type: "object",
          description: "Request headers"
        },
        cookies: {
          type: "object",
          description: "Request cookies"
        },
        sessionDurationHours: {
          type: "number",
          minimum: 1,
          maximum: 168, // 7 days max
          default: 1,
          description: "Session duration in hours (default: 1)"
        }
      },
      required: ["requireAuth", "requestMethod", "requestPath", "headers", "cookies"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        isAuthenticated: {
          type: "boolean",
          description: "Whether the user is authenticated"
        },
        user: {
          type: "object",
          description: "Authenticated user information (only present if authenticated)",
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
          description: "Session information (only present if authenticated)",
          properties: {
            id: {
              type: "string",
              description: "Unique session identifier"
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Session expiration timestamp"
            }
          },
          required: ["id", "expiresAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 401, 500]
        }
      },
      required: ["isAuthenticated", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: AuthenticationCheckerInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      ctx.logger.log(`Authentication check for ${inputs.requestMethod} ${inputs.requestPath}`);

      // If authentication is not required, allow the request
      if (!inputs.requireAuth) {
        const result: AuthenticationCheckerOutputType = {
          isAuthenticated: false,
          message: 'Authentication not required for this endpoint',
          statusCode: 200
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.authResult = result as unknown as ParamsDictionary;
        ctx.vars.isAuthenticated = false as unknown as ParamsDictionary;

        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Extract session token from cookies only
      let sessionToken: string | undefined;

      // Get session token from cookies (blok_session_token)
      if (inputs.cookies && inputs.cookies.blok_session_token) {
        sessionToken = inputs.cookies.blok_session_token;
      }

      if (!sessionToken) {
        const result: AuthenticationCheckerOutputType = {
          isAuthenticated: false,
          message: 'No session token provided',
          statusCode: 401
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.authResult = result as unknown as ParamsDictionary;
        ctx.vars.isAuthenticated = false as unknown as ParamsDictionary;

        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log('Session token found, verifying...');

      // Look up the session in the database
      const sessionResult = await db
        .select({
          sessionId: sessions.id,
          sessionToken: sessions.token,
          sessionExpiresAt: sessions.expiresAt,
          sessionCreatedAt: sessions.createdAt,
          userId: users.id,
          userEmail: users.email,
          userName: users.name,
          userRole: users.role,
          userEmailVerified: users.emailVerified,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.token, sessionToken))
        .limit(1);

      if (sessionResult.length === 0) {
        const result: AuthenticationCheckerOutputType = {
          isAuthenticated: false,
          message: 'Invalid session token',
          statusCode: 401
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.authResult = result as unknown as ParamsDictionary;
        ctx.vars.isAuthenticated = false as unknown as ParamsDictionary;

        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      const sessionData = sessionResult[0];

      // Check if session has expired
      const now = new Date();
      const expiresAt = new Date(sessionData.sessionExpiresAt);

      if (now > expiresAt) {
        ctx.logger.log('Session expired, cleaning up...');

        // Delete expired session
        await db.delete(sessions).where(eq(sessions.id, sessionData.sessionId));

        const result: AuthenticationCheckerOutputType = {
          isAuthenticated: false,
          message: 'Session has expired',
          statusCode: 401
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.authResult = result as unknown as ParamsDictionary;
        ctx.vars.isAuthenticated = false as unknown as ParamsDictionary;

        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Session is valid!
      const userData: UserDataType = {
        id: sessionData.userId,
        email: sessionData.userEmail,
        name: sessionData.userName,
        role: sessionData.userRole,
        emailVerified: sessionData.userEmailVerified
      };

      const sessionInfo: SessionDataType = {
        id: sessionData.sessionId,
        expiresAt: sessionData.sessionExpiresAt
      };

      const result: AuthenticationCheckerOutputType = {
        isAuthenticated: true,
        user: userData,
        session: sessionInfo,
        message: 'Authentication successful',
        statusCode: 200
      };

      // Store authentication data in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.authResult = result as unknown as ParamsDictionary;
      ctx.vars.isAuthenticated = true as unknown as ParamsDictionary;
      ctx.vars.currentUser = userData as unknown as ParamsDictionary;
      ctx.vars.currentSession = sessionInfo as unknown as ParamsDictionary;

      ctx.logger.log(`User authenticated: ${userData.email} (${userData.role})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Authentication check failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Authentication check error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}