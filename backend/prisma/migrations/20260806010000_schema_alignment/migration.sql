ALTER TABLE `User`
  ADD COLUMN `email` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

ALTER TABLE `Bank`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'normal',
  ADD COLUMN `recentReports` JSON NOT NULL,
  ADD COLUMN `statusUpdatedAt` DATETIME(3) NULL;

ALTER TABLE `DeveloperApplication`
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `isRegistered` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `cacDocumentUrl` VARCHAR(191) NULL,
  ADD COLUMN `directorInfo` JSON NULL,
  ADD COLUMN `virtualAccount` JSON NULL,
  ADD COLUMN `balance` DOUBLE NOT NULL DEFAULT 5000.0;

CREATE TABLE IF NOT EXISTS `CachedIdentity` (
  `id` CHAR(36) NOT NULL,
  `identityNumber` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CachedIdentity_identityNumber_key`(`identityNumber`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
