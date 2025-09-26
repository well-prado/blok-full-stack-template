// Generated React hooks from workflow files
// This file is auto-generated - do not edit manually

import { useWorkflowQuery, useWorkflowMutation } from '@well-prado/blok-react-sdk';

// Re-export base hooks
export { useWorkflowQuery, useWorkflowMutation };


// auth-login
export const useAuthLoginQuery = (input?: any) => 
  useWorkflowQuery('auth-login', input);

export const useAuthLoginMutation = () => 
  useWorkflowMutation('auth-login');

// auth-register
export const useAuthRegisterQuery = (input?: any) => 
  useWorkflowQuery('auth-register', input);

export const useAuthRegisterMutation = () => 
  useWorkflowMutation('auth-register');

// auth-logout
export const useAuthLogoutQuery = (input?: any) => 
  useWorkflowQuery('auth-logout', input);

export const useAuthLogoutMutation = () => 
  useWorkflowMutation('auth-logout');

// auth-verify-session
export const useAuthVerifySessionQuery = (input?: any) => 
  useWorkflowQuery('auth-verify-session', input);

export const useAuthVerifySessionMutation = () => 
  useWorkflowMutation('auth-verify-session');

// admin-dashboard
export const useAdminDashboardQuery = (input?: any) => 
  useWorkflowQuery('admin-dashboard', input);

export const useAdminDashboardMutation = () => 
  useWorkflowMutation('admin-dashboard');

// admin-user-management
export const useAdminUserManagementQuery = (input?: any) => 
  useWorkflowQuery('admin-user-management', input);

export const useAdminUserManagementMutation = () => 
  useWorkflowMutation('admin-user-management');

// admin-user-role-management
export const useAdminUserRoleManagementQuery = (input?: any) => 
  useWorkflowQuery('admin-user-role-management', input);

export const useAdminUserRoleManagementMutation = () => 
  useWorkflowMutation('admin-user-role-management');

// profile-update
export const useProfileUpdateQuery = (input?: any) => 
  useWorkflowQuery('profile-update', input);

export const useProfileUpdateMutation = () => 
  useWorkflowMutation('profile-update');

// profile-image-upload
export const useProfileImageUploadQuery = (input?: any) => 
  useWorkflowQuery('profile-image-upload', input);

export const useProfileImageUploadMutation = () => 
  useWorkflowMutation('profile-image-upload');

// security-two-factor-auth
export const useSecurityTwoFactorAuthQuery = (input?: any) => 
  useWorkflowQuery('security-two-factor-auth', input);

export const useSecurityTwoFactorAuthMutation = () => 
  useWorkflowMutation('security-two-factor-auth');

// security-audit-logs
export const useSecurityAuditLogsQuery = (input?: any) => 
  useWorkflowQuery('security-audit-logs', input);

export const useSecurityAuditLogsMutation = () => 
  useWorkflowMutation('security-audit-logs');

// email-verification
export const useEmailVerificationQuery = (input?: any) => 
  useWorkflowQuery('email-verification', input);

export const useEmailVerificationMutation = () => 
  useWorkflowMutation('email-verification');

// email-password-reset
export const useEmailPasswordResetQuery = (input?: any) => 
  useWorkflowQuery('email-password-reset', input);

export const useEmailPasswordResetMutation = () => 
  useWorkflowMutation('email-password-reset');


// Export all workflow keys
export const workflowKeys = ['auth-login', 'auth-register', 'auth-logout', 'auth-verify-session', 'admin-dashboard', 'admin-user-management', 'admin-user-role-management', 'profile-update', 'profile-image-upload', 'security-two-factor-auth', 'security-audit-logs', 'email-verification', 'email-password-reset'] as const;
