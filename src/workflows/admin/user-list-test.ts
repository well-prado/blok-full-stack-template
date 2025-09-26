import { type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "User List Test",
  version: "1.0.0",
  description: "Test workflow for user-list database node",
})
.addTrigger("http", {
  method: "GET",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "list-users",
  node: "user-list",
  type: "module",
  inputs: {
    page: "js/parseInt(ctx.request.query.page) || 1",
    limit: "js/parseInt(ctx.request.query.limit) || 20",
    sortBy: "js/ctx.request.query.sortBy || 'createdAt'",
    sortOrder: "js/ctx.request.query.sortOrder || 'desc'",
    search: "js/ctx.request.query.search",
    role: "js/ctx.request.query.role",
    emailVerified: "js/ctx.request.query.emailVerified === 'true' ? true : ctx.request.query.emailVerified === 'false' ? false : undefined",
  },
});

export default step;
