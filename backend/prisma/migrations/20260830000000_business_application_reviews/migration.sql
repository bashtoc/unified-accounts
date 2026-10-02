ALTER TABLE `DeveloperApplication`
  MODIFY `status` ENUM('INACTIVE', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'INACTIVE';

CREATE TABLE `DeveloperApplicationReview` (
  `id` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NOT NULL,
  `reviewerId` VARCHAR(191) NOT NULL,
  `reviewerEmail` VARCHAR(254) NULL,
  `previousStatus` ENUM('INACTIVE', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DELETED') NULL,
  `newStatus` ENUM('INACTIVE', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DELETED') NOT NULL,
  `decision` ENUM('APPROVED', 'REJECTED', 'SUSPENDED', 'REACTIVATED') NOT NULL,
  `reason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `DeveloperApplicationReview_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
  INDEX `DeveloperApplicationReview_decision_createdAt_idx`(`decision`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `DeveloperApplicationReview_applicationId_fkey`
    FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
