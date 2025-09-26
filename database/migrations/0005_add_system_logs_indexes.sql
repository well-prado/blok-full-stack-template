-- Performance indexes for system_logs table
-- Optimized for common admin log queries

-- Index for user-based queries (blame tracking)
CREATE INDEX `idx_system_logs_user_id_created` ON `system_logs` (`user_id`, `created_at` DESC);

-- Index for resource-based queries
CREATE INDEX `idx_system_logs_resource_type_created` ON `system_logs` (`resource_type`, `created_at` DESC);

-- Index for action-based queries
CREATE INDEX `idx_system_logs_action_type_created` ON `system_logs` (`action_type`, `created_at` DESC);

-- Index for time-based queries (most common)
CREATE INDEX `idx_system_logs_created_at` ON `system_logs` (`created_at` DESC);

-- Index for risk-based filtering
CREATE INDEX `idx_system_logs_risk_level` ON `system_logs` (`risk_level`, `created_at` DESC);

-- Composite index for endpoint and method queries
CREATE INDEX `idx_system_logs_endpoint_method` ON `system_logs` (`endpoint`, `http_method`, `created_at` DESC);

-- Index for success/failure filtering
CREATE INDEX `idx_system_logs_success_created` ON `system_logs` (`success`, `created_at` DESC);
