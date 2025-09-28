import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Admin User Creation Workflow
 * 
 * This workflow handles user creation by administrators.
 * Unlike public registration, this requires admin authentication
 * and logs the admin who created the user.
 * 
 * Endpoint: POST /api/admin-user-create
 * Required: Admin authentication
 * Body: { name: string, email: string, password: string, role?: string }
 */
const step: Step = Workflow({
  name: "Admin User Creation API",
  version: "1.0.0",
  description: "Admin-only user creation workflow with proper attribution logging",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "check-auth",
  node: "authentication-checker",
  type: "module",
  inputs: {
    requireAuth: true,
    requestMethod: "js/ctx.request.method",
    requestPath: "js/ctx.request.path",
    headers: "js/ctx.request.headers || {}",
    cookies: "js/ctx.request.cookies || {}",
    sessionDurationHours: 1,
  },
})
.addStep({
  name: "log-request-start",
  node: "request-interceptor",
  type: "module",
  inputs: {
    phase: "start",
    workflowName: "admin-user-create",
    actionType: "CREATE",
    resourceType: "user",
    resourceName: "js/ctx.request.body.email",
    riskLevel: "high", // Admin creating users is high risk
  },
})
.addCondition({
  node: {
    name: "auth-result-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // If authenticated and admin, create user
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role === "ADMIN"')
        .addStep({
          name: "create-user",
          node: "user-register",
          type: "module",
          inputs: {
            email: "js/ctx.request.body.email",
            password: "js/ctx.request.body.password",
            name: "js/ctx.request.body.name",
            role: "js/ctx.request.body.role || 'user'",
          },
        })
        .addStep({
          name: "create-welcome-notification-for-new-user",
          node: "create-notification",
          type: "module",
          inputs: {
            userId: "js/ctx.response?.data?.user?.id",
            title: "Account Created by Administrator",
            message: "js/`Welcome ${ctx.request.body.name}! Your account has been created by an administrator. You can now log in and access the system. Please update your profile and change your password for security.`",
            type: "info",
            priority: "high",
            category: "user",
            actionUrl: "/profile",
            actionLabel: "Update Profile",
            sourceWorkflow: "admin-user-create",
            sourceNode: "user-register",
          },
        })
        .addStep({
          name: "create-admin-confirmation-notification",
          node: "create-notification",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            title: "User Account Created Successfully",
            message: "js/`You have successfully created a new ${ctx.request.body.role || 'user'} account for ${ctx.request.body.name} (${ctx.request.body.email}). The user has been notified and can now access the system.`",
            type: "success",
            priority: "medium",
            category: "admin",
            actionUrl: "/users",
            actionLabel: "Manage Users",
            sourceWorkflow: "admin-user-create",
            sourceNode: "user-register",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "admin-user-create",
            actionType: "CREATE",
            resourceType: "user",
            resourceId: "js/ctx.response?.data?.user?.id",
            resourceName: "js/ctx.request.body.email",
            riskLevel: "high",
            userId: "js/ctx.vars.currentUser.id",
            userEmail: "js/ctx.vars.currentUser.email",
            userName: "js/ctx.vars.currentUser.name",
            userRole: "js/ctx.vars.currentUser.role",
            httpMethod: "POST",
            endpoint: "/api/admin-user-create",
            success: "js/ctx.response?.success !== false",
            statusCode: "js/ctx.response?.success !== false ? 201 : 400",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
            responseData: "js/ctx.response?.data",
          },
        })
        .build(),

      // If authenticated but not admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role !== "admin"')
        .addStep({
          name: "log-request-complete-forbidden",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "admin-user-create",
            actionType: "CREATE",
            resourceType: "user",
            riskLevel: "high",
            userId: "js/ctx.vars.currentUser.id",
            userEmail: "js/ctx.vars.currentUser.email",
            userName: "js/ctx.vars.currentUser.name",
            userRole: "js/ctx.vars.currentUser.role",
            httpMethod: "POST",
            endpoint: "/api/admin-user-create",
            success: false,
            statusCode: 403,
            errorMessage: "Admin access required to create users",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
          },
        })
        .addStep({
          name: "forbidden",
          node: "error",
          type: "module",
          inputs: {
            message: "Admin access required to create users",
            statusCode: 403,
          },
        })
        .build(),

      // If not authenticated
      new AddElse()
        .addStep({
          name: "log-request-complete-unauthorized",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "admin-user-create",
            actionType: "CREATE",
            resourceType: "user",
            riskLevel: "high",
            userId: "system",
            userEmail: "system@blok.app",
            userName: "System",
            userRole: "system",
            httpMethod: "POST",
            endpoint: "/api/admin-user-create",
            success: false,
            statusCode: 401,
            errorMessage: "Authentication required to create users",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
          },
        })
        .addStep({
          name: "unauthorized",
          node: "error",
          type: "module",
          inputs: {
            message: "js/ctx.vars.authResult?.message || 'Authentication required'",
            statusCode: "js/ctx.vars.authResult?.statusCode || 401",
          },
        })
        .build(),
    ];
  },
});

export default step;
