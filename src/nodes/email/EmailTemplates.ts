import {
  type INanoServiceResponse,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
  type JsonLikeObject,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

interface EmailTemplatesInput {
  template: "verification" | "welcome" | "passwordReset" | "passwordChanged" | "accountLocked" | "custom";
  data: Record<string, unknown>;
  customTemplate?: string;
  format?: "html" | "text" | "both";
}

interface EmailTemplate {
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Email Templates Node
 * 
 * Generates email content from templates with dynamic data injection.
 * Supports multiple template types and formats (HTML/text).
 */
export default class EmailTemplates extends NanoService<EmailTemplatesInput> {
  constructor() {
    super();

    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        template: {
          type: "string",
          enum: ["verification", "welcome", "passwordReset", "passwordChanged", "accountLocked", "custom"],
          description: "Email template type",
        },
        data: {
          type: "object",
          description: "Template data for variable substitution",
        },
        customTemplate: {
          type: "string",
          description: "Custom template content (for custom template type)",
        },
        format: {
          type: "string",
          enum: ["html", "text", "both"],
          default: "both",
          description: "Output format",
        },
      },
      required: ["template", "data"],
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          const: true,
          description: "Whether the template was generated successfully"
        },
        template: {
          type: "object",
          description: "Generated email template",
          properties: {
            subject: {
              type: "string",
              description: "Email subject line"
            },
            html: {
              type: "string",
              description: "HTML email content"
            },
            text: {
              type: "string",
              description: "Plain text email content"
            }
          },
          required: ["subject"]
        }
      },
      required: ["success", "template"]
    };
  }

  async handle(
    ctx: Context,
    inputs: EmailTemplatesInput
  ): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      const template = await this.generateTemplate(
        inputs.template,
        inputs.data,
        inputs.customTemplate,
        inputs.format || "both"
      );

      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.emailTemplate = template as unknown as ParamsDictionary;

      response.setSuccess({
        success: true,
        template,
      } as unknown as JsonLikeObject);
    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Email template generation failed"
      );
      nodeError.setCode(400);
      response.setError(nodeError);
    }

    return response;
  }

  private async generateTemplate(
    templateType: string,
    data: Record<string, unknown>,
    customTemplate?: string,
    format: string = "both"
  ): Promise<EmailTemplate> {
    let template: EmailTemplate;

    switch (templateType) {
      case "verification":
        template = this.getVerificationTemplate(data);
        break;
      case "welcome":
        template = this.getWelcomeTemplate(data);
        break;
      case "passwordReset":
        template = this.getPasswordResetTemplate(data);
        break;
      case "passwordChanged":
        template = this.getPasswordChangedTemplate(data);
        break;
      case "accountLocked":
        template = this.getAccountLockedTemplate(data);
        break;
      case "custom":
        template = this.getCustomTemplate(data, customTemplate!);
        break;
      default:
        throw new Error(`Unsupported template type: ${templateType}`);
    }

    // Apply format filtering
    if (format === "html") {
      return {
        subject: template.subject,
        html: template.html,
      };
    } else if (format === "text") {
      return {
        subject: template.subject,
        text: template.text,
      };
    }

    return template;
  }

  private getVerificationTemplate(data: Record<string, unknown>): EmailTemplate {
    const { userName, verificationUrl, siteName, expirationHours } = data;

    return {
      subject: `Verify your email address - ${siteName || "Blok Admin"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">${siteName || "Blok Admin"}</h1>
            </div>
            
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hello ${userName || "there"},</p>
              <p>Thank you for creating an account! Please verify your email address by clicking the button below:</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              
              <p>If you can't click the button, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
              
              <p><strong>This link will expire in ${expirationHours || 24} hours.</strong></p>
              
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Verify Your Email Address - ${siteName || "Blok Admin"}

Hello ${userName || "there"},

Thank you for creating an account! Please verify your email address by visiting this link:

${verificationUrl}

This link will expire in ${expirationHours || 24} hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.
      `.trim(),
    };
  }

  private getWelcomeTemplate(data: Record<string, unknown>): EmailTemplate {
    const { userName, siteName, dashboardUrl, supportEmail } = data;

    return {
      subject: `Welcome to ${siteName || "Blok Admin"}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #10b981; margin: 0;">${siteName || "Blok Admin"}</h1>
            </div>
            
            <div class="content">
              <h2>Welcome aboard, ${userName}! 🎉</h2>
              <p>Your account has been successfully created and verified. You're now ready to explore all the features we have to offer.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl || "#"}" class="button">Go to Dashboard</a>
              </p>
              
              <h3>Getting Started:</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Configure your preferences</li>
                <li>Explore the admin dashboard</li>
                <li>Set up your team (if applicable)</li>
              </ul>
              
              <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:${supportEmail || "support@example.com"}">${supportEmail || "support@example.com"}</a>.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${siteName || "Blok Admin"}!

Welcome aboard, ${userName}! 🎉

Your account has been successfully created and verified. You're now ready to explore all the features we have to offer.

Getting Started:
- Complete your profile setup
- Configure your preferences
- Explore the admin dashboard
- Set up your team (if applicable)

Dashboard: ${dashboardUrl || "#"}

If you have any questions, feel free to reach out to our support team at ${supportEmail || "support@example.com"}.

© ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.
      `.trim(),
    };
  }

  private getPasswordResetTemplate(data: Record<string, unknown>): EmailTemplate {
    const { userName, resetUrl, siteName, expirationMinutes } = data;

    return {
      subject: `Reset your password - ${siteName || "Blok Admin"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #f59e0b; margin: 0;">${siteName || "Blok Admin"}</h1>
            </div>
            
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello ${userName || "there"},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              
              <p>If you can't click the button, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in ${expirationMinutes || 30} minutes</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password - ${siteName || "Blok Admin"}

Hello ${userName || "there"},

We received a request to reset your password. Visit this link to create a new password:

${resetUrl}

Security Notice:
- This link will expire in ${expirationMinutes || 30} minutes
- If you didn't request this reset, please ignore this email
- For security, this link can only be used once

© ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.
      `.trim(),
    };
  }

  private getPasswordChangedTemplate(data: Record<string, unknown>): EmailTemplate {
    const { userName, siteName, changeTime, ipAddress, supportEmail } = data;

    return {
      subject: `Password changed - ${siteName || "Blok Admin"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .content { padding: 30px 0; }
            .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #10b981; margin: 0;">${siteName || "Blok Admin"}</h1>
            </div>
            
            <div class="content">
              <h2>Password Successfully Changed</h2>
              <p>Hello ${userName || "there"},</p>
              
              <div class="success">
                <p><strong>✅ Your password has been successfully changed.</strong></p>
                <p>Change details:</p>
                <ul>
                  <li>Time: ${changeTime || new Date().toLocaleString()}</li>
                  ${ipAddress ? `<li>IP Address: ${ipAddress}</li>` : ""}
                </ul>
              </div>
              
              <p>If you didn't make this change, please contact our support team immediately at <a href="mailto:${supportEmail || "support@example.com"}">${supportEmail || "support@example.com"}</a>.</p>
              
              <p>For your security, we recommend:</p>
              <ul>
                <li>Using a unique, strong password</li>
                <li>Enabling two-factor authentication</li>
                <li>Regularly reviewing your account activity</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Successfully Changed - ${siteName || "Blok Admin"}

Hello ${userName || "there"},

✅ Your password has been successfully changed.

Change details:
- Time: ${changeTime || new Date().toLocaleString()}
${ipAddress ? `- IP Address: ${ipAddress}` : ""}

If you didn't make this change, please contact our support team immediately at ${supportEmail || "support@example.com"}.

For your security, we recommend:
- Using a unique, strong password
- Enabling two-factor authentication
- Regularly reviewing your account activity

© ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.
      `.trim(),
    };
  }

  private getAccountLockedTemplate(data: Record<string, unknown>): EmailTemplate {
    const { userName, siteName, lockReason, unlockUrl, supportEmail } = data;

    return {
      subject: `Account locked - ${siteName || "Blok Admin"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Locked</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .alert { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #ef4444; margin: 0;">${siteName || "Blok Admin"}</h1>
            </div>
            
            <div class="content">
              <h2>Account Temporarily Locked</h2>
              <p>Hello ${userName || "there"},</p>
              
              <div class="alert">
                <p><strong>🔒 Your account has been temporarily locked.</strong></p>
                <p>Reason: ${lockReason || "Multiple failed login attempts"}</p>
              </div>
              
              ${unlockUrl ? `
                <p>You can unlock your account by clicking the button below:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${unlockUrl}" class="button">Unlock Account</a>
                </p>
              ` : `
                <p>Your account will be automatically unlocked after a waiting period, or you can contact support for immediate assistance.</p>
              `}
              
              <p>For your security:</p>
              <ul>
                <li>Make sure you're using the correct login credentials</li>
                <li>Check that your account hasn't been compromised</li>
                <li>Consider enabling two-factor authentication</li>
              </ul>
              
              <p>If you need immediate assistance, please contact our support team at <a href="mailto:${supportEmail || "support@example.com"}">${supportEmail || "support@example.com"}</a>.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Account Temporarily Locked - ${siteName || "Blok Admin"}

Hello ${userName || "there"},

🔒 Your account has been temporarily locked.
Reason: ${lockReason || "Multiple failed login attempts"}

${unlockUrl ? `You can unlock your account using this link: ${unlockUrl}` : "Your account will be automatically unlocked after a waiting period, or you can contact support for immediate assistance."}

For your security:
- Make sure you're using the correct login credentials
- Check that your account hasn't been compromised
- Consider enabling two-factor authentication

If you need immediate assistance, please contact our support team at ${supportEmail || "support@example.com"}.

© ${new Date().getFullYear()} ${siteName || "Blok Admin"}. All rights reserved.
      `.trim(),
    };
  }

  private getCustomTemplate(data: Record<string, unknown>, customTemplate: string): EmailTemplate {
    // Simple template variable substitution
    let processedTemplate = customTemplate;
    
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, String(value));
    }

    // Extract subject from template if present
    const subjectMatch = processedTemplate.match(/^Subject:\s*(.+)$/m);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Custom Email";
    
    // Remove subject line from content
    const content = processedTemplate.replace(/^Subject:\s*.+$/m, '').trim();

    return {
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Simple HTML tag removal
    };
  }
}
