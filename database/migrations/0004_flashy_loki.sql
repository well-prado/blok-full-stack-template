CREATE TABLE `log_retention_policy` (
	`id` text PRIMARY KEY NOT NULL,
	`retention_days` integer DEFAULT 1095 NOT NULL,
	`archive_days` integer DEFAULT 1825 NOT NULL,
	`last_cleanup` text DEFAULT (datetime('now')),
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_email` text NOT NULL,
	`user_name` text NOT NULL,
	`user_role` text NOT NULL,
	`action_type` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`resource_name` text,
	`http_method` text NOT NULL,
	`endpoint` text NOT NULL,
	`workflow_name` text,
	`node_name` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`status_code` integer NOT NULL,
	`success` integer DEFAULT true NOT NULL,
	`error_message` text,
	`execution_time_ms` integer,
	`request_size` integer,
	`changes_summary` text,
	`ip_address` text NOT NULL,
	`user_agent` text,
	`session_id` text,
	`affected_users_count` integer DEFAULT 0,
	`compliance_flags` text,
	`risk_level` text DEFAULT 'low' NOT NULL
);
