import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { sql } from 'drizzle-orm';

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'), // Can be null for system events
  action: text('action').notNull(), // e.g., 'login', 'logout', 'role_change', '2fa_enabled'
  resource: text('resource'), // e.g., 'user', 'session', 'settings'
  resourceId: text('resource_id'), // ID of the affected resource
  details: text('details'), // JSON string with additional details
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  errorMessage: text('error_message'), // If success is false
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
