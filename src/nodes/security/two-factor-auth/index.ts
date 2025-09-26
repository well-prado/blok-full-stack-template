import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import crypto from "crypto";
import { db } from "../../../../database/config";

interface InputType {
  action: 'setup' | 'verify' | 'disable' | 'generateBackupCodes' | 'verifyBackupCode';
  userId: string;
  token?: string; // TOTP token or backup code
  secret?: string; // For setup verification
}

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Two-Factor Authentication Node
 * 
 * This node handles TOTP-based two-factor authentication:
 * - Setup 2FA with QR code generation
 * - Verify TOTP tokens
 * - Generate and verify backup codes
 * - Enable/disable 2FA for users
 */
export default class TwoFactorAuth extends NanoService<InputType> {
  /**
   * Initializes a new instance of the TwoFactorAuth class.
   */
  constructor() {
    super();

    this.inputSchema = {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["setup", "verify", "disable", "generateBackupCodes", "verifyBackupCode"],
          description: "2FA action to perform"
        },
        userId: {
          type: "string",
          description: "User ID"
        },
        token: {
          type: "string",
          description: "TOTP token or backup code"
        },
        secret: {
          type: "string",
          description: "TOTP secret for setup verification"
        }
      },
      required: ["action", "userId"]
    };

    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      oneOf: [
        {
          // setup response
          properties: {
            success: {
              type: "boolean",
              description: "Whether 2FA setup was successful"
            },
            message: {
              type: "string",
              description: "Setup result message"
            },
            data: {
              type: "object",
              properties: {
                secret: {
                  type: "string",
                  description: "TOTP secret key for the user"
                },
                qrCodeUrl: {
                  type: "string",
                  description: "QR code URL for authenticator app setup"
                },
                backupCodes: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "One-time backup codes for account recovery"
                },
                setupComplete: {
                  type: "boolean",
                  description: "Whether the setup process is complete"
                }
              },
              required: ["secret", "qrCodeUrl", "backupCodes", "setupComplete"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // verify response
          properties: {
            success: {
              type: "boolean",
              description: "Whether 2FA verification was successful"
            },
            message: {
              type: "string",
              description: "Verification result message"
            },
            data: {
              type: "object",
              properties: {
                verified: {
                  type: "boolean",
                  description: "Whether the token was valid"
                },
                enabled: {
                  type: "boolean",
                  description: "Whether 2FA is now enabled for the user"
                },
                userId: {
                  type: "string",
                  description: "ID of the user"
                }
              },
              required: ["verified", "enabled", "userId"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // disable response
          properties: {
            success: {
              type: "boolean",
              description: "Whether 2FA was successfully disabled"
            },
            message: {
              type: "string",
              description: "Disable result message"
            },
            data: {
              type: "object",
              properties: {
                disabled: {
                  type: "boolean",
                  description: "Whether 2FA is now disabled"
                },
                userId: {
                  type: "string",
                  description: "ID of the user"
                }
              },
              required: ["disabled", "userId"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // generateBackupCodes response
          properties: {
            success: {
              type: "boolean",
              description: "Whether backup codes were generated successfully"
            },
            message: {
              type: "string",
              description: "Generation result message"
            },
            data: {
              type: "object",
              properties: {
                backupCodes: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "New backup codes for account recovery"
                },
                userId: {
                  type: "string",
                  description: "ID of the user"
                }
              },
              required: ["backupCodes", "userId"]
            }
          },
          required: ["success", "message", "data"]
        },
        {
          // verifyBackupCode response
          properties: {
            success: {
              type: "boolean",
              description: "Whether backup code verification was successful"
            },
            message: {
              type: "string",
              description: "Verification result message"
            },
            data: {
              type: "object",
              properties: {
                verified: {
                  type: "boolean",
                  description: "Whether the backup code was valid"
                },
                codesRemaining: {
                  type: "number",
                  description: "Number of backup codes remaining"
                },
                userId: {
                  type: "string",
                  description: "ID of the user"
                }
              },
              required: ["verified", "codesRemaining", "userId"]
            }
          },
          required: ["success", "message", "data"]
        }
      ]
    };
  }

  /**
   * Handles the 2FA request
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response: NanoServiceResponse = new NanoServiceResponse();

    try {
      // Get user
      const user = await this.getUser(inputs.userId);
      if (!user) {
        throw new Error("User not found");
      }

      let result;
      switch (inputs.action) {
        case 'setup':
          result = await this.setup2FA(user);
          break;
        case 'verify':
          result = await this.verify2FA(user, inputs.token, inputs.secret);
          break;
        case 'disable':
          result = await this.disable2FA(user);
          break;
        case 'generateBackupCodes':
          result = await this.generateBackupCodes(user);
          break;
        case 'verifyBackupCode':
          result = await this.verifyBackupCode(user, inputs.token);
          break;
        default:
          throw new Error(`Unsupported action: ${inputs.action}`);
      }

      response.setSuccess({
        success: true,
        message: "2FA operation completed successfully",
        data: result as any
      });

    } catch (error: unknown) {
      const nodeError: GlobalError = new GlobalError((error as Error).message);
      nodeError.setCode(400);
      nodeError.setStack((error as Error).stack);
      nodeError.setName("two-factor-auth");
      response.setError(nodeError);
    }

    return response;
  }

  /**
   * Get user by ID
   */
  private async getUser(userId: string) {
    const user = await db.user.findUnique({
      where: {
        id: userId
      }
    });

    return user;
  }

  /**
   * Setup 2FA for a user
   */
  private async setup2FA(user: any): Promise<TwoFactorSetup> {
    // Generate a random secret
    const secret = this.generateSecret();
    
    // Generate QR code URL (in a real implementation, you'd use a proper TOTP library)
    const qrCodeUrl = this.generateQRCodeUrl(user.email, secret);
    
    // Generate backup codes
    const backupCodes = this.createBackupCodes();

    // Store the secret temporarily (not enabled until verified)
    await db.user.update({
      where: { id: user.id },
      data: { 
        twoFactorSecret: secret,
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date()
      }
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify 2FA setup or login token
   */
  private async verify2FA(user: any, token?: string, secret?: string) {
    if (!token) {
      throw new Error("TOTP token is required");
    }

    // Use provided secret or user's stored secret
    const totpSecret = secret || user.twoFactorSecret;
    if (!totpSecret) {
      throw new Error("2FA not set up for this user");
    }

    // Verify TOTP token (simplified - in production use a proper TOTP library)
    const isValid = this.verifyTOTP(token, totpSecret);
    
    if (!isValid) {
      throw new Error("Invalid 2FA token");
    }

    // If this is setup verification, enable 2FA
    if (secret && !user.twoFactorEnabled) {
      await db.user.update({
        where: { id: user.id },
        data: { 
          twoFactorEnabled: true,
          updatedAt: new Date()
        }
      });

      return {
        enabled: true,
        message: "2FA has been successfully enabled"
      };
    }

    return {
      verified: true,
      message: "2FA token verified successfully"
    };
  }

  /**
   * Disable 2FA for a user
   */
  private async disable2FA(user: any) {
    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled for this user");
    }

    await db.user.update({
      where: { id: user.id },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        updatedAt: new Date()
      }
    });

    return {
      disabled: true,
      message: "2FA has been successfully disabled"
    };
  }

  /**
   * Generate new backup codes for user
   */
  private async generateBackupCodes(user: any) {
    if (!user.twoFactorEnabled) {
      throw new Error("2FA must be enabled to generate backup codes");
    }

    const backupCodes = this.createBackupCodes();

    await db.user.update({
      where: { id: user.id },
      data: { 
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date()
      }
    });

    return {
      backupCodes,
      message: "New backup codes generated successfully"
    };
  }

  /**
   * Verify a backup code
   */
  private async verifyBackupCode(user: any, backupCode?: string) {
    if (!backupCode) {
      throw new Error("Backup code is required");
    }

    if (!user.twoFactorEnabled || !user.backupCodes) {
      throw new Error("2FA or backup codes not set up for this user");
    }

    const backupCodes = JSON.parse(user.backupCodes);
    const codeIndex = backupCodes.indexOf(backupCode);

    if (codeIndex === -1) {
      throw new Error("Invalid backup code");
    }

    // Remove the used backup code
    backupCodes.splice(codeIndex, 1);

    await db.user.update({
      where: { id: user.id },
      data: { 
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date()
      }
    });

    return {
      verified: true,
      remainingCodes: backupCodes.length,
      message: "Backup code verified successfully"
    };
  }

  /**
   * Generate a random secret for TOTP
   */
  private generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate QR code URL for TOTP setup
   */
  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = "Blok Admin";
    const label = `${issuer}:${email}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  /**
   * Create backup codes array
   */
  private createBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString().slice(2, 10);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify TOTP token (simplified implementation)
   * In production, use a proper TOTP library like 'speakeasy'
   */
  private verifyTOTP(token: string, secret: string): boolean {
    // This is a simplified mock implementation
    // In production, implement proper TOTP verification
    const currentTime = Math.floor(Date.now() / 30000);
    const expectedToken = this.generateTOTP(secret, currentTime);
    
    // Also check previous and next time windows for clock skew
    const prevToken = this.generateTOTP(secret, currentTime - 1);
    const nextToken = this.generateTOTP(secret, currentTime + 1);
    
    return token === expectedToken || token === prevToken || token === nextToken;
  }

  /**
   * Generate TOTP token (simplified implementation)
   */
  private generateTOTP(secret: string, timeStep: number): string {
    // This is a mock implementation
    // In production, implement proper TOTP generation using HMAC-SHA1
    const hash = crypto.createHash('sha1').update(secret + timeStep.toString()).digest('hex');
    return (parseInt(hash.slice(0, 6), 16) % 1000000).toString().padStart(6, '0');
  }
}
