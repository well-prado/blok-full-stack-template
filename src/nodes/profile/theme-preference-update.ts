import { 
  type INanoServiceResponse, 
  NanoService, 
  NanoServiceResponse,
  type ParamsDictionary,
  type JsonLikeObject
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

interface ThemePreferenceUpdateInput {
  userId: string;
  themeId: string;
  themeMode: 'light' | 'dark';
}

export default class ThemePreferenceUpdate extends NanoService<ThemePreferenceUpdateInput> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID to update theme preferences for"
        },
        themeId: {
          type: "string",
          enum: ["classic", "ocean", "forest", "sunset", "purple", "rose"],
          description: "Selected theme ID"
        },
        themeMode: {
          type: "string",
          enum: ["light", "dark"],
          description: "Selected theme mode"
        }
      },
      required: ["userId", "themeId", "themeMode"]
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the theme preferences were updated successfully"
        },
        message: {
          type: "string",
          const: "Theme preferences updated successfully",
          description: "Success message"
        },
        preferences: {
          type: "object",
          description: "Updated user preferences object",
          properties: {
            theme: {
              type: "object",
              description: "Theme preferences",
              properties: {
                id: {
                  type: "string",
                  enum: ["classic", "ocean", "forest", "sunset", "purple", "rose"],
                  description: "Selected theme ID"
                },
                mode: {
                  type: "string",
                  enum: ["light", "dark"],
                  description: "Selected theme mode"
                },
                updatedAt: {
                  type: "string",
                  format: "date-time",
                  description: "Theme preference update timestamp"
                }
              },
              required: ["id", "mode", "updatedAt"]
            }
          },
          additionalProperties: true
        },
        theme: {
          type: "object",
          description: "Applied theme settings",
          properties: {
            id: {
              type: "string",
              enum: ["classic", "ocean", "forest", "sunset", "purple", "rose"],
              description: "Applied theme ID"
            },
            mode: {
              type: "string",
              enum: ["light", "dark"],
              description: "Applied theme mode"
            }
          },
          required: ["id", "mode"]
        }
      },
      required: ["success", "message", "preferences", "theme"]
    };
  }

  async handle(ctx: Context, inputs: ThemePreferenceUpdateInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Import database config
      const { db } = await import("../../../database/config");

      // Get current user preferences
      const currentUser = await db.user.findUnique({
        where: { id: inputs.userId }
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      // Parse existing preferences or create new ones
      let preferences = {};
      try {
        preferences = currentUser.preferences ? JSON.parse(currentUser.preferences) : {};
      } catch (error) {
        preferences = {};
      }

      // Update theme preferences
      const updatedPreferences = {
        ...preferences,
        theme: {
          id: inputs.themeId,
          mode: inputs.themeMode,
          updatedAt: new Date().toISOString()
        }
      };

      // Update user preferences in database
      await db.user.update({
        where: { id: inputs.userId },
        data: {
          preferences: JSON.stringify(updatedPreferences),
          updatedAt: new Date()
        }
      });

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.updatedPreferences = updatedPreferences as unknown as ParamsDictionary;
      ctx.vars.themePreferences = {
        themeId: inputs.themeId,
        themeMode: inputs.themeMode
      } as unknown as ParamsDictionary;

      response.setSuccess({
        success: true,
        message: "Theme preferences updated successfully",
        preferences: updatedPreferences,
        theme: {
          id: inputs.themeId,
          mode: inputs.themeMode
        }
      } as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to update theme preferences"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }
}
