-- CreateTable
CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `location_postcode` VARCHAR(191) NOT NULL,
    `role_type` JSON NOT NULL,
    `availability` JSON NOT NULL,
    `experience_summary` TEXT NOT NULL,
    `right_to_work_uk` BOOLEAN NOT NULL,
    `dbs_status` VARCHAR(191) NOT NULL,
    `references_contact_details` TEXT NOT NULL,
    `cv_file_url` VARCHAR(191) NOT NULL,
    `id_file_url` VARCHAR(191) NULL,
    `consent_recruitment_data_processing` BOOLEAN NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `internal_notes` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `applications_status_idx`(`status`),
    INDEX `applications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
