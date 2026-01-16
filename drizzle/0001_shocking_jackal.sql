CREATE TABLE `alerts` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`type` enum('low_stock','out_of_stock','expiring_soon','expired','purchase_order_pending') NOT NULL,
	`message` text NOT NULL,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `demandForecasts` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`forecastedDemand` int NOT NULL,
	`suggestedOrderQuantity` int NOT NULL,
	`confidence` decimal(5,2),
	`analysisData` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`validUntil` datetime,
	CONSTRAINT `demandForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` varchar(36) NOT NULL,
	`warehouseId` varchar(36) NOT NULL,
	`code` varchar(100) NOT NULL,
	`aisle` varchar(50),
	`shelf` varchar(50),
	`bin` varchar(50),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationLogs` (
	`id` varchar(36) NOT NULL,
	`alertId` varchar(36) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`code` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`qrCode` varchar(255),
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` varchar(36) NOT NULL,
	`supplierId` varchar(36),
	`unit` varchar(50) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`cost` decimal(12,2),
	`stock` int NOT NULL DEFAULT 0,
	`minStock` int NOT NULL DEFAULT 10,
	`maxStock` int NOT NULL DEFAULT 100,
	`reorderQuantity` int NOT NULL DEFAULT 50,
	`expirationDate` datetime,
	`status` enum('active','discontinued','inactive') NOT NULL DEFAULT 'active',
	`locationId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`),
	CONSTRAINT `code_idx` UNIQUE(`code`),
	CONSTRAINT `barcode_idx` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` varchar(36) NOT NULL,
	`purchaseOrderId` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`receivedQuantity` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` varchar(36) NOT NULL,
	`orderNumber` varchar(100) NOT NULL,
	`supplierId` varchar(36) NOT NULL,
	`status` enum('draft','pending','confirmed','received','cancelled') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(12,2) NOT NULL,
	`expectedDeliveryDate` datetime,
	`receivedDate` datetime,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`paymentTerms` varchar(255),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`type` enum('entry','exit','adjustment','return','write_off') NOT NULL,
	`quantity` int NOT NULL,
	`referenceNumber` varchar(100),
	`reason` text,
	`notes` text,
	`userId` int NOT NULL,
	`purchaseOrderId` varchar(36),
	`previousStock` int NOT NULL,
	`resultingStock` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` text,
	`capacity` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
);
