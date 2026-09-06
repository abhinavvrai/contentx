ALTER TABLE `project_review_comments` ADD `range_end_seconds` integer;--> statement-breakpoint
ALTER TABLE `project_review_comments` ADD `priority` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_review_comments` ADD `assignee` text;--> statement-breakpoint
ALTER TABLE `project_review_comments` ADD `due_at` integer;--> statement-breakpoint
ALTER TABLE `project_review_comments` ADD `visibility` text DEFAULT 'project' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_review_comments` ADD `parent_comment_id` text;--> statement-breakpoint
CREATE INDEX `idx_project_review_comments_parent` ON `project_review_comments` (`project_id`,`parent_comment_id`,`created_at`);
