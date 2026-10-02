CREATE TABLE `User` (
  `id` CHAR(36) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `phoneVerifiedAt` DATETIME(3) NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  UNIQUE INDEX `User_phoneNumber_key`(`phoneNumber`),
  INDEX `User_status_idx`(`status`),
  INDEX `User_deletedAt_idx`(`deletedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Bank` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `bankCode` VARCHAR(191) NOT NULL,
  `logoUrl` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Bank_slug_key`(`slug`),
  UNIQUE INDEX `Bank_bankCode_key`(`bankCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LinkedBankAccount` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `bankId` INTEGER NOT NULL,
  `accountNumber` VARCHAR(10) NOT NULL,
  `accountName` VARCHAR(191) NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `isPublic` BOOLEAN NOT NULL DEFAULT false,
  `verificationStatus` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  UNIQUE INDEX `LinkedBankAccount_userId_bankId_accountNumber_deletedAt_key`(`userId`, `bankId`, `accountNumber`, `deletedAt`),
  INDEX `LinkedBankAccount_userId_isDefault_idx`(`userId`, `isDefault`),
  INDEX `LinkedBankAccount_userId_isPublic_deletedAt_idx`(`userId`, `isPublic`, `deletedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OtpCode` (
  `id` CHAR(36) NOT NULL,
  `phoneNumber` VARCHAR(191) NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `purpose` ENUM('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'DEVELOPER_ACCOUNT_LINK') NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `OtpCode_phoneNumber_purpose_consumedAt_idx`(`phoneNumber`, `purpose`, `consumedAt`),
  INDEX `OtpCode_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RefreshToken` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `RefreshToken_userId_revokedAt_idx`(`userId`, `revokedAt`),
  INDEX `RefreshToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DeveloperApplication` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `DeveloperApplication_userId_status_idx`(`userId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApiKey` (
  `id` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NOT NULL,
  `keyPrefix` VARCHAR(191) NOT NULL,
  `keyHash` VARCHAR(191) NOT NULL,
  `scopes` JSON NOT NULL,
  `lastUsedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ApiKey_keyPrefix_idx`(`keyPrefix`),
  INDEX `ApiKey_applicationId_revokedAt_idx`(`applicationId`, `revokedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApiRequestLog` (
  `id` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NULL,
  `endpoint` VARCHAR(191) NOT NULL,
  `method` VARCHAR(191) NOT NULL,
  `statusCode` INTEGER NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ApiRequestLog_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
  INDEX `ApiRequestLog_requestId_idx`(`requestId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ConsentToken` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `purpose` ENUM('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'DEVELOPER_ACCOUNT_LINK') NOT NULL DEFAULT 'DEVELOPER_ACCOUNT_LINK',
  `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'CONSUMED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `payload` JSON NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ConsentToken_userId_applicationId_status_idx`(`userId`, `applicationId`, `status`),
  INDEX `ConsentToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LinkedBankAccount` ADD CONSTRAINT `LinkedBankAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `LinkedBankAccount` ADD CONSTRAINT `LinkedBankAccount_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `Bank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeveloperApplication` ADD CONSTRAINT `DeveloperApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ApiRequestLog` ADD CONSTRAINT `ApiRequestLog_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ConsentToken` ADD CONSTRAINT `ConsentToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ConsentToken` ADD CONSTRAINT `ConsentToken_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
