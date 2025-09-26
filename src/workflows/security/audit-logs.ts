import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Audit Logs Workflow
 * 
 * This workflow handles audit log operations:
 * - Query audit logs with filtering
 * - Get recent activity summaries
 * - Security event monitoring
 * 
 * Endpoint: GET/POST /api/audit-logs
 * Required: Admin authentication
 * Query/Body: { action?: string, limit?: number, offset?: number, filters... }
 */
const step: Step = Workflow({
  name: "Audit Logs API",
  version: "1.0.0",
  description: "Query and monitor security audit logs",
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
    name: "auth-result-handler",
    node: "@nanoservice-ts/if-else",
    type: "module",
  },
  conditions: () => {
    return [
      // Only admins can access audit logs
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser.role === "admin"')
        .addStep({
          name: "query-audit-logs",
          node: "audit-logger",
          type: "module",
          inputs: {
            action: "js/'getRecentActivity'",
            limit: "js/20",
            offset: "js/0",
          },
        })
        .build(),
      
      // Unauthorized response for non-admin or unauthenticated users
      new AddElse()
        .addStep({
          name: "unauthorized-response",
          node: "error",
          type: "module",
          inputs: {
            message: "js/'Unauthorized. Admin access required.'",
            statusCode: "js/401",
          },
        })
        .build(),
    ];
  },
});

export default step;
