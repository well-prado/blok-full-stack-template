import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Create Notification API",
  version: "1.0.0",
  description: "Create a new notification for a user (admin only or system)",
})
.addTrigger("http", {
  method: "POST",
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
      new AddIf("ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === 'admin'")
        .addStep({
          name: "create-notification",
          node: "create-notification",
          type: "module",
          inputs: {
            userId: "js/ctx.request.body.userId",
            title: "js/ctx.request.body.title",
            message: "js/ctx.request.body.message",
            type: "js/ctx.request.body.type || 'info'",
            priority: "js/ctx.request.body.priority || 'medium'",
            actionUrl: "js/ctx.request.body.actionUrl",
            actionLabel: "js/ctx.request.body.actionLabel",
            category: "js/ctx.request.body.category",
            metadata: "js/ctx.request.body.metadata",
            sourceWorkflow: "js/ctx.request.body.sourceWorkflow",
            sourceNode: "js/ctx.request.body.sourceNode",
            expiresAt: "js/ctx.request.body.expiresAt",
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
