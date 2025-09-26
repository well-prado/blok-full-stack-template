import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Theme Preferences Update Workflow
 * 
 * This workflow handles theme preference updates with authentication:
 * 1. Check user authentication
 * 2. Update user theme preferences in database
 * 3. Return success response
 * 
 * Endpoint: PUT /api/theme-preferences
 * Required: Authentication token
 * Body: { themeId, themeMode }
 */
const step: Step = Workflow({
  name: "Theme Preferences API",
  version: "1.0.0",
  description: "Update user theme preferences with authentication",
})
.addTrigger("http", {
  method: "ANY", // Accept both PUT and POST for flexibility
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
      // If authenticated, update theme preferences
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "update-theme-preferences",
          node: "theme-preference-update",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            themeId: "js/ctx.request.body.themeId",
            themeMode: "js/ctx.request.body.themeMode",
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
