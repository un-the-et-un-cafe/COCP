CREATE TABLE `correction_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`report_type` text NOT NULL,
	`message` text NOT NULL,
	`language` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`delete_after` integer
);
--> statement-breakpoint
CREATE INDEX `idx_correction_reports_status_created` ON `correction_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_correction_reports_delete_after` ON `correction_reports` (`delete_after`);