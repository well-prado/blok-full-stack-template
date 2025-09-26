import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

type PasswordValidatorInputType = {
  password: string;
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbidCommonPasswords?: boolean;
  forbidPersonalInfo?: string[];
};

type PasswordValidationResultType = {
  isValid: boolean;
  strength: PasswordStrengthLevel;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  checks: {
    length: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notCommon: boolean;
    notPersonalInfo: boolean;
  };
};

type PasswordValidatorOutputType = {
  success: boolean;
  validation: PasswordValidationResultType;
  message: string;
  statusCode: number;
};

export default class PasswordValidator extends NanoService<PasswordValidatorInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        password: {
          type: "string",
          description: "Password to validate"
        },
        minLength: {
          type: "number",
          minimum: 1,
          maximum: 128,
          default: 8,
          description: "Minimum password length (default: 8)"
        },
        maxLength: {
          type: "number",
          minimum: 8,
          maximum: 256,
          default: 128,
          description: "Maximum password length (default: 128)"
        },
        requireUppercase: {
          type: "boolean",
          default: true,
          description: "Require at least one uppercase letter (default: true)"
        },
        requireLowercase: {
          type: "boolean",
          default: true,
          description: "Require at least one lowercase letter (default: true)"
        },
        requireNumbers: {
          type: "boolean",
          default: true,
          description: "Require at least one number (default: true)"
        },
        requireSpecialChars: {
          type: "boolean",
          default: true,
          description: "Require at least one special character (default: true)"
        },
        forbidCommonPasswords: {
          type: "boolean",
          default: true,
          description: "Forbid common passwords (default: true)"
        },
        forbidPersonalInfo: {
          type: "array",
          items: { type: "string" },
          description: "Array of personal info (name, email, etc.) to forbid in password"
        }
      },
      required: ["password"]
    };

    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the password validation was successful"
        },
        validation: {
          type: "object",
          properties: {
            isValid: {
              type: "boolean",
              description: "Whether the password meets all requirements"
            },
            strength: {
              type: "string",
              enum: ["weak", "fair", "good", "strong", "very-strong"],
              description: "Overall password strength assessment"
            },
            score: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Password strength score (0-100)"
            },
            errors: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of validation errors"
            },
            warnings: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of validation warnings"
            },
            suggestions: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of suggestions to improve the password"
            },
            checks: {
              type: "object",
              properties: {
                length: {
                  type: "boolean",
                  description: "Whether password meets length requirements"
                },
                uppercase: {
                  type: "boolean",
                  description: "Whether password contains uppercase letters"
                },
                lowercase: {
                  type: "boolean",
                  description: "Whether password contains lowercase letters"
                },
                numbers: {
                  type: "boolean",
                  description: "Whether password contains numbers"
                },
                specialChars: {
                  type: "boolean",
                  description: "Whether password contains special characters"
                },
                commonPassword: {
                  type: "boolean",
                  description: "Whether password avoids common passwords"
                },
                personalInfo: {
                  type: "boolean",
                  description: "Whether password avoids personal information"
                }
              },
              required: ["length", "uppercase", "lowercase", "numbers", "specialChars", "commonPassword", "personalInfo"]
            }
          },
          required: ["isValid", "strength", "score", "errors", "warnings", "suggestions", "checks"]
        },
        message: {
          type: "string",
          description: "Human-readable validation result message"
        },
        statusCode: {
          type: "number",
          enum: [200, 400],
          description: "HTTP status code"
        }
      },
      required: ["success", "validation", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: PasswordValidatorInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.password || typeof inputs.password !== 'string') {
        throw new Error('Password is required and must be a string');
      }

      ctx.logger.log('Validating password strength and requirements');

      const validation = this.validatePassword(inputs);

      const result: PasswordValidatorOutputType = {
        success: validation.isValid,
        validation,
        message: validation.isValid 
          ? `Password is ${validation.strength} (score: ${validation.score}/100)`
          : `Password validation failed: ${validation.errors.join(', ')}`,
        statusCode: validation.isValid ? 200 : 400
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.passwordValidation = validation as unknown as ParamsDictionary;
      ctx.vars.isValidPassword = validation.isValid as unknown as ParamsDictionary;
      ctx.vars.passwordStrength = validation.strength as unknown as ParamsDictionary;
      ctx.vars.passwordScore = validation.score as unknown as ParamsDictionary;

      ctx.logger.log(`Password validation: ${validation.strength} (${validation.score}/100) - ${validation.isValid ? 'VALID' : 'INVALID'}`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Password validation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Password validation error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }

  private validatePassword(inputs: PasswordValidatorInputType): PasswordValidationResultType {
    const password = inputs.password;
    const minLength = inputs.minLength || 8;
    const maxLength = inputs.maxLength || 128;
    const requireUppercase = inputs.requireUppercase !== false;
    const requireLowercase = inputs.requireLowercase !== false;
    const requireNumbers = inputs.requireNumbers !== false;
    const requireSpecialChars = inputs.requireSpecialChars !== false;
    const forbidCommonPasswords = inputs.forbidCommonPasswords !== false;
    const forbidPersonalInfo = inputs.forbidPersonalInfo || [];

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Length validation
    const lengthValid = password.length >= minLength && password.length <= maxLength;
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (password.length > maxLength) {
      errors.push(`Password cannot exceed ${maxLength} characters`);
    }

    // Character requirements
    if (requireUppercase && !hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add uppercase letters (A-Z)');
    }

    if (requireLowercase && !hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add lowercase letters (a-z)');
    }

    if (requireNumbers && !hasNumbers) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add numbers (0-9)');
    }

    if (requireSpecialChars && !hasSpecialChars) {
      errors.push('Password must contain at least one special character');
      suggestions.push('Add special characters (!@#$%^&*)');
    }

    // Common password check
    const notCommon = !this.isCommonPassword(password);
    if (forbidCommonPasswords && !notCommon) {
      errors.push('Password is too common');
      suggestions.push('Choose a more unique password');
    }

    // Personal info check
    const notPersonalInfo = !this.containsPersonalInfo(password, forbidPersonalInfo);
    if (!notPersonalInfo) {
      errors.push('Password contains personal information');
      suggestions.push('Avoid using personal information in passwords');
    }

    // Pattern checks (warnings)
    if (this.hasRepeatingChars(password)) {
      warnings.push('Password contains repeating characters');
      suggestions.push('Reduce repeating characters');
    }

    if (this.hasSequentialChars(password)) {
      warnings.push('Password contains sequential characters');
      suggestions.push('Avoid sequential characters (abc, 123)');
    }

    if (this.hasKeyboardPatterns(password)) {
      warnings.push('Password contains keyboard patterns');
      suggestions.push('Avoid keyboard patterns (qwerty, asdf)');
    }

    // Calculate strength score
    let score = 0;
    
    // Length scoring (0-30 points)
    if (password.length >= 12) score += 30;
    else if (password.length >= 10) score += 25;
    else if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;

    // Character diversity (0-40 points)
    if (hasUppercase) score += 10;
    if (hasLowercase) score += 10;
    if (hasNumbers) score += 10;
    if (hasSpecialChars) score += 10;

    // Uniqueness (0-20 points)
    if (notCommon) score += 10;
    if (notPersonalInfo) score += 5;
    if (!this.hasRepeatingChars(password)) score += 5;

    // Complexity bonus (0-10 points)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.8) score += 10;
    else if (uniqueChars >= password.length * 0.6) score += 5;

    // Determine strength level
    let strength: PasswordStrengthLevel;
    if (score >= 90) strength = 'very-strong';
    else if (score >= 70) strength = 'strong';
    else if (score >= 50) strength = 'good';
    else if (score >= 30) strength = 'fair';
    else strength = 'weak';

    const checks = {
      length: lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecialChars,
      notCommon,
      notPersonalInfo
    };

    const isValid = errors.length === 0;

    return {
      isValid,
      strength,
      score,
      errors,
      warnings,
      suggestions,
      checks
    };
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'qwerty123', 'welcome123', 'admin123', 'root', 'toor', 'pass',
      'test', 'guest', 'user', 'login', 'changeme', 'secret'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  private containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    const lowerPassword = password.toLowerCase();
    return personalInfo.some(info => 
      info && info.length >= 3 && lowerPassword.includes(info.toLowerCase())
    );
  }

  private hasRepeatingChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  private hasSequentialChars(password: string): boolean {
    const sequences = ['abc', 'bcd', 'cde', 'def', '123', '234', '345', '456', '789'];
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  private hasKeyboardPatterns(password: string): boolean {
    const patterns = ['qwerty', 'asdf', 'zxcv', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const lowerPassword = password.toLowerCase();
    return patterns.some(pattern => lowerPassword.includes(pattern));
  }
}
