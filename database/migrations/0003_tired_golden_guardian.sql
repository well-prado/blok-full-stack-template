CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`action_url` text,
	`action_label` text,
	`category` text,
	`metadata` text,
	`source_workflow` text,
	`source_node` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`read_at` text,
	`expires_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
