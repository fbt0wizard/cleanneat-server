-- CreateTable
CREATE TABLE `inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `requester_type` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `preferred_contact_method` VARCHAR(191) NOT NULL,
    `address_line` VARCHAR(191) NOT NULL,
    `postcode` VARCHAR(191) NOT NULL,
    `service_type` JSON NOT NULL,
    `property_type` VARCHAR(191) NOT NULL,
    `bedrooms` INTEGER NOT NULL,
    `bathrooms` INTEGER NOT NULL,
    `preferred_start_date` VARCHAR(191) NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `cleaning_scope_notes` TEXT NOT NULL,
    `access_needs_or_preferences` TEXT NULL,
    `consent_to_contact` BOOLEAN NOT NULL,
    `consent_data_processing` BOOLEAN NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `internal_notes` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `inquiries_status_idx`(`status`),
    INDEX `inquiries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
