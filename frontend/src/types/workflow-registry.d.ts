/**
 * Workflow Type Registry
 * 
 * Central registry mapping workflow names to their input/output types.
 * Import types directly from workflow files to ensure complete type coverage.
 */

// Import types directly from workflow files (not from generated types)
import type {
  AdminLogsInput,
  AdminLogsOutput,
} from '../../../src/workflows/admin/admin-logs';

// Import other workflow types from blok-types (for workflows without explicit types)
import type {
  AuthLoginInput,
  AuthLoginOutput,
  AuthRegisterInput,
  AuthRegisterOutput,
  AuthLogoutInput,
  AuthLogoutOutput,
  VerifySessionInput,
  VerifySessionOutput,
  EmailVerificationInput,
  EmailVerificationOutput,
  PasswordResetInput,
  PasswordResetOutput,
  ProfileImageUploadInput,
  ProfileImageUploadOutput,
  ProfileUpdateInput,
  ProfileUpdateOutput,
  ThemePreferencesInput,
  ThemePreferencesOutput,
  UserNotificationsInput,
  UserNotificationsOutput,
  MarkNotificationReadInput,
  MarkNotificationReadOutput,
  ClearAllNotificationsInput,
  ClearAllNotificationsOutput,
  CreateNotificationInput,
  CreateNotificationOutput,
  AdminDashboardInput,
  AdminDashboardOutput,
  UserManagementInput,
  UserManagementOutput,
  UserRoleManagementInput,
  UserRoleManagementOutput,
  UserUpdateInput,
  UserUpdateOutput,
  UserDeleteInput,
  UserDeleteOutput,
  AdminUserCreateInput,
  AdminUserCreateOutput,
  TwoFactorAuthInput,
  TwoFactorAuthOutput,
  AuditLogsInput,
  AuditLogsOutput,
  WorkflowDiscoveryInput,
  WorkflowDiscoveryOutput,
} from '../blok-types/types';

/**
 * Global type registry for all workflows
 * Maps workflow names to their input and output types
 */
export interface WorkflowTypeRegistry {
  // Auth workflows
  'auth-login': { input: AuthLoginInput; output: AuthLoginOutput };
  'auth-register': { input: AuthRegisterInput; output: AuthRegisterOutput };
  'auth-logout': { input: AuthLogoutInput; output: AuthLogoutOutput };
  'verify-session': { input: VerifySessionInput; output: VerifySessionOutput };
  
  // Email workflows
  'email-verification': { input: EmailVerificationInput; output: EmailVerificationOutput };
  'password-reset': { input: PasswordResetInput; output: PasswordResetOutput };
  
  // Profile workflows
  'profile-image-upload': { input: ProfileImageUploadInput; output: ProfileImageUploadOutput };
  'profile-update': { input: ProfileUpdateInput; output: ProfileUpdateOutput };
  'theme-preferences': { input: ThemePreferencesInput; output: ThemePreferencesOutput };
  
  // Notification workflows
  'user-notifications': { input: UserNotificationsInput; output: UserNotificationsOutput };
  'mark-notification-read': { input: MarkNotificationReadInput; output: MarkNotificationReadOutput };
  'clear-all-notifications': { input: ClearAllNotificationsInput; output: ClearAllNotificationsOutput };
  'create-notification': { input: CreateNotificationInput; output: CreateNotificationOutput };
  
  // Admin workflows (using direct imports for complete types)
  'admin-dashboard': { input: AdminDashboardInput; output: AdminDashboardOutput };
  'admin-logs': { input: AdminLogsInput; output: AdminLogsOutput };
  'user-management': { input: UserManagementInput; output: UserManagementOutput };
  'user-role-management': { input: UserRoleManagementInput; output: UserRoleManagementOutput };
  'user-update': { input: UserUpdateInput; output: UserUpdateOutput };
  'user-delete': { input: UserDeleteInput; output: UserDeleteOutput };
  'admin-user-create': { input: AdminUserCreateInput; output: AdminUserCreateOutput };
  
  // Security workflows
  'two-factor-auth': { input: TwoFactorAuthInput; output: TwoFactorAuthOutput };
  'audit-logs': { input: AuditLogsInput; output: AuditLogsOutput };
  
  // Meta workflows
  'workflow-discovery': { input: WorkflowDiscoveryInput; output: WorkflowDiscoveryOutput };
}

// Export helper types for convenience
export type WorkflowName = keyof WorkflowTypeRegistry;
export type WorkflowInput<T extends WorkflowName> = WorkflowTypeRegistry[T]['input'];
export type WorkflowOutput<T extends WorkflowName> = WorkflowTypeRegistry[T]['output'];
