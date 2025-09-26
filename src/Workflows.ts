// Notification Workflows
import * as NotificationWorkflows from "./workflows/notifications";
// Meta Workflows
import * as MetaWorkflows from "./workflows/meta";

import type Workflows from "./runner/types/Workflows";
// Admin Workflows
import adminDashboard from "./workflows/admin/dashboard";
import adminLogs from "./workflows/admin/admin-logs";
// Security Workflows
import auditLogs from "./workflows/security/audit-logs";
// Authentication Workflows
import authLogin from "./workflows/auth/login";
import authLogout from "./workflows/auth/logout";
import authRegister from "./workflows/auth/register";
import countriesFactsHelper from "./workflows/countries-cats-helper";
import countriesHelper from "./workflows/countries-helper";
// Email Workflows
import emailServiceConfig from "./workflows/email/email-service-config";
// Validation Workflows
import emailValidationTest from "./workflows/validation/email-validation-test";
import emailVerification from "./workflows/email/email-verification";
import empty from "./workflows/empty";
import passwordReset from "./workflows/email/password-reset";
import passwordValidationTest from "./workflows/validation/password-validation-test";
// Profile Workflows
import profileImageUpload from "./workflows/profile/profile-image-upload";
import profileUpdate from "./workflows/profile/profile-update";
import protectedExample from "./workflows/auth/protected-example";
import rateLimitTest from "./workflows/security/rate-limit-test";
import themePreferences from "./workflows/profile/theme-preferences";
import twoFactorAuth from "./workflows/security/two-factor-auth";
import userDelete from "./workflows/admin/user-delete";
import userFindTest from "./workflows/admin/user-find-test";
import userListTest from "./workflows/admin/user-list-test";
import userManagement from "./workflows/admin/user-management";
import userRoleManagement from "./workflows/admin/user-role-management";
import userUpdate from "./workflows/admin/user-update";
import adminUserCreate from "./workflows/admin/admin-user-create";
import verifySession from "./workflows/auth/verify-session";

const workflows: Workflows = {
    "countries-helper": countriesHelper,
    "countries-cats-helper": countriesFactsHelper,
    "empty-helper": empty,
    // Authentication API Endpoints
    "auth-login": authLogin,
    "auth-register": authRegister,
    "auth-logout": authLogout,
    "verify-session": verifySession,
    "protected-example": protectedExample,
    // Email API Endpoints
    "email-service-config": emailServiceConfig,
    "email-verification": emailVerification,
    "password-reset": passwordReset,
    // Profile API Endpoints
    "profile-image-upload": profileImageUpload,
    "profile-update": profileUpdate,
    "theme-preferences": themePreferences,
    // Notification API Endpoints
    "user-notifications": NotificationWorkflows.UserNotifications,
    "mark-notification-read": NotificationWorkflows.MarkNotificationRead,
    "clear-all-notifications": NotificationWorkflows.ClearAllNotifications,
    "create-notification": NotificationWorkflows.CreateNotification,
	// Admin API Endpoints
	"admin-dashboard": adminDashboard,
	"admin-logs": adminLogs,
	"user-management": userManagement,
	"user-role-management": userRoleManagement,
	"user-update": userUpdate,
	"user-delete": userDelete,
	"admin-user-create": adminUserCreate,
	// Test Endpoints (remove in production)
	"user-list-test": userListTest,
	"user-find-test": userFindTest,
	// Validation Test Endpoints
	"email-validation-test": emailValidationTest,
	"password-validation-test": passwordValidationTest,
	// Security API Endpoints
	"two-factor-auth": twoFactorAuth,
	"audit-logs": auditLogs,
	// Security Test Endpoints
	"rate-limit-test": rateLimitTest,
	// Meta API Endpoints
	"workflow-discovery": MetaWorkflows.WorkflowDiscovery,
};

export default workflows;
