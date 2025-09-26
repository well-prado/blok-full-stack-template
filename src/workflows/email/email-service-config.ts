import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Email Service Configuration Workflow
 * 
 * Handles email service provider configuration and testing.
 * Supports GET (retrieve config) and POST (update config) operations.
 */
const step: Step = Workflow({
  name: "EmailServiceConfig",
  version: "1.0.0",
  description: "Email service provider configuration and testing",
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
      // Handle GET requests - retrieve current configuration
      new AddIf('ctx.request.method.toLowerCase() === "get"')
        .addStep({
          name: "get-email-config",
          node: "email-service-manager",
          type: "module",
          inputs: {
            operation: "getConfig",
          },
        })
        .build(),

      // Handle POST requests - configure or test email service
      new AddIf('ctx.request.method.toLowerCase() === "post"')
        .addStep({
          name: "check-admin-auth",
          node: "authentication-checker",
          type: "module",
          inputs: {
            requireAuth: true,
            requiredRole: "admin",
            requestMethod: "js/ctx.request.method",
            requestPath: "js/ctx.request.path",
            headers: "js/ctx.request.headers",
            cookies: "js/ctx.request.cookies",
          },
        })
        .addStep({
          name: "determine-operation",
          node: "@nanoservice-ts/if-else",
          type: "module",
          inputs: {
            conditions: [
              {
                type: "if",
                condition: 'ctx.request.body.operation === "test"',
                steps: [
                  {
                    name: "test-email-service",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "test",
                    },
                  },
                ],
              },
              {
                type: "else",
                steps: [
                  {
                    name: "configure-email-service",
                    node: "email-service-manager",
                    type: "module",
                    inputs: {
                      operation: "configure",
                      config: "js/ctx.request.body.config",
                    },
                  },
                ],
              },
            ],
          },
        })
        .build(),

      // Handle PUT requests - update specific configuration
      new AddIf('ctx.request.method.toLowerCase() === "put"')
        .addStep({
          name: "check-admin-auth-put",
          node: "authentication-checker",
          type: "module",
          inputs: {
            requireAuth: true,
            requiredRole: "admin",
            requestMethod: "js/ctx.request.method",
            requestPath: "js/ctx.request.path",
            headers: "js/ctx.request.headers",
            cookies: "js/ctx.request.cookies",
          },
        })
        .addStep({
          name: "update-email-config",
          node: "email-service-manager",
          type: "module",
          inputs: {
            operation: "configure",
            config: "js/ctx.request.body",
          },
        })
        .build(),

      // Handle unsupported methods
      new AddElse()
        .addStep({
          name: "method-not-allowed",
          node: "error",
          type: "module",
          inputs: {
            message: "Method not allowed. Supported methods: GET, POST, PUT",
            statusCode: 405,
          },
        })
        .build(),
    ];
  },
});

export default step;
