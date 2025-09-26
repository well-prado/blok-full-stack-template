import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Logout API",
  version: "1.0.0",
  description: "User logout workflow with session cleanup",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addCondition({
  node: {
    name: "request-router",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // Handle logout request
      new AddIf('ctx.request.method.toLowerCase() === "post"')
        .addStep({
          name: "logout-user",
          node: "user-logout",
          type: "module",
          inputs: {
            headers: "js/ctx.request.headers",
            cookies: "js/ctx.request.cookies",
            logoutAll: "js/ctx.request.body.logoutAll || false",
            userId: "js/ctx.request.body.userId",
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
            message: "Method not allowed. Only POST is supported for logout.",
            statusCode: 405,
          },
        })
        .build(),
    ];
  },
});

export default step;
