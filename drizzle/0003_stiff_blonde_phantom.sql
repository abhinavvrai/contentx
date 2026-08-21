CREATE TABLE `account_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `account_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_account_sessions_user_expires` ON `account_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `account_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_users_email_unique` ON `account_users` (`email`);--> statement-breakpoint
CREATE TABLE `auth_login_attempts` (
	`attempt_key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`window_started_at` integer NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_selections` (
	`razorpay_order_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_type` text NOT NULL,
	`delivery_format` text,
	`add_ons_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `account_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_selections_user_created` ON `order_selections` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `project_briefs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`razorpay_order_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`instructions` text NOT NULL,
	`reference_url` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `account_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_briefs_razorpay_order_id_unique` ON `project_briefs` (`razorpay_order_id`);--> statement-breakpoint
CREATE INDEX `idx_project_briefs_user_updated` ON `project_briefs` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `user_upload_projects` (
	`project_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`razorpay_order_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `account_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_upload_projects_razorpay_order_id_unique` ON `user_upload_projects` (`razorpay_order_id`);