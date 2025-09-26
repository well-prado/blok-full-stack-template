import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Profile Update Workflow
 * 
 * This workflow handles comprehensive user profile updates with authentication:
 * 1. Check user authentication
 * 2. Update user profile information (name, email, password, preferences)
 * 3. Return updated user data
 * 
 * Endpoint: PUT /api/profile-update
 * Required: Authentication token
 * Body: { name?, email?, currentPassword?, newPassword?, preferences? }
 */
const step: Step = Workflow({
  name: "Profile Update API",
  version: "1.0.0",
  description: "Update user profile information with authentication, validation, and automatic logging",
})
.addTrigger("http", {
  method: "ANY", // Accept both PUT and POST for flexibility
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
.addStep({
  name: "log-request-start",
  node: "request-interceptor",
  type: "module",
  inputs: {
    phase: "start",
    workflowName: "profile-update",
    actionType: "UPDATE",
    resourceType: "profile",
    resourceName: "js/ctx.request.body.email || ctx.request.body.name",
    riskLevel: "medium", // Profile updates are medium risk
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
      // Authenticated users can update their profiles
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "update-profile",
          node: "user-profile-update",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            name: "js/ctx.request.body.name",
            email: "js/ctx.request.body.email",
            currentPassword: "js/ctx.request.body.currentPassword",
            newPassword: "js/ctx.request.body.newPassword",
            profileImage: "js/ctx.request.body.profileImage",
            preferences: "js/ctx.request.body.preferences",
          },
        })
        .addStep({
          name: "create-profile-update-notification",
          node: "create-notification",
          type: "module",
          inputs: {
            userId: "js/ctx.vars.currentUser.id",
            title: "js/ctx.request.body.newPassword ? 'Profile and Password Updated' : 'Profile Updated Successfully'",
            message: "js/ctx.request.body.newPassword ? 'Your profile information and password have been updated successfully. If you did not make these changes, please contact support immediately.' : 'Your profile information has been updated successfully.'",
            type: "success",
            priority: "js/ctx.request.body.newPassword ? 'high' : 'medium'",
            category: "user",
            actionUrl: "/profile",
            actionLabel: "View Profile",
            sourceWorkflow: "profile-update",
            sourceNode: "user-profile-update",
          },
        })
        .addStep({
          name: "log-request-complete-success",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "profile-update",
            actionType: "UPDATE",
            resourceType: "profile",
            resourceId: "js/ctx.vars.currentUser.id",
            resourceName: "js/ctx.request.body.email || ctx.request.body.name || ctx.vars.currentUser.email",
            riskLevel: "medium",
            userId: "js/ctx.vars.currentUser.id",
            userEmail: "js/ctx.vars.currentUser.email",
            userName: "js/ctx.vars.currentUser.name",
            userRole: "js/ctx.vars.currentUser.role",
            httpMethod: "PUT",
            endpoint: "/api/profile-update",
            success: "js/ctx.response?.success !== false",
            statusCode: "js/ctx.response?.success !== false ? 200 : 400",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
            responseData: "js/ctx.response?.data",
          },
        })
        .build(),
      // Unauthorized response
      new AddElse()
        .addStep({
          name: "unauthorized-response",
          node: "@nanoservice-ts/api-call",
          type: "module",
          inputs: {
            url: "data:application/json;base64,eyJzdWNjZXNzIjpmYWxzZSwibWVzc2FnZSI6IlVuYXV0aG9yaXplZC4gUGxlYXNlIGxvZyBpbi4iLCJzdGF0dXNDb2RlIjo0MDF9",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        })
        .addStep({
          name: "log-request-complete-unauthorized",
          node: "request-interceptor",
          type: "module",
          inputs: {
            phase: "complete",
            workflowName: "profile-update",
            actionType: "UPDATE",
            resourceType: "profile",
            resourceName: "js/ctx.request.body.email || ctx.request.body.name",
            riskLevel: "medium",
            userId: "anonymous",
            userEmail: "anonymous@unknown",
            userName: "Anonymous",
            userRole: "none",
            httpMethod: "PUT",
            endpoint: "/api/profile-update",
            success: false,
            statusCode: 401,
            errorMessage: "Unauthorized. Please log in.",
            ipAddress: "js/ctx.request.headers['x-forwarded-for'] || ctx.request.connection?.remoteAddress || 'unknown'",
            userAgent: "js/ctx.request.headers['user-agent']",
            requestBody: "js/ctx.request.body",
          },
        })
        .build(),
    ];
  },
});

export default step;
