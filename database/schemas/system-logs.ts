import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { sql } from 'drizzle-orm';

/**
 * System Logs Table - Enterprise Admin Log System
 * 
 * Comprehensive blame-tracking system for all POST/PUT/PATCH/DELETE operations
 * Following enterprise best practices for audit trails and accountability
 */
export const systemLogs = sqliteTable('system_logs', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  
  // WHO: User identification (required for blame tracking)
  userId: text('user_id').notNull(), // References users(id) but no FK for performance
  userEmail: text('user_email').notNull(), // Denormalized for faster queries
  userName: text('user_name').notNull(), // Snapshot at time of action
  userRole: text('user_role').notNull(), // Role at time of action
  
  // WHAT: Action details
  actionType: text('action_type').notNull(), // CREATE, UPDATE, DELETE, BULK_UPDATE, BULK_DELETE
  resourceType: text('resource_type').notNull(), // user, profile, settings, role, system
  resourceId: text('resource_id'), // ID of affected resource (nullable for bulk operations)
  resourceName: text('resource_name'), // Human-readable resource identifier
  
  // WHERE: Technical context
  httpMethod: text('http_method').notNull(), // POST, PUT, PATCH, DELETE
  endpoint: text('endpoint').notNull(), // API endpoint called
  workflowName: text('workflow_name'), // Blok workflow that processed the request
  nodeName: text('node_name'), // Specific Blok node that executed the action
  
  // WHEN: Precise timing
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  
  // OUTCOME: Success/failure tracking
  statusCode: integer('status_code').notNull(), // HTTP response status
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  errorMessage: text('error_message'), // Error details if failed
  executionTimeMs: integer('execution_time_ms'), // Performance tracking
  
  // CONTEXT: Request details (for forensic analysis)
  requestSize: integer('request_size'), // Size in bytes
  changesSummary: text('changes_summary'), // JSON summary of what changed
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  sessionId: text('session_id'), // Link to session for correlation
  
  // METADATA: Additional context
  affectedUsersCount: integer('affected_users_count').default(0), // For bulk operations
  complianceFlags: text('compliance_flags'), // JSON array of compliance tags
  riskLevel: text('risk_level').notNull().default('low'), // low, medium, high, critical
});

/**
 * Log Retention Policy Table
 * 
 * Manages automated log retention and cleanup policies
 */
export const logRetentionPolicy = sqliteTable('log_retention_policy', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  retentionDays: integer('retention_days').notNull().default(1095), // 3 years
  archiveDays: integer('archive_days').notNull().default(1825), // 5 years total
  lastCleanup: text('last_cleanup').default(sql`(datetime('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// TypeScript types for the system logs
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
export type LogRetentionPolicy = typeof logRetentionPolicy.$inferSelect;
export type NewLogRetentionPolicy = typeof logRetentionPolicy.$inferInsert;

// Enums for type safety
export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE', 
  DELETE = 'DELETE',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE'
}

export enum LogRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ResourceType {
  USER = 'user',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  ROLE = 'role',
  SYSTEM = 'system',
  AUTH = 'auth',
  SECURITY = 'security'
}

// System log entry interface for type safety
export interface SystemLogEntry {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  actionType: ActionType;
  resourceType: ResourceType | string;
  resourceId?: string;
  resourceName?: string;
  httpMethod: string;
  endpoint: string;
  workflowName?: string;
  nodeName?: string;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  executionTimeMs?: number;
  requestSize?: number;
  changesSummary?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  affectedUsersCount?: number;
  riskLevel: LogRiskLevel;
}
