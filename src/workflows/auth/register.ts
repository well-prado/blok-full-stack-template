import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Registration API",
  version: "1.0.0",
  description: "User registration workflow with automatic logging",
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
    requireAuth: false, // Allow both authenticated and anonymous registration
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
    workflowName: "user-register",
    actionType: "CREATE",
    resourceType: "user",
    resourceName: "js/ctx.request.body.email",
    riskLevel: "high", // User registration is high risk
  },
})
.addCondition({
  node: {
    name: "request-router",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // Handle registration request
      new AddIf('ctx.request.method.toLowerCase() === "post"')
        .addStep({
          name: "register-user",
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
          name: "create-welcome-notification",
          node: "create-notification",
          type: "module",
          inputs: {
            userId: "js/ctx.response?.data?.user?.id",
            title: "Welcome to Blok Admin!",
            message: "js/`Welcome ${ctx.request.body.name}! Your account has been created successfully. Explore the dashboard to get started with managing your profile and accessing all features.`",
            type: "success",
            priority: "medium",
            category: "user",
            actionUrl: "/dashboard",
            actionLabel: "Explore Dashboard",
            sourceWorkflow: "user-register",
            sourceNode: "user-register",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "user-register",
            actionType: "CREATE",
            resourceType: "user",
            resourceId: "js/ctx.response?.data?.user?.id",
            resourceName: "js/ctx.request.body.email",
            riskLevel: "high",
            userId: "js/ctx.vars?.currentUser?.id || 'system'",
            userEmail: "js/ctx.vars?.currentUser?.email || 'system@blok.app'",
            userName: "js/ctx.vars?.currentUser?.name || 'System'",
            userRole: "js/ctx.vars?.currentUser?.role || 'system'",
            httpMethod: "POST",
            endpoint: "/api/auth-register",
            success: "js/ctx.response?.success !== false",
            statusCode: "js/ctx.response?.success !== false ? 200 : 400",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
            responseData: "js/ctx.response?.data",
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
            message: "Method not allowed. Only POST is supported for registration.",
            statusCode: 405,
          },
        })
        .build(),
    ];
  },
});

export default step;
