-- Add new profile fields to users table
ALTER TABLE `users` ADD `profile_image` text;--> statement-breakpoint
ALTER TABLE `users` ADD `preferences` text;--> statement-breakpoint

-- Rename password column to password_hash (SQLite doesn't support RENAME COLUMN directly)
-- We need to create a new table, copy data, and replace the old table
CREATE TABLE `users_new` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `name` text NOT NULL,
  `role` text DEFAULT 'user' NOT NULL,
  `email_verified` integer DEFAULT 0 NOT NULL,
  `profile_image` text,
  `preferences` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

-- Copy data from old table to new table
INSERT INTO `users_new` (
  `id`, `email`, `password_hash`, `name`, `role`, `email_verified`, 
  `profile_image`, `preferences`, `created_at`, `updated_at`
)
SELECT 
  `id`, `email`, `password`, `name`, `role`, `email_verified`,
  NULL, NULL, `created_at`, `updated_at`
FROM `users`;--> statement-breakpoint

-- Drop old table and rename new table
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `users_new` RENAME TO `users`;--> statement-breakpoint

-- Recreate unique constraint on email
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
