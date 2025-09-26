import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Admin User Update",
  version: "1.0.0",
  description: "Admin workflow to update user information with automatic logging",
})
.addTrigger("http", {
  method: "ANY", // Accept both PUT and POST for flexibility
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "log-request-start",
  node: "request-interceptor",
  type: "module",
  inputs: {
    phase: "start",
    workflowName: "user-update",
    resourceType: "user",
    resourceId: "js/ctx.request.body.id",
    resourceName: "js/ctx.request.body.name || ctx.request.body.email",
    riskLevel: "high", // User updates are high risk
  },
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
.addCondition({
  node: {
    name: "auth-result-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // If authenticated and admin, update user
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role === "admin"')
        .addStep({
          name: "update-user",
          node: "user-update",
          type: "module",
          inputs: {
            id: "js/ctx.request.body.id",
            email: "js/ctx.request.body.email",
            name: "js/ctx.request.body.name",
            role: "js/ctx.request.body.role",
            emailVerified: "js/ctx.request.body.emailVerified",
            password: "js/ctx.request.body.password",
            saltRounds: "js/ctx.request.body.saltRounds || 12",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "user-update",
            success: true,
            statusCode: 200,
            responseData: "js/ctx.response.data",
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
            workflowName: "user-update",
            success: false,
            statusCode: 403,
            errorMessage: "Admin access required to update users",
          },
        })
        .addStep({
          name: "forbidden",
          node: "error",
          type: "module",
          inputs: {
            message: "Admin access required to update users",
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
            workflowName: "user-update",
            success: false,
            statusCode: "js/ctx.vars.authResult?.statusCode || 401",
            errorMessage: "js/ctx.vars.authResult?.message || 'Authentication required'",
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
