-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `primary_phone` VARCHAR(191) NULL,
    `primary_email` VARCHAR(191) NULL,
    `office_hours_text` TEXT NULL,
    `service_area_text` TEXT NULL,
    `service_area_postcodes` JSON NULL,
    `hero_badge_text` VARCHAR(191) NULL,
    `hero_headline` TEXT NULL,
    `hero_headline_highlight` VARCHAR(191) NULL,
    `hero_subtext` TEXT NULL,
    `hero_images` JSON NULL,
    `social_facebook` VARCHAR(191) NULL,
    `social_instagram` VARCHAR(191) NULL,
    `social_twitter` VARCHAR(191) NULL,
    `social_linkedin` VARCHAR(191) NULL,
    `logo_url` VARCHAR(191) NULL,
    `favicon_url` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
