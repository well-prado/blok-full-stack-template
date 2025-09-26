import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Clear All Notifications API",
  version: "1.0.0",
  description: "Clear all notifications for a user",
})
.addTrigger("http", {
  method: "ANY", // Accept both DELETE and POST for flexibility
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "auth-check",
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
    name: "auth-flow",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      new AddIf("ctx.vars.isAuthenticated === true")
        .addStep({
          name: "clear-notifications",
          node: "clear-all-notifications",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            markAsRead: "js/ctx.request.body.markAsRead || false",
            olderThanDays: "js/ctx.request.body.olderThanDays",
          },
        })
        .build(),
      
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
