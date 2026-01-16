ALTER TABLE `batch_tasks` MODIFY COLUMN `styleType` enum('preset','custom','reference') NOT NULL;--> statement-breakpoint
ALTER TABLE `conversion_tasks` MODIFY COLUMN `styleType` enum('preset','custom','reference') NOT NULL;--> statement-breakpoint
ALTER TABLE `batch_tasks` ADD `referenceImageUrl` text;--> statement-breakpoint
ALTER TABLE `batch_tasks` ADD `referenceImageKey` varchar(500);--> statement-breakpoint
ALTER TABLE `conversion_tasks` ADD `referenceImageUrl` text;--> statement-breakpoint
ALTER TABLE `conversion_tasks` ADD `referenceImageKey` varchar(500);