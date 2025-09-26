import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Protected Route Example",
  version: "1.0.0",
  description: "Example of a protected route using authentication-checker with if-else pattern",
})
.addTrigger("http", {
  method: "GET",
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
      // If authenticated, proceed with protected content
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "serve-protected-content",
          node: "mapper",
          type: "module",
          inputs: {
            model: {
              message: "Welcome to the protected dashboard!",
              user: "js/ctx.vars.currentUser",
              timestamp: "js/new Date().toISOString()",
              data: {
                dashboardStats: {
                  totalUsers: 150,
                  activeUsers: 45,
                  systemStatus: "healthy"
                }
              }
            }
          },
        })
        .build(),
      
      // If not authenticated, return 401
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
