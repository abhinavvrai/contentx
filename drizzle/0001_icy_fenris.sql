CREATE TABLE `upload_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`client_name` text,
	`client_email` text,
	`upload_token_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`max_file_size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upload_projects_upload_token_hash_unique` ON `upload_projects` (`upload_token_hash`);--> statement-breakpoint
CREATE TABLE `upload_files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`multipart_upload_id` text,
	`uploader_name` text,
	`uploader_email` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `upload_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upload_files_object_key_unique` ON `upload_files` (`object_key`);
