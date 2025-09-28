import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Management API",
  version: "1.0.0",
  description: "Admin workflow for user management operations (list, find, update, delete)",
})
.addTrigger("http", {
  method: "ANY",
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
.addCondition({
  node: {
    name: "auth-result-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // If authenticated and admin, handle user management operations
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role === "ADMIN"')
        .addStep({
          name: "handle-user-management",
          node: "user-list", // Default to listing users for GET requests
          type: "module",
          inputs: {
            page: "js/parseInt(ctx.request.query.page) || 1",
            limit: "js/parseInt(ctx.request.query.limit) || 20",
            sortBy: "js/ctx.request.query.sortBy || 'createdAt'",
            sortOrder: "js/ctx.request.query.sortOrder || 'desc'",
            search: "js/ctx.request.query.search",
            role: "js/ctx.request.query.role",
            emailVerified: "js/ctx.request.query.emailVerified === 'true' ? true : ctx.request.query.emailVerified === 'false' ? false : undefined",
          },
        })
        .build(),

      // If authenticated but not admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role !== "admin"')
        .addStep({
          name: "forbidden",
          node: "error",
          type: "module",
          inputs: {
            message: "Admin access required",
            statusCode: 403,
          },
        })
        .build(),

      // If not authenticated
      new AddElse()
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