ALTER TABLE `batch_tasks` ADD `preserveTransparency` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `conversion_tasks` ADD `preserveTransparency` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `conversion_tasks` ADD `originalWidth` int;--> statement-breakpoint
ALTER TABLE `conversion_tasks` ADD `originalHeight` int;