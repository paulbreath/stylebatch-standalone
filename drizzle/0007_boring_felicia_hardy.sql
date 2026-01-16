ALTER TABLE `user_quotas` ADD `isTester` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_quotas` ADD `testerQuota` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_quotas` ADD `testerNote` text;