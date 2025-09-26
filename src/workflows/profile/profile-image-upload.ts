import { AddElse, AddIf, type Step, Workflow } from "@nanoservice-ts/helper";

/**
 * Profile Image Upload Workflow
 * 
 * This workflow handles profile image uploads with authentication and validation:
 * 1. Check user authentication
 * 2. Upload and validate the image
 * 3. Return success response with image URL
 * 
 * Endpoint: POST /api/profile-image-upload
 * Required: Authentication token
 * Body: { base64: string, oldImagePath?: string }
 */
const step: Step = Workflow({
  name: "Profile Image Upload API",
  version: "1.0.0",
  description: "Upload and update user profile image with authentication",
})
.addTrigger("http", {
  method: "POST",
  path: "/",
  accept: "application/json",
})
.addCondition({
  node: {
    name: "auth-check",
    node: "authentication-checker",
    type: "module",
    inputs: {
      requireAuth: true,
      requestMethod: "js/ctx.request.method",
      requestPath: "js/ctx.request.path",
      headers: "js/ctx.request.headers",
      cookies: "js/ctx.request.cookies",
    },
  },
  conditions: () => {
    return [
      // Authenticated users can upload profile images
      new AddIf('ctx.vars.isAuthenticated === true')
        .addStep({
          name: "upload-image",
          node: "profile-image-upload",
          type: "module",
          inputs: {
            base64: "js/ctx.request.body.base64",
            userId: "js/ctx.vars.currentUser.id",
            oldImagePath: "js/ctx.request.body.oldImagePath",
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
        .build(),
    ];
  },
});

export default step;
