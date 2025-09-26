import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Notifications API",
  version: "1.0.0",
  description: "Get user notifications with pagination and filtering",
})
.addTrigger("http", {
  method: "GET",
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
          name: "get-notifications",
          node: "get-user-notifications",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            limit: "js/parseInt(ctx.request.query.limit) || 50",
            offset: "js/parseInt(ctx.request.query.offset) || 0",
            unreadOnly: "js/ctx.request.query.unreadOnly === 'true'",
            includeExpired: "js/ctx.request.query.includeExpired === 'true'",
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
