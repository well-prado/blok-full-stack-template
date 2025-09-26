import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Login API",
  version: "1.0.0",
  description: "User login workflow with authentication",
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
      // Handle login request
      new AddIf('ctx.request.method.toLowerCase() === "post"')
        .addStep({
          name: "validate-login-data",
          node: "user-login",
          type: "module",
          inputs: {
            email: "js/ctx.request.body.email",
            password: "js/ctx.request.body.password",
            sessionDurationHours: "js/ctx.request.body.sessionDurationHours || 1",
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
            message: "Method not allowed. Only POST is supported for login.",
            statusCode: 405,
          },
        })
        .build(),
    ];
  },
});

export default step;
