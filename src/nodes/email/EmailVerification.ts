import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
  type JsonLikeObject,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import crypto from "crypto";

interface EmailVerificationInput {
  operation: "generate" | "verify" | "resend";
  userId?: string;
  email?: string;
  token?: string;
  expirationHours?: number;
}

interface VerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  verified: boolean;
}

/**
 * Email Verification Node
 * 
 * Handles email verification token generation, verification, and management.
 * Works with the EmailServiceManager to send verification emails.
 */
export default class EmailVerification extends NanoService<EmailVerificationInput> {
  // In a real implementation, this would be stored in a database
  private static verificationTokens = new Map<string, VerificationToken>();

  constructor() {
    super();

    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["generate", "verify", "resend"],
          description: "Verification operation to perform",
        },
        userId: {
          type: "string",
          description: "User ID for verification",
        },
        email: {
          type: "string",
          format: "email",
          description: "Email address to verify",
        },
        token: {
          type: "string",
          description: "Verification token",
        },
        expirationHours: {
          type: "number",
          minimum: 1,
          maximum: 168, // 1 week max
          default: 24,
          description: "Token expiration time in hours",
        },
      },
      required: ["operation"],
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      oneOf: [
        {
          // Generate operation response
          properties: {
            success: {
              type: "boolean",
              const: true,
              description: "Whether the token was generated successfully"
            },
            message: {
              type: "string",
              const: "Verification token generated successfully",
              description: "Success message"
            },
            token: {
              type: "string",
              description: "Generated verification token"
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Token expiration timestamp"
            }
          },
          required: ["success", "message", "token", "expiresAt"]
        },
        {
          // Verify operation response
          properties: {
            success: {
              type: "boolean",
              const: true,
              description: "Whether the verification was processed"
            },
            message: {
              type: "string",
              enum: ["Email verified successfully", "Invalid or expired token"],
              description: "Verification result message"
            },
            valid: {
              type: "boolean",
              description: "Whether the token is valid"
            },
            userId: {
              type: "string",
              description: "User ID associated with the token"
            },
            email: {
              type: "string",
              format: "email",
              description: "Email address that was verified"
            }
          },
          required: ["success", "message", "valid"]
        },
        {
          // Resend operation response
          properties: {
            success: {
              type: "boolean",
              const: true,
              description: "Whether the verification email was resent"
            },
            message: {
              type: "string",
              const: "Verification email resent successfully",
              description: "Success message"
            },
            token: {
              type: "string",
              description: "New verification token"
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Token expiration timestamp"
            },
            emailSent: {
              type: "boolean",
              description: "Whether the email was sent successfully"
            }
          },
          required: ["success", "message", "token", "expiresAt", "emailSent"]
        }
      ]
    };
  }

  async handle(
    ctx: Context,
    inputs: EmailVerificationInput
  ): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      switch (inputs.operation) {
        case "generate":
          const generateResult = await this.generateVerificationToken(
            inputs.userId!,
            inputs.email!,
            inputs.expirationHours || 24
          );
          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.verificationToken = generateResult as unknown as ParamsDictionary;
          response.setSuccess({
            success: true,
            message: "Verification token generated successfully",
            token: generateResult.token,
            expiresAt: generateResult.expiresAt,
          } as unknown as JsonLikeObject);
          break;

        case "verify":
          const verifyResult = await this.verifyToken(inputs.token!);
          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.verificationResult = verifyResult as unknown as ParamsDictionary;
          response.setSuccess({
            success: true,
            message: verifyResult.valid ? "Email verified successfully" : "Invalid or expired token",
            valid: verifyResult.valid,
            userId: verifyResult.userId,
            email: verifyResult.email,
          } as unknown as JsonLikeObject);
          break;

        case "resend":
          const resendResult = await this.resendVerification(
            inputs.userId!,
            inputs.email!,
            inputs.expirationHours || 24
          );
          if (ctx.vars === undefined) ctx.vars = {};
          ctx.vars.resendResult = resendResult as unknown as ParamsDictionary;
          response.setSuccess({
            success: true,
            message: "Verification email resent successfully",
            token: resendResult.token,
            expiresAt: resendResult.expiresAt,
          } as unknown as JsonLikeObject);
          break;

        default:
          throw new Error(`Unsupported operation: ${inputs.operation}`);
      }
    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Email verification operation failed"
      );
      nodeError.setCode(400);
      response.setError(nodeError);
    }

    return response;
  }

  private async generateVerificationToken(
    userId: string,
    email: string,
    expirationHours: number
  ): Promise<VerificationToken> {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const verificationToken: VerificationToken = {
      token,
      userId,
      email,
      expiresAt,
      createdAt: new Date(),
      verified: false,
    };

    // Store token (in real implementation, this would be in a database)
    EmailVerification.verificationTokens.set(token, verificationToken);

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return verificationToken;
  }

  private async verifyToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
    message?: string;
  }> {
    const verificationToken = EmailVerification.verificationTokens.get(token);

    if (!verificationToken) {
      return {
        valid: false,
        message: "Invalid verification token",
      };
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      // Remove expired token
      EmailVerification.verificationTokens.delete(token);
      return {
        valid: false,
        message: "Verification token has expired",
      };
    }

    // Check if already verified
    if (verificationToken.verified) {
      return {
        valid: false,
        message: "Token has already been used",
      };
    }

    // Mark as verified
    verificationToken.verified = true;
    EmailVerification.verificationTokens.set(token, verificationToken);

    return {
      valid: true,
      userId: verificationToken.userId,
      email: verificationToken.email,
      message: "Email verified successfully",
    };
  }

  private async resendVerification(
    userId: string,
    email: string,
    expirationHours: number
  ): Promise<VerificationToken> {
    // Invalidate existing tokens for this user
    this.invalidateUserTokens(userId, email);

    // Generate new token
    return await this.generateVerificationToken(userId, email, expirationHours);
  }

  private invalidateUserTokens(userId: string, email: string): void {
    const tokensToDelete: string[] = [];

    for (const [token, verificationToken] of EmailVerification.verificationTokens) {
      if (verificationToken.userId === userId && verificationToken.email === email) {
        tokensToDelete.push(token);
      }
    }

    tokensToDelete.forEach(token => {
      EmailVerification.verificationTokens.delete(token);
    });
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    const tokensToDelete: string[] = [];

    for (const [token, verificationToken] of EmailVerification.verificationTokens) {
      if (now > verificationToken.expiresAt) {
        tokensToDelete.push(token);
      }
    }

    tokensToDelete.forEach(token => {
      EmailVerification.verificationTokens.delete(token);
    });
  }

  // Utility method to get verification URL
  public static generateVerificationUrl(baseUrl: string, token: string): string {
    return `${baseUrl}/verify-email?token=${token}`;
  }

  // Utility method to get all active tokens for a user (for testing/admin purposes)
  public static getUserTokens(userId: string): VerificationToken[] {
    const userTokens: VerificationToken[] = [];
    const now = new Date();

    for (const verificationToken of EmailVerification.verificationTokens.values()) {
      if (
        verificationToken.userId === userId &&
        now <= verificationToken.expiresAt &&
        !verificationToken.verified
      ) {
        userTokens.push(verificationToken);
      }
    }

    return userTokens;
  }

  // Method to get token statistics (for admin dashboard)
  public static getTokenStatistics(): {
    total: number;
    active: number;
    expired: number;
    verified: number;
  } {
    const now = new Date();
    let active = 0;
    let expired = 0;
    let verified = 0;

    for (const token of EmailVerification.verificationTokens.values()) {
      if (token.verified) {
        verified++;
      } else if (now > token.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: EmailVerification.verificationTokens.size,
      active,
      expired,
      verified,
    };
  }
}
