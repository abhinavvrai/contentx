CREATE TABLE `project_version_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`file_id` text NOT NULL,
	`decision` text NOT NULL,
	`note` text,
	`actor_name` text NOT NULL,
	`actor_email` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `upload_projects`(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_project_version_decisions_asset_created` ON `project_version_decisions` (`project_id`,`asset_id`,`created_at`);
