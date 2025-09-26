import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Rate Limit Test",
  version: "1.0.0",
  description: "Test workflow for rate-limiter node with protection",
})
.addTrigger("http", {
  method: "ANY",
  path: "/",
  accept: "application/json",
})
.addStep({
  name: "check-rate-limit",
  node: "rate-limiter",
  type: "module",
  inputs: {
    identifier: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.ip || 'unknown'",
    windowMs: "js/ctx.request.body?.windowMs || 60000", // 1 minute
    maxRequests: "js/ctx.request.body?.maxRequests || 10", // 10 requests per minute
  },
})
.addCondition({
  node: {
    name: "rate-limit-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // If rate limit allows request
      new AddIf('ctx.vars.isRateLimited !== true')
        .addStep({
          name: "allowed-response",
          node: "mapper",
          type: "module",
          inputs: {
            model: {
              success: true,
              message: "Request allowed",
              rateLimit: "js/ctx.vars.rateLimitInfo",
              data: {
                timestamp: "js/new Date().toISOString()",
                requestInfo: {
                  method: "js/ctx.request.method",
                  path: "js/ctx.request.path",
                  ip: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.ip || 'unknown'"
                }
              }
            }
          },
        })
        .build(),

      // If rate limited
      new AddElse()
        .addStep({
          name: "rate-limited-response",
          node: "error",
          type: "module",
          inputs: {
            message: "js/ctx.vars.rateLimitInfo?.retryAfter ? `Rate limit exceeded. Try again in ${ctx.vars.rateLimitInfo.retryAfter} seconds` : 'Rate limit exceeded'",
            statusCode: 429,
          },
        })
        .build(),
    ];
  },
});

export default step;
