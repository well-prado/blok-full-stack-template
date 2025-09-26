import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import * as bcrypt from 'bcryptjs';

type PasswordVerifyInputType = {
  password: string;
  hashedPassword: string;
};

type PasswordVerifyOutputType = {
  isValid: boolean;
  message: string;
};

export default class PasswordVerify extends NanoService<PasswordVerifyInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        password: {
          type: "string",
          minLength: 1,
          description: "The plain text password to verify"
        },
        hashedPassword: {
          type: "string",
          minLength: 1,
          description: "The hashed password to compare against"
        }
      },
      required: ["password", "hashedPassword"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        isValid: {
          type: "boolean",
          description: "Whether the password matches the hash"
        },
        message: {
          type: "string",
          description: "Human-readable verification result message"
        }
      },
      required: ["isValid", "message"]
    };
  }

  async handle(ctx: Context, inputs: PasswordVerifyInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.password || typeof inputs.password !== 'string') {
        throw new Error('Password is required and must be a string');
      }

      if (!inputs.hashedPassword || typeof inputs.hashedPassword !== 'string') {
        throw new Error('Hashed password is required and must be a string');
      }

      if (inputs.password.length < 1) {
        throw new Error('Password cannot be empty');
      }

      if (inputs.hashedPassword.length < 1) {
        throw new Error('Hashed password cannot be empty');
      }

      ctx.logger.log('Verifying password against hash');

      // Compare the password with the hash
      const isValid = await bcrypt.compare(inputs.password, inputs.hashedPassword);

      const result: PasswordVerifyOutputType = {
        isValid,
        message: isValid ? 'Password is valid' : 'Password is invalid'
      };

      // Store result in context for use in subsequent workflow steps
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.passwordValid = isValid as unknown as ParamsDictionary;
      ctx.vars.passwordVerificationResult = result as unknown as ParamsDictionary;

      ctx.logger.log(`Password verification result: ${isValid ? 'VALID' : 'INVALID'}`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Password verification failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Password verification error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}