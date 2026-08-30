CREATE TABLE `project_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `upload_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_folders_project_parent` ON `project_folders` (`project_id`,`parent_id`,`position`);--> statement-breakpoint
ALTER TABLE `upload_files` ADD `folder_id` text;--> statement-breakpoint
CREATE INDEX `idx_upload_files_project_folder` ON `upload_files` (`project_id`,`folder_id`,`status`);
