import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Mark Notification Read API",
  version: "1.0.0",
  description: "Mark a notification as read or unread",
})
.addTrigger("http", {
  method: "ANY", // Accept both PUT and POST for flexibility
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
          name: "mark-notification",
          node: "mark-notification-read",
          type: "module",
          inputs: {
            notificationId: "js/ctx.request.body.notificationId",
            userId: "js/ctx.vars.currentUser.id",
            isRead: "js/ctx.request.body.isRead !== undefined ? ctx.request.body.isRead : true",
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
