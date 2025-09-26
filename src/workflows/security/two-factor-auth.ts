import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Two-Factor Authentication Workflow
 * 
 * This workflow handles 2FA operations:
 * - Setup 2FA with QR code generation
 * - Verify TOTP tokens
 * - Generate backup codes
 * - Enable/disable 2FA
 * 
 * Endpoint: POST /api/two-factor-auth
 * Required: User authentication
 * Body: { action: string, token?: string, secret?: string }
 */
const step: Step = Workflow({
  name: "Two-Factor Authentication API",
  version: "1.0.0",
  description: "Manage two-factor authentication for users with automatic logging",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "log-request-start",
  node: "request-interceptor",
  type: "module",
  inputs: {
    phase: "start",
    workflowName: "two-factor-auth",
    actionType: "UPDATE",
    resourceType: "security",
    resourceName: "js/'2fa_' + ctx.request.body.action",
    riskLevel: "high", // Security changes are high risk
  },
})
.addCondition({
  node: {
    name: "auth-check",
    node: "authentication-checker",
    type: "module",
    inputs: {
      requireAuth: true,
      requestMethod: "js/ctx.request.method",
      requestPath: "js/ctx.request.path",
      headers: "js/ctx.request.headers",
      cookies: "js/ctx.request.cookies",
    },
  },
  conditions: () => {
    return [
      // Authenticated users can manage 2FA
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "manage-2fa",
          node: "two-factor-auth",
          type: "module",
          inputs: {
            action: "js/ctx.request.body.action",
            userId: "js/ctx.vars.currentUser.id",
            token: "js/ctx.request.body.token",
            secret: "js/ctx.request.body.secret",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "two-factor-auth",
            actionType: "UPDATE",
            resourceType: "security",
            resourceId: "js/ctx.vars.currentUser.id",
            resourceName: "js/'2fa_' + ctx.request.body.action",
            riskLevel: "high",
            contextData: {
              httpMethod: "POST",
              endpoint: "/api/two-factor-auth",
              success: "js/ctx.response?.success !== false",
              statusCode: "js/ctx.response?.success !== false ? 200 : 400",
              userId: "js/ctx.vars.currentUser.id",
              userEmail: "js/ctx.vars.currentUser.email",
              userName: "js/ctx.vars.currentUser.name",
              userRole: "js/ctx.vars.currentUser.role",
              ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
              userAgent: "js/ctx.request.headers['user-agent']",
              requestBody: "js/ctx.request.body",
              responseData: "js/ctx.response?.data",
            },
          },
        })
        .build(),
      
      // Unauthorized response
      new AddElse()
        .addStep({
          name: "unauthorized-response",
          node: "@nanoservice-ts/api-call",
          type: "module",
          inputs: {
            url: "data:application/json;base64,eyJzdWNjZXNzIjpmYWxzZSwibWVzc2FnZSI6IlVuYXV0aG9yaXplZC4gUGxlYXNlIGxvZyBpbi4iLCJzdGF0dXNDb2RlIjo0MDF9",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        })
        .addStep({
          name: "log-request-complete-unauthorized",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "two-factor-auth",
            actionType: "UPDATE",
            resourceType: "security",
            resourceName: "js/'2fa_' + ctx.request.body.action",
            riskLevel: "high",
            contextData: {
              httpMethod: "POST",
              endpoint: "/api/two-factor-auth",
              success: false,
              statusCode: 401,
              errorMessage: "Unauthorized. Please log in.",
              userId: "anonymous",
              userEmail: "anonymous@unknown",
              userName: "Anonymous",
              userRole: "none",
              ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
              userAgent: "js/ctx.request.headers['user-agent']",
              requestBody: "js/ctx.request.body",
            },
          },
        })
        .build(),
    ];
  },
});

export default step;
