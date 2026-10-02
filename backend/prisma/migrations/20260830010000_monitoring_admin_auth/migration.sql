CREATE TABLE `MonitoringAdmin` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `fullName` VARCHAR(120) NOT NULL,
  `role` ENUM('OWNER', 'REVIEWER', 'READ_ONLY') NOT NULL DEFAULT 'REVIEWER',
  `permissions` JSON NOT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `MonitoringAdmin_email_key`(`email`),
  INDEX `MonitoringAdmin_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MonitoringAdminOtp` (
  `id` CHAR(36) NOT NULL,
  `adminId` CHAR(36) NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `MonitoringAdminOtp_adminId_consumedAt_createdAt_idx`(`adminId`, `consumedAt`, `createdAt`),
  INDEX `MonitoringAdminOtp_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `MonitoringAdminOtp_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `MonitoringAdmin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MonitoringAdminRefreshToken` (
  `id` CHAR(36) NOT NULL,
  `adminId` CHAR(36) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `MonitoringAdminRefreshToken_adminId_revokedAt_idx`(`adminId`, `revokedAt`),
  INDEX `MonitoringAdminRefreshToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `MonitoringAdminRefreshToken_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `MonitoringAdmin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
