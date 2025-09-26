import { type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "workflow-discovery",
  version: "1.0.0",
  description: "Discover all available workflows with their schemas and metadata for SDK generation",
})
.addTrigger("http", {
  method: "ANY",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "check-auth",
  node: "authentication-checker",
  type: "module",
  inputs: {
    requireAuth: false, // Allow both authenticated and unauthenticated access
    requestMethod: "js/ctx.request.method",
    requestPath: "js/ctx.request.path",
    headers: "js/ctx.request.headers",
    cookies: "js/ctx.request.cookies",
  },
})
.addStep({
  name: "discover-workflows",
  node: "workflow-discovery",
  type: "module",
  inputs: {
    includeSchemas: "js/(ctx.request.body?.includeSchemas !== undefined ? ctx.request.body.includeSchemas : ctx.request.query.includeSchemas !== 'false')", // Default true
    filterByRole: "js/(ctx.request.body?.filterByRole !== undefined ? ctx.request.body.filterByRole : (ctx.request.query.filterByRole !== 'false' && ctx.request.query.filterByRole !== false))",     // Default true
  },
});

export default step;
