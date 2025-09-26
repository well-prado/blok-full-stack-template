import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification content
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { 
    enum: ['info', 'success', 'warning', 'error', 'system'] 
  }).notNull().default('info'),
  
  // Priority and status
  priority: text('priority', { 
    enum: ['low', 'medium', 'high', 'urgent'] 
  }).notNull().default('medium'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  
  // Linking and actions
  actionUrl: text('action_url'), // URL to navigate when clicked
  actionLabel: text('action_label'), // Button text for action
  category: text('category'), // e.g., 'workflow', 'system', 'user', 'security'
  
  // Metadata
  metadata: text('metadata'), // JSON string for additional data
  sourceWorkflow: text('source_workflow'), // Which workflow created this notification
  sourceNode: text('source_node'), // Which node created this notification
  
  // Timestamps
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  readAt: text('read_at'), // When the notification was read
  expiresAt: text('expires_at'), // Optional expiration date
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Helper type for notification with user info
export type NotificationWithUser = Notification & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

// Notification creation payload
export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  category?: string;
  metadata?: Record<string, any>;
  sourceWorkflow?: string;
  sourceNode?: string;
  expiresAt?: string;
}

// Notification update payload
export interface UpdateNotificationPayload {
  isRead?: boolean;
  readAt?: string;
}
