// Generated types from workflow files
// This file is auto-generated - do not edit manually

export interface WorkflowMetadata {
  name: string;
  version: string;
  description: string;
  path: string;
  trigger?: {
    method: string;
    path: string;
    accept: string;
  };
}

export const WorkflowRegistry = {
  "auth-login": {
  "name": "auth-login",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: auth-login",
  "path": "@well-prado/blok-admin-dashboard/auth-login",
  "trigger": {
    "method": "ANY",
    "path": "/auth-login",
    "accept": "application/json"
  }
},
  "auth-register": {
  "name": "auth-register",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: auth-register",
  "path": "@well-prado/blok-admin-dashboard/auth-register",
  "trigger": {
    "method": "ANY",
    "path": "/auth-register",
    "accept": "application/json"
  }
},
  "auth-logout": {
  "name": "auth-logout",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: auth-logout",
  "path": "@well-prado/blok-admin-dashboard/auth-logout",
  "trigger": {
    "method": "ANY",
    "path": "/auth-logout",
    "accept": "application/json"
  }
},
  "auth-verify-session": {
  "name": "auth-verify-session",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: auth-verify-session",
  "path": "@well-prado/blok-admin-dashboard/auth-verify-session",
  "trigger": {
    "method": "ANY",
    "path": "/auth-verify-session",
    "accept": "application/json"
  }
},
  "admin-dashboard": {
  "name": "admin-dashboard",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: admin-dashboard",
  "path": "@well-prado/blok-admin-dashboard/admin-dashboard",
  "trigger": {
    "method": "ANY",
    "path": "/admin-dashboard",
    "accept": "application/json"
  }
},
  "admin-user-management": {
  "name": "admin-user-management",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: admin-user-management",
  "path": "@well-prado/blok-admin-dashboard/admin-user-management",
  "trigger": {
    "method": "ANY",
    "path": "/admin-user-management",
    "accept": "application/json"
  }
},
  "admin-user-role-management": {
  "name": "admin-user-role-management",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: admin-user-role-management",
  "path": "@well-prado/blok-admin-dashboard/admin-user-role-management",
  "trigger": {
    "method": "ANY",
    "path": "/admin-user-role-management",
    "accept": "application/json"
  }
},
  "profile-update": {
  "name": "profile-update",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: profile-update",
  "path": "@well-prado/blok-admin-dashboard/profile-update",
  "trigger": {
    "method": "ANY",
    "path": "/profile-update",
    "accept": "application/json"
  }
},
  "profile-image-upload": {
  "name": "profile-image-upload",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: profile-image-upload",
  "path": "@well-prado/blok-admin-dashboard/profile-image-upload",
  "trigger": {
    "method": "ANY",
    "path": "/profile-image-upload",
    "accept": "application/json"
  }
},
  "security-two-factor-auth": {
  "name": "security-two-factor-auth",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: security-two-factor-auth",
  "path": "@well-prado/blok-admin-dashboard/security-two-factor-auth",
  "trigger": {
    "method": "ANY",
    "path": "/security-two-factor-auth",
    "accept": "application/json"
  }
},
  "security-audit-logs": {
  "name": "security-audit-logs",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: security-audit-logs",
  "path": "@well-prado/blok-admin-dashboard/security-audit-logs",
  "trigger": {
    "method": "ANY",
    "path": "/security-audit-logs",
    "accept": "application/json"
  }
},
  "email-verification": {
  "name": "email-verification",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: email-verification",
  "path": "@well-prado/blok-admin-dashboard/email-verification",
  "trigger": {
    "method": "ANY",
    "path": "/email-verification",
    "accept": "application/json"
  }
},
  "email-password-reset": {
  "name": "email-password-reset",
  "version": "1.0.0",
  "description": "Admin dashboard workflow: email-password-reset",
  "path": "@well-prado/blok-admin-dashboard/email-password-reset",
  "trigger": {
    "method": "ANY",
    "path": "/email-password-reset",
    "accept": "application/json"
  }
}
} as const;

export type WorkflowKeys = keyof typeof WorkflowRegistry;

// Type-safe workflow caller
export type WorkflowInput<T extends WorkflowKeys> = any; // TODO: Extract from workflow definitions
export type WorkflowOutput<T extends WorkflowKeys> = any; // TODO: Extract from workflow definitions

