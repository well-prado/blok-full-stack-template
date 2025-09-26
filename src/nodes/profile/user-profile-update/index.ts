import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import bcrypt from "bcryptjs";
import { db } from "../../../../database/config";
import { eq } from "drizzle-orm";
import { users } from "../../../../database/schemas";

interface InputType {
  userId: string;
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profileImage?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean | {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    emailUpdates?: boolean;
    language?: string;
    timezone?: string;
    bio?: string;
  };
}

interface UserUpdateData {
  name?: string;
  email?: string;
  passwordHash?: string;
  profileImage?: string;
  preferences?: string;
  updatedAt: string;
}

/**
 * User Profile Update Node
 * 
 * This node handles comprehensive user profile updates including:
 * - Basic profile information (name, email)
 * - Password changes with current password verification
 * - Profile image updates
 * - User preferences and settings
 */
export default class UserProfileUpdate extends NanoService<InputType> {
  /**
   * Initializes a new instance of the UserProfileUpdate class.
   * Sets up the input and output JSON Schema for automated validation.
   */
  constructor() {
    super();

    this.name = "user-profile-update";

    this.inputSchema = {
      type: "object",
      properties: {
        userId: { type: "string" },
        name: { type: "string", minLength: 2, maxLength: 100 },
        email: { type: "string", format: "email" },
        currentPassword: { type: "string" },
        newPassword: { type: "string", minLength: 8 },
        profileImage: { type: "string" },
        preferences: {
          type: "object",
          properties: {
            theme: { type: "string", enum: ["light", "dark", "system"] },
            notifications: {
              oneOf: [
                { type: "boolean" },
                {
                  type: "object",
                  properties: {
                    email: { type: "boolean" },
                    push: { type: "boolean" },
                    marketing: { type: "boolean" }
                  }
                }
              ]
            },
            emailUpdates: { type: "boolean" },
            language: { type: "string" },
            timezone: { type: "string" },
            bio: { type: "string", maxLength: 500 }
          }
        }
      },
      required: ["userId"],
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the profile update was successful"
        },
        user: {
          type: "object",
          description: "Updated user profile information",
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
            },
            profileImage: {
              type: "string",
              description: "Profile image URL or path"
            },
            preferences: {
              type: "object",
              description: "User preferences and settings",
              properties: {
                theme: {
                  type: "string",
                  enum: ["light", "dark", "system"],
                  description: "UI theme preference"
                },
                notifications: {
                  oneOf: [
                    {
                      type: "boolean",
                      description: "Simple notification preference"
                    },
                    {
                      type: "object",
                      description: "Detailed notification preferences",
                      properties: {
                        email: {
                          type: "boolean",
                          description: "Email notifications enabled"
                        },
                        push: {
                          type: "boolean",
                          description: "Push notifications enabled"
                        },
                        marketing: {
                          type: "boolean",
                          description: "Marketing notifications enabled"
                        }
                      }
                    }
                  ]
                },
                emailUpdates: {
                  type: "boolean",
                  description: "Email updates preference"
                },
                language: {
                  type: "string",
                  description: "Preferred language"
                },
                timezone: {
                  type: "string",
                  description: "User's timezone"
                },
                bio: {
                  type: "string",
                  description: "User biography"
                }
              }
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          },
          required: ["id", "email", "name", "role", "emailVerified", "profileImage", "preferences", "createdAt", "updatedAt"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        }
      },
      required: ["success", "user", "message"]
    };
  }

  /**
   * Handles the user profile update request
   *
   * @param ctx - The context of the request
   * @param inputs - The input data containing user updates
   * @returns A promise that resolves to an INanoServiceResponse object
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response: NanoServiceResponse = new NanoServiceResponse();

    try {
      const { 
        userId, 
        name, 
        email, 
        currentPassword, 
        newPassword, 
        profileImage,
        preferences 
      } = inputs;

      // Validate required userId
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get current user data
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUsers.length === 0) {
        throw new Error("User not found");
      }

      const existingUser = existingUsers[0];
      const updateData: UserUpdateData = {
        updatedAt: new Date().toISOString()
      };

      // Handle email update with uniqueness check
      if (email && email !== existingUser.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("Invalid email format");
        }

        // Check if email is already taken
        const emailExists = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (emailExists.length > 0) {
          throw new Error("Email address is already in use");
        }

        updateData.email = email;
      }

      // Handle name update
      if (name && name !== existingUser.name) {
        if (name.length < 2 || name.length > 100) {
          throw new Error("Name must be between 2 and 100 characters");
        }
        updateData.name = name;
      }

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to change your password. Please enter your current password to proceed.");
        }

        // Validate new password first (before checking current password)
        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters long. Please choose a stronger password.");
        }

        if (newPassword === currentPassword) {
          throw new Error("New password must be different from your current password. Please choose a different password.");
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword, 
          existingUser.passwordHash
        );

        if (!isCurrentPasswordValid) {
          throw new Error("Current password is incorrect. Please check your current password and try again. If you've forgotten your password, please contact support.");
        }

        // Hash new password
        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }

      // Handle profile image update
      if (profileImage) {
        updateData.profileImage = profileImage;
      }

      // Handle preferences update
      if (preferences) {
        // Merge with existing preferences if any
        let existingPreferences = {};
        if (existingUser.preferences) {
          try {
            existingPreferences = JSON.parse(existingUser.preferences);
          } catch (e) {
            // If parsing fails, start with empty object
            existingPreferences = {};
          }
        }

        const mergedPreferences = {
          ...existingPreferences,
          ...preferences,
          // Handle notifications properly - can be boolean or object
          notifications: preferences.notifications !== undefined
            ? (typeof preferences.notifications === 'boolean' 
                ? preferences.notifications 
                : { ...((existingPreferences as any).notifications || {}), ...preferences.notifications })
            : (existingPreferences as any).notifications
        };

        updateData.preferences = JSON.stringify(mergedPreferences);
      }

      // Perform the update
      const updatedUsers = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (updatedUsers.length === 0) {
        throw new Error("Failed to update user profile");
      }

      const updatedUser = updatedUsers[0];

      // Return sanitized user data (without password hash)
      const sanitizedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        profileImage: updatedUser.profileImage || "",
        preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : {},
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      response.setSuccess({
        success: true,
        user: sanitizedUser,
        message: "Profile updated successfully"
      });

    } catch (error: unknown) {
      const nodeError: GlobalError = new GlobalError((error as Error).message);
      nodeError.setCode(400);
      nodeError.setStack((error as Error).stack);
      nodeError.setName(this.name);
      nodeError.setJson({ 
        error: "Profile update failed",
        details: (error as Error).message 
      });

      response.setError(nodeError);
    }

    return response;
  }
}
