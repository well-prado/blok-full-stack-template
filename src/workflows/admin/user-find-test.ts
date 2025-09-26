import { type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User Find Test",
  version: "1.0.0",
  description: "Test workflow for user-find database node",
})
.addTrigger("http", {
  method: "GET",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "find-user",
  node: "user-find",
  type: "module",
  inputs: {
    id: "js/ctx.request.query.id",
    email: "js/ctx.request.query.email",
    includePassword: "js/ctx.request.query.includePassword === 'true'",
  },
});

export default step;
