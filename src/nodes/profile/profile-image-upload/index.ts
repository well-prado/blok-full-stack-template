import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import fs from "fs";
import path from "path";

interface InputType {
  base64: string;
  userId: string;
  oldImagePath?: string;
}

/**
 * Profile Image Upload Node
 * 
 * This node handles profile image uploads for users, including:
 * - Image validation (type and size)
 * - Secure file storage with user-specific paths
 * - Cleanup of old profile images
 * - URL generation for frontend access
 */
export default class ProfileImageUpload extends NanoService<InputType> {
  /**
   * Initializes a new instance of the ProfileImageUpload class.
   * Sets up the input and output JSON Schema for automated validation.
   */
  constructor() {
    super();

    this.name = "profile-image-upload";

    this.inputSchema = {
      type: "object",
      properties: {
        base64: { type: "string" },
        userId: { type: "string" },
        oldImagePath: { type: "string" }
      },
      required: ["base64", "userId"],
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the image upload was successful"
        },
        imagePath: {
          type: "string",
          description: "Relative path to the uploaded image file"
        },
        imageUrl: {
          type: "string",
          description: "URL path for frontend access"
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        fileName: {
          type: "string",
          description: "Generated filename for the uploaded image"
        },
        fileSize: {
          type: "number",
          description: "Size of the uploaded file in bytes",
          minimum: 0,
          maximum: 2097152 // 2MB in bytes
        },
        mimeType: {
          type: "string",
          enum: ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"],
          description: "MIME type of the uploaded image"
        }
      },
      required: ["success", "imagePath", "imageUrl", "message", "fileName", "fileSize", "mimeType"]
    };
  }

  /**
   * Handles the profile image upload request
   *
   * @param ctx - The context of the request
   * @param inputs - The input data containing base64 image, userId, and optional oldImagePath
   * @returns A promise that resolves to an INanoServiceResponse object
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    const response: NanoServiceResponse = new NanoServiceResponse();

    try {
      const { base64: base64Image, userId, oldImagePath } = inputs;

      // Validate inputs
      if (!base64Image || !userId) {
        throw new Error("Missing required fields: base64 image and userId");
      }

      // Create user-specific upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles', userId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Parse base64 image data
      let base64Data = base64Image;
      let imageExtension = "png";
      let mimeType = "image/png";

      if (base64Image.includes(";base64,")) {
        const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          imageExtension = matches[1].toLowerCase();
          mimeType = `image/${imageExtension}`;
          base64Data = matches[2];
        } else {
          base64Data = base64Image.split(";base64,").pop() as string;
        }
      }

      // Validate image type
      const allowedTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      if (!allowedTypes.includes(imageExtension)) {
        throw new Error(`Invalid image type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Decode base64 and validate size
      const buffer = Buffer.from(base64Data, "base64");
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (buffer.length > maxSize) {
        throw new Error("Image size exceeds 2MB limit");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}.${imageExtension}`;
      const fullFilePath = path.join(uploadDir, fileName);

      // Remove old profile image if exists
      if (oldImagePath) {
        const oldFullPath = path.join(process.cwd(), 'public', oldImagePath);
        try {
          if (fs.existsSync(oldFullPath)) {
            fs.unlinkSync(oldFullPath);
          }
        } catch (cleanupError) {
          // Log but don't fail the upload for cleanup errors
          console.warn(`Failed to remove old profile image: ${cleanupError}`);
        }
      }

      // Save new image
      fs.writeFileSync(fullFilePath, buffer);

      // Generate URL path for frontend
      const imageUrl = `/uploads/profiles/${userId}/${fileName}`;
      const relativePath = `uploads/profiles/${userId}/${fileName}`;

      response.setSuccess({
        success: true,
        imagePath: relativePath,
        imageUrl: imageUrl,
        message: "Profile image uploaded successfully",
        fileName: fileName,
        fileSize: buffer.length,
        mimeType: mimeType
      });

    } catch (error: unknown) {
      const nodeError: GlobalError = new GlobalError((error as Error).message);
      nodeError.setCode(400);
      nodeError.setStack((error as Error).stack);
      nodeError.setName(this.name);
      nodeError.setJson({ 
        error: "Profile image upload failed",
        details: (error as Error).message 
      });

      response.setError(nodeError);
    }

    return response;
  }
}
