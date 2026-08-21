CREATE TABLE `auth_identities` (
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`verified_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`provider`, `provider_user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `account_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_auth_identities_user` ON `auth_identities` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_identities_email` ON `auth_identities` (`email`);--> statement-breakpoint
CREATE TABLE `project_share_links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by_user_id` text,
	`name` text NOT NULL,
	`allow_uploads` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_used_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `upload_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_share_links_token_hash_unique` ON `project_share_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_project_share_links_project_status` ON `project_share_links` (`project_id`,`status`,`updated_at`);--> statement-breakpoint
ALTER TABLE `upload_files` ADD `asset_id` text;--> statement-breakpoint
ALTER TABLE `upload_files` ADD `version_number` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `upload_files` ADD `parent_file_id` text;--> statement-breakpoint
CREATE INDEX `idx_upload_files_asset_version` ON `upload_files` (`asset_id`,`version_number`);