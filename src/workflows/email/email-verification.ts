import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Email Verification Workflow
 * 
 * Handles email verification token generation, verification, and resending.
 * Integrates with email templates and service manager for sending verification emails.
 */
const step: Step = Workflow({
  name: "EmailVerification",
  version: "1.0.0",
  description: "Email verification token management and sending",
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
      // Handle POST requests - generate verification token and send email
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "send"')
        .addStep({
          name: "validate-user-data",
          node: "input-sanitizer",
          type: "module",
          inputs: {
            data: "js/ctx.request.body",
            fields: ["userId", "email", "userName"],
          },
        })
        .addStep({
          name: "generate-verification-token",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "generate",
            userId: "js/ctx.request.body.userId",
            email: "js/ctx.request.body.email",
            expirationHours: "js/ctx.request.body.expirationHours || 24",
          },
        })
        .addStep({
          name: "create-verification-email",
          node: "email-templates",
          type: "module",
          inputs: {
            template: "verification",
            data: {
              userName: "js/ctx.request.body.userName",
              verificationUrl: "js/`${ctx.request.body.baseUrl || 'http://localhost:4000'}/verify-email?token=${ctx.vars.verificationToken.token}`",
              siteName: "js/ctx.request.body.siteName || 'Blok Admin'",
              expirationHours: "js/ctx.vars.verificationToken.expirationHours || 24",
            },
            format: "both",
          },
        })
        .addStep({
          name: "send-verification-email",
          node: "email-service-manager",
          type: "module",
          inputs: {
            operation: "send",
            email: {
              to: "js/ctx.request.body.email",
              subject: "js/ctx.vars.emailTemplate.subject",
              html: "js/ctx.vars.emailTemplate.html",
              text: "js/ctx.vars.emailTemplate.text",
            },
          },
        })
        .build(),

      // Handle POST requests - verify token
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "verify"')
        .addStep({
          name: "verify-token",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "verify",
            token: "js/ctx.request.body.token",
          },
        })
        .addStep({
          name: "update-user-verification",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: "ctx.vars.verificationResult.valid === true",
                steps: [
                  {
                    name: "mark-user-verified",
                    node: "user-update",
                    type: "module",
                    inputs: {
                      id: "js/ctx.vars.verificationResult.userId",
                      updates: {
                        emailVerified: true,
                        verifiedAt: "js/new Date().toISOString()",
                      },
                    },
                  },
                ],
              },
            ],
          },
        })
        .build(),

      // Handle POST requests - resend verification
      new AddIf('ctx.request.method.toLowerCase() === "post" && ctx.request.body.operation === "resend"')
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
          name: "resend-verification",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "resend",
            userId: "js/ctx.request.body.userId",
            email: "js/ctx.request.body.email",
            expirationHours: "js/ctx.request.body.expirationHours || 24",
          },
        })
        .addStep({
          name: "create-resend-email",
          node: "email-templates",
          type: "module",
          inputs: {
            template: "verification",
            data: {
              userName: "js/ctx.request.body.userName",
              verificationUrl: "js/`${ctx.request.body.baseUrl || 'http://localhost:4000'}/verify-email?token=${ctx.vars.resendResult.token}`",
              siteName: "js/ctx.request.body.siteName || 'Blok Admin'",
              expirationHours: "js/ctx.vars.resendResult.expirationHours || 24",
            },
            format: "both",
          },
        })
        .addStep({
          name: "send-resend-email",
          node: "email-service-manager",
          type: "module",
          inputs: {
            operation: "send",
            email: {
              to: "js/ctx.request.body.email",
              subject: "js/ctx.vars.emailTemplate.subject",
              html: "js/ctx.vars.emailTemplate.html",
              text: "js/ctx.vars.emailTemplate.text",
            },
          },
        })
        .build(),

      // Handle GET requests - verify token via URL (for email links)
      new AddIf('ctx.request.method.toLowerCase() === "get" && ctx.request.query.token')
        .addStep({
          name: "verify-url-token",
          node: "email-verification",
          type: "module",
          inputs: {
            operation: "verify",
            token: "js/ctx.request.query.token",
          },
        })
        .addStep({
          name: "process-verification-result",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: "ctx.vars.verificationResult.valid === true",
                steps: [
                  {
                    name: "mark-user-verified-get",
                    node: "user-update",
                    type: "module",
                    inputs: {
                      id: "js/ctx.vars.verificationResult.userId",
                      updates: {
                        emailVerified: true,
                        verifiedAt: "js/new Date().toISOString()",
                      },
                    },
                  },
                  {
                    name: "send-welcome-email",
                    node: "email-templates",
                    type: "module",
                    inputs: {
                      template: "welcome",
                      data: {
                        userName: "js/ctx.vars.verificationResult.userName || 'User'",
                        siteName: "Blok Admin",
                        dashboardUrl: "http://localhost:4000/dashboard",
                        supportEmail: "support@example.com",
                      },
                      format: "both",
                    },
                  },
                  {
                    name: "send-welcome",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "send",
                      email: {
                        to: "js/ctx.vars.verificationResult.email",
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

      // Handle unsupported methods or operations
      new AddElse()
        .addStep({
          name: "invalid-request",
          node: "error",
          type: "module",
          inputs: {
            message: "Invalid request. Supported operations: send, verify, resend",
            statusCode: 400,
          },
        })
        .build(),
    ];
  },
});

export default step;
