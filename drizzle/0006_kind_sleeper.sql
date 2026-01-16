CREATE TABLE `addon_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`quota` int NOT NULL,
	`amount` float NOT NULL,
	`paymentMethod` varchar(32),
	`paymentId` varchar(255),
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`expireAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addon_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `addon_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `membership_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`membershipType` enum('monthly','quarterly','yearly') NOT NULL,
	`amount` float NOT NULL,
	`quota` int NOT NULL,
	`paymentMethod` varchar(32),
	`paymentId` varchar(255),
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `user_quotas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipType` enum('free','monthly','quarterly','yearly','enterprise') NOT NULL DEFAULT 'free',
	`membershipExpireAt` timestamp,
	`totalQuota` int NOT NULL DEFAULT 5,
	`usedQuota` int NOT NULL DEFAULT 0,
	`remainingQuota` int NOT NULL DEFAULT 5,
	`addonQuota` int NOT NULL DEFAULT 0,
	`addonExpireAt` timestamp,
	`lastResetAt` timestamp NOT NULL DEFAULT (now()),
	`lifetimeUsage` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_quotas_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_quotas_userId_unique` UNIQUE(`userId`)
);
