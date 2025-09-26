import { type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Email Validation Test",
  version: "1.0.0",
  description: "Test workflow for email-validator node",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "validate-email",
  node: "email-validator",
  type: "module",
  inputs: {
    email: "js/ctx.request.body.email",
    checkDomain: "js/ctx.request.body.checkDomain !== false",
    allowDisposable: "js/ctx.request.body.allowDisposable === true",
  },
});

export default step;
