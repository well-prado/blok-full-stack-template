import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Password Reset Workflow
 * 
 * Handles password reset requests and processing.
 * Sends password reset emails using the email service infrastructure.
 */
const step: Step = Workflow({
  name: "PasswordReset",
  version: "1.0.0",
  description: "Password reset request and processing with email notifications",
})
.addTrigger("http", {
  method: "ANY",
  path: "/",
  accept: "application/json",
})
.addCondition({
  node: {
    name: "request-router",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // Handle POST requests - initiate password reset
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "request"')
        .addStep({
          name: "validate-email",
          node: "email-validator",
          type: "module",
          inputs: {
            email: "js/ctx.request.body.email",
          },
        })
        .addStep({
          name: "find-user-by-email",
          node: "user-find",
          type: "module",
          inputs: {
            field: "email",
            value: "js/ctx.request.body.email",
          },
        })
        .addStep({
          name: "process-reset-request",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: "ctx.vars.user !== null",
                steps: [
                  {
                    name: "generate-reset-token",
                    node: "email-verification",
                    type: "module",
                    inputs: {
                      operation: "generate",
                      userId: "js/ctx.vars.user.id",
                      email: "js/ctx.vars.user.email",
                      expirationHours: 1, // Password reset tokens expire in 1 hour
                    },
                  },
                  {
                    name: "create-reset-email",
                    node: "email-templates",
                    type: "module",
                    inputs: {
                      template: "passwordReset",
                      data: {
                        userName: "js/ctx.vars.user.name",
                        resetUrl: "js/`${ctx.request.body.baseUrl || 'http://localhost:4000'}/reset-password?token=${ctx.vars.verificationToken.token}`",
                        siteName: "js/ctx.request.body.siteName || 'Blok Admin'",
                        expirationMinutes: 60,
                      },
                      format: "both",
                    },
                  },
                  {
                    name: "send-reset-email",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "send",
                      email: {
                        to: "js/ctx.vars.user.email",
                        subject: "js/ctx.vars.emailTemplate.subject",
                        html: "js/ctx.vars.emailTemplate.html",
                        text: "js/ctx.vars.emailTemplate.text",
                      },
                    },
                  },
                ],
              },
            ],
          },
        })
        .build(),

      // Handle POST requests - process password reset
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "reset"')
        .addStep({
          name: "validate-reset-data",
          node: "input-sanitizer",
          type: "module",
          inputs: {
            data: "js/ctx.request.body",
            fields: ["token", "newPassword"],
          },
        })
        .addStep({
          name: "validate-new-password",
          node: "password-validator",
          type: "module",
          inputs: {
            password: "js/ctx.request.body.newPassword",
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
          },
        })
        .addStep({
          name: "verify-reset-token",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "verify",
            token: "js/ctx.request.body.token",
          },
        })
        .addStep({
          name: "process-password-change",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: "ctx.vars.verificationResult.valid === true",
                steps: [
                  {
                    name: "hash-new-password",
                    node: "password-hash",
                    type: "module",
                    inputs: {
                      password: "js/ctx.request.body.newPassword",
                    },
                  },
                  {
                    name: "update-user-password",
                    node: "user-update",
                    type: "module",
                    inputs: {
                      id: "js/ctx.vars.verificationResult.userId",
                      updates: {
                        password: "js/ctx.vars.hashedPassword",
                        passwordChangedAt: "js/new Date().toISOString()",
                      },
                    },
                  },
                  {
                    name: "get-updated-user",
                    node: "user-find",
                    type: "module",
                    inputs: {
                      field: "id",
                      value: "js/ctx.vars.verificationResult.userId",
                    },
                  },
                  {
                    name: "create-confirmation-email",
                    node: "email-templates",
                    type: "module",
                    inputs: {
                      template: "passwordChanged",
                      data: {
                        userName: "js/ctx.vars.user.name",
                        siteName: "Blok Admin",
                        changeTime: "js/new Date().toLocaleString()",
                        ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'Unknown'",
                        supportEmail: "support@example.com",
                      },
                      format: "both",
                    },
                  },
                  {
                    name: "send-confirmation-email",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "send",
                      email: {
                        to: "js/ctx.vars.user.email",
                        subject: "js/ctx.vars.emailTemplate.subject",
                        html: "js/ctx.vars.emailTemplate.html",
                        text: "js/ctx.vars.emailTemplate.text",
                      },
                    },
                  },
                ],
              },
              {
                type: "else",
                steps: [
                  {
                    name: "invalid-token-error",
                    node: "error",
                    type: "module",
                    inputs: {
                      message: "Invalid or expired reset token",
                      statusCode: 400,
                    },
                  },
                ],
              },
            ],
          },
        })
        .build(),

      // Handle GET requests - validate reset token (for form display)
      new AddIf('ctx.request.method.toLowerCase() === "get" && ctx.request.query.token')
        .addStep({
          name: "validate-token-get",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "verify",
            token: "js/ctx.request.query.token",
          },
        })
        .build(),

      // Handle POST requests - change password for authenticated users
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "change"')
        .addStep({
          name: "check-user-auth",
          node: "authentication-checker",
          type: "module",
          inputs: {
            requireAuth: true,
            requestMethod: "js/ctx.request.method",
            requestPath: "js/ctx.request.path",
            headers: "js/ctx.request.headers",
            cookies: "js/ctx.request.cookies",
          },
        })
        .addStep({
          name: "validate-current-password",
          node: "password-verify",
          type: "module",
          inputs: {
            password: "js/ctx.request.body.currentPassword",
            hashedPassword: "js/ctx.vars.user.password",
          },
        })
        .addStep({
          name: "validate-new-password-change",
          node: "password-validator",
          type: "module",
          inputs: {
            password: "js/ctx.request.body.newPassword",
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
          },
        })
        .addStep({
          name: "process-password-update",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: "ctx.vars.passwordValid === true",
                steps: [
                  {
                    name: "hash-updated-password",
                    node: "password-hash",
                    type: "module",
                    inputs: {
                      password: "js/ctx.request.body.newPassword",
                    },
                  },
                  {
                    name: "update-password",
                    node: "user-update",
                    type: "module",
                    inputs: {
                      id: "js/ctx.vars.user.id",
                      updates: {
                        password: "js/ctx.vars.hashedPassword",
                        passwordChangedAt: "js/new Date().toISOString()",
                      },
                    },
                  },
                  {
                    name: "create-change-notification",
                    node: "email-templates",
                    type: "module",
                    inputs: {
                      template: "passwordChanged",
                      data: {
                        userName: "js/ctx.vars.user.name",
                        siteName: "Blok Admin",
                        changeTime: "js/new Date().toLocaleString()",
                        ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'Unknown'",
                        supportEmail: "support@example.com",
                      },
                      format: "both",
                    },
                  },
                  {
                    name: "send-change-notification",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "send",
                      email: {
                        to: "js/ctx.vars.user.email",
                        subject: "js/ctx.vars.emailTemplate.subject",
                        html: "js/ctx.vars.emailTemplate.html",
                        text: "js/ctx.vars.emailTemplate.text",
                      },
                    },
                  },
                ],
              },
              {
                type: "else",
                steps: [
                  {
                    name: "invalid-current-password",
                    node: "error",
                    type: "module",
                    inputs: {
                      message: "Current password is incorrect",
                      statusCode: 400,
                    },
                  },
                ],
              },
            ],
          },
        })
        .build(),

      // Handle unsupported methods or operations
      new AddElse()
        .addStep({
          name: "invalid-request",
          node: "error",
          type: "module",
          inputs: {
            message: "Invalid request. Supported operations: request, reset, change",
            statusCode: 400,
          },
        })
        .build(),
    ];
  },
});

export default step;
