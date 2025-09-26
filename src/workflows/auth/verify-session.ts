import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Session Verification Workflow
 * 
 * Lightweight endpoint to verify if current session is valid
 * Returns user data if authenticated, 401 if not
 * 
 * Endpoint: GET /api/verify-session
 * No body required - uses cookies for authentication
 */
const step: Step = Workflow({
  name: "Session Verification API",
  version: "1.0.0",
  description: "Verify current user session and return user data",
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
      // If authenticated, return user data
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "return-user-data",
          node: "mapper",
          type: "module",
          inputs: {
            model: {
              success: true,
              user: "js/ctx.vars.currentUser",
              session: {
                id: "js/ctx.vars.currentSession.id",
                expiresAt: "js/ctx.vars.currentSession.expiresAt",
              },
              message: "Session valid",
              statusCode: 200
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
            message: "js/ctx.vars.authResult?.message || 'Session invalid or expired'",
            statusCode: "js/ctx.vars.authResult?.statusCode || 401",
          },
        })
        .build(),
    ];
  },
});

export default step;
