CREATE TABLE `payment_orders` (
	`razorpay_order_id` text PRIMARY KEY NOT NULL,
	`receipt` text NOT NULL,
	`plan_id` text NOT NULL,
	`plan_name` text NOT NULL,
	`billing` text NOT NULL,
	`quantity` integer NOT NULL,
	`amount_paise` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`payment_id` text,
	`customer_name` text,
	`customer_email` text,
	`customer_phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_receipt_unique` ON `payment_orders` (`receipt`);