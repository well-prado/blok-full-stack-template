import { type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Password Validation Test",
  version: "1.0.0",
  description: "Test workflow for password-validator node",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "validate-password",
  node: "password-validator",
  type: "module",
  inputs: {
    password: "js/ctx.request.body.password",
    minLength: "js/ctx.request.body.minLength || 8",
    maxLength: "js/ctx.request.body.maxLength || 128",
    requireUppercase: "js/ctx.request.body.requireUppercase !== false",
    requireLowercase: "js/ctx.request.body.requireLowercase !== false",
    requireNumbers: "js/ctx.request.body.requireNumbers !== false",
    requireSpecialChars: "js/ctx.request.body.requireSpecialChars !== false",
    forbidCommonPasswords: "js/ctx.request.body.forbidCommonPasswords !== false",
    forbidPersonalInfo: "js/ctx.request.body.forbidPersonalInfo || []",
  },
});

export default step;
