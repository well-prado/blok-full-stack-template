import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * User Role Management Workflow
 * 
 * This workflow handles advanced user role management operations:
 * - Single user role updates
 * - Bulk role updates for multiple users
 * - Role statistics and reporting
 * 
 * Endpoint: POST /api/user-role-management
 * Required: Admin authentication
 * Body: { action: string, userId?: string, userIds?: string[], newRole?: string }
 */
const step: Step = Workflow({
  name: "User Role Management API",
  version: "1.0.0",
  description: "Advanced user role management with bulk operations, statistics, and automatic logging",
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
    workflowName: "user-role-management",
    actionType: "UPDATE",
    resourceType: "role",
    resourceId: "js/ctx.request.body.userId || ctx.request.body.userIds",
    resourceName: "js/ctx.request.body.newRole",
    riskLevel: "critical", // Role changes are critical risk
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
      // Check if user is authenticated and is an admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "ADMIN"')
        .addStep({
          name: "manage-roles",
          node: "user-role-manager",
          type: "module",
          inputs: {
            action: "js/ctx.request.body.action",
            userId: "js/ctx.request.body.userId",
            userIds: "js/ctx.request.body.userIds",
            newRole: "js/ctx.request.body.newRole",
            currentUserId: "js/ctx.vars.currentUser.id",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "user-role-management",
            actionType: "UPDATE",
            resourceType: "role",
            resourceId: "js/ctx.request.body.userId || ctx.request.body.userIds",
            resourceName: "js/ctx.request.body.newRole",
            riskLevel: "critical",
            contextData: {
              httpMethod: "POST",
              endpoint: "/api/user-role-management",
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
      
      // Check if user is authenticated but not admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role !== "admin"')
        .addStep({
          name: "forbidden-response",
          node: "@nanoservice-ts/api-call",
          type: "module",
          inputs: {
            url: "data:application/json;base64,eyJzdWNjZXNzIjpmYWxzZSwibWVzc2FnZSI6IkZvcmJpZGRlbi4gT25seSBhZG1pbnMgY2FuIG1hbmFnZSB1c2VyIHJvbGVzLiIsInN0YXR1c0NvZGUiOjQwM30=",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        })
        .addStep({
          name: "log-request-complete-forbidden",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "user-role-management",
            actionType: "UPDATE",
            resourceType: "role",
            resourceId: "js/ctx.request.body.userId || ctx.request.body.userIds",
            resourceName: "js/ctx.request.body.newRole",
            riskLevel: "critical",
            contextData: {
              httpMethod: "POST",
              endpoint: "/api/user-role-management",
              success: false,
              statusCode: 403,
              errorMessage: "Forbidden. Only admins can manage user roles.",
              userId: "js/ctx.vars.currentUser.id",
              userEmail: "js/ctx.vars.currentUser.email",
              userName: "js/ctx.vars.currentUser.name",
              userRole: "js/ctx.vars.currentUser.role",
              ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
              userAgent: "js/ctx.request.headers['user-agent']",
              requestBody: "js/ctx.request.body",
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
            workflowName: "user-role-management",
            actionType: "UPDATE",
            resourceType: "role",
            resourceId: "js/ctx.request.body.userId || ctx.request.body.userIds",
            resourceName: "js/ctx.request.body.newRole",
            riskLevel: "critical",
            contextData: {
              httpMethod: "POST",
              endpoint: "/api/user-role-management",
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
