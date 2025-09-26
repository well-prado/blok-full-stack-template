import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from '../../../../database/config';

type UserLogoutInputType = {
  sessionToken?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  logoutAll?: boolean; // Logout from all sessions
  userId?: string; // Required if logoutAll is true
};

type UserLogoutOutputType = {
  success: boolean;
  message: string;
  statusCode: number;
  sessionsDestroyed: number;
};

export default class UserLogout extends NanoService<UserLogoutInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        sessionToken: {
          type: "string",
          description: "Session token to logout (optional if headers/cookies provided)"
        },
        headers: {
          type: "object",
          description: "Request headers"
        },
        cookies: {
          type: "object",
          description: "Request cookies (to extract session cookie)"
        },
        logoutAll: {
          type: "boolean",
          default: false,
          description: "Logout from all sessions (requires userId)"
        },
        userId: {
          type: "string",
          description: "User ID (required if logoutAll is true)"
        }
      }
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the logout was successful"
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 400, 401, 500]
        },
        sessionsDestroyed: {
          type: "number",
          minimum: 0,
          description: "Number of sessions destroyed"
        }
      },
      required: ["success", "message", "statusCode", "sessionsDestroyed"]
    };
  }

  async handle(ctx: Context, inputs: UserLogoutInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      let sessionToken: string | undefined = inputs.sessionToken;
      let sessionsDestroyed = 0;

      // If logoutAll is true, logout from all user sessions
      if (inputs.logoutAll) {
        if (!inputs.userId) {
          const result: UserLogoutOutputType = {
            success: false,
            message: 'User ID is required for logout all sessions',
            statusCode: 400,
            sessionsDestroyed: 0
          };

          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.logoutResult = result as unknown as ParamsDictionary;
          
          response.setSuccess(result as unknown as JsonLikeObject);
          return response;
        }

        ctx.logger.log(`Logging out all sessions for user: ${inputs.userId}`);

        // Delete all sessions for the user
        const deleteResult = await db.session.deleteMany({
          where: {
            userId: inputs.userId
          }
        });

        sessionsDestroyed = deleteResult.count;

        const result: UserLogoutOutputType = {
          success: true,
          message: `Logged out from ${sessionsDestroyed} sessions`,
          statusCode: 200,
          sessionsDestroyed
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.logoutResult = result as unknown as ParamsDictionary;
        ctx.vars.sessionsDestroyed = sessionsDestroyed as unknown as ParamsDictionary;

        ctx.logger.log(`All sessions destroyed for user: ${inputs.userId} (${sessionsDestroyed} sessions)`);
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      // Extract session token if not provided directly
      if (!sessionToken) {
        // Get from cookies only
        if (inputs.cookies && inputs.cookies.blok_session_token) {
          sessionToken = inputs.cookies.blok_session_token;
        }
      }

      if (!sessionToken) {
        const result: UserLogoutOutputType = {
          success: false,
          message: 'No session token provided',
          statusCode: 400,
          sessionsDestroyed: 0
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.logoutResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      ctx.logger.log('Attempting to logout session');

      // Find and delete the specific session
      const deletedSession = await db.session.delete({
        where: {
          token: sessionToken
        },
        select: {
          id: true,
          userId: true
        }
      });

      if (!deletedSession) {
        const result: UserLogoutOutputType = {
          success: false,
          message: 'Session not found or already expired',
          statusCode: 404,
          sessionsDestroyed: 0
        };

        if (ctx.vars === undefined) ctx.vars = {};
        ctx.vars.logoutResult = result as unknown as ParamsDictionary;
        
        response.setSuccess(result as unknown as JsonLikeObject);
        return response;
      }

      sessionsDestroyed = 1;

      const result: UserLogoutOutputType = {
        success: true,
        message: 'Logout successful',
        statusCode: 200,
        sessionsDestroyed
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.logoutResult = result as unknown as ParamsDictionary;
      ctx.vars.sessionsDestroyed = sessionsDestroyed as unknown as ParamsDictionary;
      ctx.vars.loggedOutUserId = deletedSession.userId as unknown as ParamsDictionary;

      // Clear session cookie by setting expired cookie
      const expiredCookie = `blok_session_token=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      ctx.vars.setCookieHeader = expiredCookie as unknown as ParamsDictionary;

      ctx.logger.log(`Session destroyed successfully for user: ${deletedSession.userId}`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User logout failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User logout error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}