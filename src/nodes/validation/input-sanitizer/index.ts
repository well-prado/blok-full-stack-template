import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type SanitizationRule = 
  | 'trim'
  | 'lowercase' 
  | 'uppercase'
  | 'remove-html'
  | 'escape-html'
  | 'remove-sql-chars'
  | 'remove-special-chars'
  | 'normalize-unicode'
  | 'remove-control-chars'
  | 'limit-length';

type InputSanitizerInputType = {
  data: Record<string, unknown> | string;
  rules: SanitizationRule[];
  maxLength?: number;
  allowedFields?: string[];
  forbiddenFields?: string[];
  preserveOriginal?: boolean;
};

type SanitizationResultType = {
  original: Record<string, unknown> | string;
  sanitized: Record<string, unknown> | string;
  appliedRules: SanitizationRule[];
  warnings: string[];
  fieldsProcessed: string[];
  fieldsSkipped: string[];
};

type InputSanitizerOutputType = {
  success: boolean;
  result: SanitizationResultType;
  message: string;
  statusCode: number;
};

export default class InputSanitizer extends NanoService<InputSanitizerInputType> {
  constructor() {
    super();
    
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the sanitization was successful"
        },
        result: {
          type: "object",
          properties: {
            original: {
              oneOf: [
                { type: "string" },
                { type: "object" }
              ],
              description: "Original data before sanitization"
            },
            sanitized: {
              oneOf: [
                { type: "string" },
                { type: "object" }
              ],
              description: "Sanitized data after applying rules"
            },
            appliedRules: {
              type: "array",
              items: {
                type: "string",
                enum: ["trim", "lowercase", "uppercase", "remove-html", "escape-html", "remove-sql-chars", "remove-special-chars", "normalize-unicode", "remove-control-chars", "limit-length"]
              },
              description: "List of sanitization rules that were applied"
            },
            warnings: {
              type: "array",
              items: { type: "string" },
              description: "Any warnings generated during sanitization"
            },
            fieldsProcessed: {
              type: "array",
              items: { type: "string" },
              description: "Fields that were processed during sanitization"
            },
            fieldsSkipped: {
              type: "array",
              items: { type: "string" },
              description: "Fields that were skipped during sanitization"
            }
          },
          required: ["original", "sanitized", "appliedRules", "warnings", "fieldsProcessed", "fieldsSkipped"]
        },
        message: {
          type: "string",
          description: "Human-readable message about the sanitization result"
        },
        statusCode: {
          type: "number",
          enum: [200, 400, 500],
          description: "HTTP status code"
        }
      },
      required: ["success", "result", "message", "statusCode"]
    };
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        data: {
          oneOf: [
            { type: "string" },
            { type: "object" }
          ],
          description: "Data to sanitize (string or object)"
        },
        rules: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "trim", "lowercase", "uppercase", "remove-html", "escape-html",
              "remove-sql-chars", "remove-special-chars", "normalize-unicode",
              "remove-control-chars", "limit-length"
            ]
          },
          description: "Array of sanitization rules to apply"
        },
        maxLength: {
          type: "number",
          minimum: 1,
          maximum: 10000,
          default: 1000,
          description: "Maximum length for strings when using limit-length rule"
        },
        allowedFields: {
          type: "array",
          items: { type: "string" },
          description: "Only process these fields (for object input)"
        },
        forbiddenFields: {
          type: "array",
          items: { type: "string" },
          description: "Skip these fields (for object input)"
        },
        preserveOriginal: {
          type: "boolean",
          default: true,
          description: "Keep original data in response (default: true)"
        }
      },
      required: ["data", "rules"]
    };
  }

  async handle(ctx: Context, inputs: InputSanitizerInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (inputs.data === undefined || inputs.data === null) {
        throw new Error('Data is required');
      }

      if (!Array.isArray(inputs.rules) || inputs.rules.length === 0) {
        throw new Error('Rules array is required and must not be empty');
      }

      ctx.logger.log(`Sanitizing input with rules: ${inputs.rules.join(', ')}`);

      const sanitizationResult = this.sanitizeData(inputs);

      const result: InputSanitizerOutputType = {
        success: true,
        result: sanitizationResult,
        message: `Successfully sanitized ${sanitizationResult.fieldsProcessed.length} fields with ${sanitizationResult.appliedRules.length} rules`,
        statusCode: 200
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.sanitizedData = sanitizationResult.sanitized as unknown as ParamsDictionary;
      ctx.vars.originalData = sanitizationResult.original as unknown as ParamsDictionary;
      ctx.vars.sanitizationWarnings = sanitizationResult.warnings as unknown as ParamsDictionary;

      ctx.logger.log(`Sanitization completed: ${sanitizationResult.fieldsProcessed.length} fields processed, ${sanitizationResult.warnings.length} warnings`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Input sanitization failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Input sanitizer error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }

  private sanitizeData(inputs: InputSanitizerInputType): SanitizationResultType {
    const warnings: string[] = [];
    const fieldsProcessed: string[] = [];
    const fieldsSkipped: string[] = [];
    const maxLength = inputs.maxLength || 1000;

    let sanitized: Record<string, unknown> | string;
    
    if (typeof inputs.data === 'string') {
      // Handle string input
      sanitized = this.sanitizeString(inputs.data, inputs.rules, maxLength, warnings);
      fieldsProcessed.push('string_input');
    } else if (typeof inputs.data === 'object' && inputs.data !== null) {
      // Handle object input
      sanitized = this.sanitizeObject(
        inputs.data as Record<string, unknown>,
        inputs.rules,
        maxLength,
        inputs.allowedFields,
        inputs.forbiddenFields,
        warnings,
        fieldsProcessed,
        fieldsSkipped
      );
    } else {
      throw new Error('Data must be a string or object');
    }

    return {
      original: inputs.preserveOriginal !== false ? inputs.data : {},
      sanitized,
      appliedRules: inputs.rules,
      warnings,
      fieldsProcessed,
      fieldsSkipped
    };
  }

  private sanitizeObject(
    data: Record<string, unknown>,
    rules: SanitizationRule[],
    maxLength: number,
    allowedFields?: string[],
    forbiddenFields?: string[],
    warnings: string[] = [],
    fieldsProcessed: string[] = [],
    fieldsSkipped: string[] = []
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Check if field should be processed
      if (forbiddenFields && forbiddenFields.includes(key)) {
        result[key] = value;
        fieldsSkipped.push(key);
        continue;
      }

      if (allowedFields && !allowedFields.includes(key)) {
        result[key] = value;
        fieldsSkipped.push(key);
        continue;
      }

      // Process field based on type
      if (typeof value === 'string') {
        result[key] = this.sanitizeString(value, rules, maxLength, warnings);
        fieldsProcessed.push(key);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        result[key] = this.sanitizeObject(
          value as Record<string, unknown>,
          rules,
          maxLength,
          allowedFields,
          forbiddenFields,
          warnings,
          fieldsProcessed,
          fieldsSkipped
        );
      } else {
        // Keep non-string values as-is
        result[key] = value;
        fieldsSkipped.push(`${key} (non-string)`);
      }
    }

    return result;
  }

  private sanitizeString(
    input: string,
    rules: SanitizationRule[],
    maxLength: number,
    warnings: string[]
  ): string {
    let result = input;

    for (const rule of rules) {
      const originalLength = result.length;
      
      switch (rule) {
        case 'trim':
          result = result.trim();
          break;

        case 'lowercase':
          result = result.toLowerCase();
          break;

        case 'uppercase':
          result = result.toUpperCase();
          break;

        case 'remove-html':
          result = result.replace(/<[^>]*>/g, '');
          if (originalLength !== result.length) {
            warnings.push('HTML tags were removed');
          }
          break;

        case 'escape-html':
          result = result
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
          break;

        case 'remove-sql-chars':
          result = result.replace(/[';-]/g, '').replace(/--/g, '');
          if (originalLength !== result.length) {
            warnings.push('Potentially dangerous SQL characters were removed');
          }
          break;

        case 'remove-special-chars':
          result = result.replace(/[^\w\s@.-]/g, '');
          if (originalLength !== result.length) {
            warnings.push('Special characters were removed');
          }
          break;

        case 'normalize-unicode':
          result = result.normalize('NFC');
          break;

        case 'remove-control-chars':
          result = result.replace(/[\x00-\x1F\x7F]/g, '');
          if (originalLength !== result.length) {
            warnings.push('Control characters were removed');
          }
          break;

        case 'limit-length':
          if (result.length > maxLength) {
            result = result.substring(0, maxLength);
            warnings.push(`String was truncated to ${maxLength} characters`);
          }
          break;

        default:
          warnings.push(`Unknown sanitization rule: ${rule}`);
      }
    }

    return result;
  }
}
