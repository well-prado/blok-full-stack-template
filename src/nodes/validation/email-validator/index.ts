import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type EmailValidatorInputType = {
  email: string;
  checkDomain?: boolean;
  allowDisposable?: boolean;
};

type EmailValidationResultType = {
  isValid: boolean;
  email: string;
  normalizedEmail: string;
  errors: string[];
  details: {
    hasValidFormat: boolean;
    hasValidDomain: boolean;
    isDisposable: boolean;
    localPart: string;
    domain: string;
  };
};

type EmailValidatorOutputType = {
  success: boolean;
  validation: EmailValidationResultType;
  message: string;
  statusCode: number;
};

export default class EmailValidator extends NanoService<EmailValidatorInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to validate"
        },
        checkDomain: {
          type: "boolean",
          default: true,
          description: "Whether to validate domain format (default: true)"
        },
        allowDisposable: {
          type: "boolean",
          default: false,
          description: "Whether to allow disposable email domains (default: false)"
        }
      },
      required: ["email"]
    };

    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the email validation was successful"
        },
        validation: {
          type: "object",
          properties: {
            isValid: {
              type: "boolean",
              description: "Whether the email address is valid"
            },
            email: {
              type: "string",
              description: "The validated email address"
            },
            normalizedEmail: {
              type: "string",
              description: "The normalized version of the email address"
            },
            domain: {
              type: "string",
              description: "The domain part of the email address"
            },
            localPart: {
              type: "string",
              description: "The local part (before @) of the email address"
            },
            checks: {
              type: "object",
              properties: {
                format: {
                  type: "boolean",
                  description: "Whether the email format is valid"
                },
                domain: {
                  type: "boolean",
                  description: "Whether the domain format is valid"
                },
                disposable: {
                  type: "boolean",
                  description: "Whether the email uses a disposable domain"
                },
                mx: {
                  type: "boolean",
                  description: "Whether the domain has valid MX records"
                }
              },
              required: ["format", "domain", "disposable", "mx"]
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
            }
          },
          required: ["isValid", "email", "normalizedEmail", "domain", "localPart", "checks", "errors", "warnings"]
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

  async handle(ctx: Context, inputs: EmailValidatorInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.email || typeof inputs.email !== 'string') {
        throw new Error('Email is required and must be a string');
      }

      ctx.logger.log(`Validating email: ${inputs.email}`);

      const validation = this.validateEmail(inputs.email, inputs.checkDomain !== false, inputs.allowDisposable === true);

      const result: EmailValidatorOutputType = {
        success: validation.isValid,
        validation,
        message: validation.isValid ? 'Email is valid' : `Email validation failed: ${validation.errors.join(', ')}`,
        statusCode: validation.isValid ? 200 : 400
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.emailValidation = validation as unknown as ParamsDictionary;
      ctx.vars.isValidEmail = validation.isValid as unknown as ParamsDictionary;
      ctx.vars.normalizedEmail = validation.normalizedEmail as unknown as ParamsDictionary;

      ctx.logger.log(`Email validation result: ${validation.isValid ? 'VALID' : 'INVALID'} - ${validation.errors.join(', ') || 'No errors'}`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Email validation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Email validation error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }

  private validateEmail(email: string, checkDomain: boolean, allowDisposable: boolean): EmailValidationResultType {
    const errors: string[] = [];
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidFormat = emailRegex.test(trimmedEmail);
    
    if (!hasValidFormat) {
      errors.push('Invalid email format');
    }

    // Parse email parts
    const [localPart = '', domain = ''] = trimmedEmail.split('@');
    
    // Local part validation
    if (localPart.length === 0) {
      errors.push('Local part cannot be empty');
    } else if (localPart.length > 64) {
      errors.push('Local part cannot exceed 64 characters');
    }

    // Check for consecutive dots
    if (localPart.includes('..') || domain.includes('..')) {
      errors.push('Consecutive dots are not allowed');
    }

    // Check for leading/trailing dots
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      errors.push('Local part cannot start or end with a dot');
    }

    // Domain validation
    let hasValidDomain = true;
    let isDisposable = false;

    if (checkDomain && domain) {
      // Domain length check
      if (domain.length > 253) {
        errors.push('Domain cannot exceed 253 characters');
        hasValidDomain = false;
      }

      // Domain format validation
      const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
      if (!domainRegex.test(domain)) {
        errors.push('Invalid domain format');
        hasValidDomain = false;
      }

      // Check for disposable email domains (basic list)
      const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
        'mailinator.com', 'yopmail.com', 'temp-mail.org',
        'throwaway.email', 'maildrop.cc', 'getnada.com'
      ];
      
      isDisposable = disposableDomains.includes(domain);
      
      if (isDisposable && !allowDisposable) {
        errors.push('Disposable email addresses are not allowed');
      }
    }

    // Additional format checks
    if (trimmedEmail.length > 320) {
      errors.push('Email address cannot exceed 320 characters');
    }

    // Check for invalid characters in local part
    const invalidLocalChars = /[<>()[\]\\,;:@"]/;
    if (invalidLocalChars.test(localPart.replace(/"/g, ''))) {
      errors.push('Local part contains invalid characters');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      email: trimmedEmail,
      normalizedEmail: trimmedEmail,
      errors,
      details: {
        hasValidFormat,
        hasValidDomain,
        isDisposable,
        localPart,
        domain
      }
    };
  }
}
