import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import * as bcrypt from 'bcryptjs';

type PasswordHashInputType = {
  password: string;
  saltRounds?: number;
};

type PasswordHashOutputType = {
  hashedPassword: string;
  saltRounds: number;
};

export default class PasswordHash extends NanoService<PasswordHashInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        password: {
          type: "string",
          minLength: 1,
          description: "The password to hash"
        },
        saltRounds: {
          type: "number",
          minimum: 10,
          maximum: 15,
          default: 12,
          description: "Number of salt rounds for bcrypt (default: 12)"
        }
      },
      required: ["password"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        hashedPassword: {
          type: "string",
          description: "The bcrypt hashed password"
        },
        saltRounds: {
          type: "number",
          minimum: 10,
          maximum: 15,
          description: "Number of salt rounds used for hashing"
        }
      },
      required: ["hashedPassword", "saltRounds"]
    };
  }

  async handle(ctx: Context, inputs: PasswordHashInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.password || typeof inputs.password !== 'string') {
        throw new Error('Password is required and must be a string');
      }

      if (inputs.password.length < 1) {
        throw new Error('Password cannot be empty');
      }

      // Set default salt rounds if not provided
      const saltRounds = inputs.saltRounds || 12;

      // Validate salt rounds
      if (saltRounds < 10 || saltRounds > 15) {
        throw new Error('Salt rounds must be between 10 and 15 for security');
      }

      ctx.logger.log('Hashing password with ' + saltRounds + ' salt rounds');

      // Hash the password
      const hashedPassword = await bcrypt.hash(inputs.password, saltRounds);

      const result: PasswordHashOutputType = {
        hashedPassword,
        saltRounds
      };

      // Store in context for use in subsequent workflow steps
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.hashedPassword = hashedPassword as unknown as ParamsDictionary;
      ctx.vars.saltRounds = saltRounds as unknown as ParamsDictionary;

      ctx.logger.log('Password hashed successfully');
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Password hashing failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Password hashing error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}