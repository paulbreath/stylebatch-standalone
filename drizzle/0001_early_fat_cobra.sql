CREATE TABLE `batch_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`styleType` enum('preset','custom') NOT NULL,
	`stylePreset` varchar(100),
	`styleDescription` text,
	`strength` float NOT NULL DEFAULT 0.75,
	`totalCount` int NOT NULL,
	`completedCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `batch_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversion_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalImageUrl` text NOT NULL,
	`originalImageKey` varchar(500) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`styleType` enum('preset','custom') NOT NULL,
	`stylePreset` varchar(100),
	`styleDescription` text,
	`strength` float NOT NULL DEFAULT 0.75,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`resultImageUrl` text,
	`resultImageKey` varchar(500),
	`analysisData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `conversion_tasks_id` PRIMARY KEY(`id`)
);
