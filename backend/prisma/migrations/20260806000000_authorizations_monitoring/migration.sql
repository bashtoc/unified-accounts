ALTER TABLE `Bank`
  ADD COLUMN `trustScore` INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN `latencyMs` INTEGER NULL,
  ADD COLUMN `lastCheckedAt` DATETIME(3) NULL,
  ADD COLUMN `statusSource` VARCHAR(40) NULL;

CREATE TABLE `UserAuthorization` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NOT NULL,
  `scopes` JSON NOT NULL,
  `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `expiresAt` DATETIME(3) NULL,
  `revokedAt` DATETIME(3) NULL,
  `lastUsedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `UserAuthorization_userId_applicationId_key`(`userId`, `applicationId`),
  INDEX `UserAuthorization_userId_status_idx`(`userId`, `status`),
  INDEX `UserAuthorization_applicationId_status_idx`(`applicationId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ConsentRequest` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `applicationId` CHAR(36) NOT NULL,
  `scopes` JSON NOT NULL,
  `message` VARCHAR(500) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `expiresAt` DATETIME(3) NOT NULL,
  `respondedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ConsentRequest_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  INDEX `ConsentRequest_applicationId_status_createdAt_idx`(`applicationId`, `status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BankStatusEvent` (
  `id` CHAR(36) NOT NULL,
  `bankId` INTEGER NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `trustScore` INTEGER NOT NULL,
  `latencyMs` INTEGER NULL,
  `source` VARCHAR(40) NOT NULL,
  `details` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `BankStatusEvent_bankId_createdAt_idx`(`bankId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserAuthorization`
  ADD CONSTRAINT `UserAuthorization_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `UserAuthorization_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ConsentRequest`
  ADD CONSTRAINT `ConsentRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ConsentRequest_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `DeveloperApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `BankStatusEvent`
  ADD CONSTRAINT `BankStatusEvent_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `Bank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
