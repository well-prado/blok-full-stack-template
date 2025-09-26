import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

const step: Step = Workflow({
  name: "Admin Dashboard",
  version: "1.0.0",
  description: "Admin dashboard with system statistics and user overview",
})
.addTrigger("http", {
  method: "GET",
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
      // If authenticated and admin, show dashboard
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role === "admin"')
        .addStep({
          name: "get-user-stats",
          node: "user-list",
          type: "module",
          inputs: {
            page: 1,
            limit: 1, // Just get count, not actual users
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        })
        .addStep({
          name: "build-dashboard-response",
          node: "mapper",
          type: "module",
          inputs: {
            model: {
              success: true,
              dashboard: {
                title: "Admin Dashboard",
                user: "js/ctx.vars.currentUser",
                stats: {
                  totalUsers: "js/ctx.vars.userListResult?.pagination?.totalUsers || 0",
                  adminUsers: "js/ctx.vars.userListResult?.users?.filter(u => u.role === 'admin').length || 0",
                  regularUsers: "js/ctx.vars.userListResult?.users?.filter(u => u.role === 'user').length || 0",
                  verifiedUsers: "js/ctx.vars.userListResult?.users?.filter(u => u.emailVerified).length || 0",
                },
                recentActivity: {
                  lastLogin: "js/new Date().toISOString()",
                  systemStatus: "healthy",
                  uptime: "js/process.uptime()",
                },
                quickActions: [
                  { name: "View All Users", endpoint: "/api/user-management", method: "GET" },
                  { name: "Create User", endpoint: "/api/user-management", method: "POST" },
                  { name: "System Settings", endpoint: "/api/admin-settings", method: "GET" }
                ]
              },
              statusCode: 200
            }
          },
        })
        .build(),

      // If authenticated but not admin
      new AddIf('ctx.vars.isAuthenticated === true && ctx.vars.currentUser?.role !== "admin"')
        .addStep({
          name: "forbidden",
          node: "error",
          type: "module",
          inputs: {
            message: "Admin access required for dashboard",
            statusCode: 403,
          },
        })
        .build(),

      // If not authenticated
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
