ALTER TABLE `project_share_links` ADD `allow_downloads` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `allow_comments` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `allow_approval` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `allow_previous_versions` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `asset_scope_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `password_salt` text;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `view_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `download_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `comment_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_share_links` ADD `approval_count` integer DEFAULT 0 NOT NULL;
