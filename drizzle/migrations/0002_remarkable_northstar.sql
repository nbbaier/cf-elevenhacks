PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_scenes` (
	`scene_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`scene_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_scenes`("scene_id", "user_id", "title", "created_at") SELECT "scene_id", "user_id", "title", "created_at" FROM `user_scenes`;--> statement-breakpoint
DROP TABLE `user_scenes`;--> statement-breakpoint
ALTER TABLE `__new_user_scenes` RENAME TO `user_scenes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;