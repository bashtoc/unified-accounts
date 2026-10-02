ALTER TABLE `Bank`
  ADD COLUMN `longCode` VARCHAR(191) NULL,
  ADD COLUMN `nipInstitutionCode` VARCHAR(191) NULL,
  ADD COLUMN `supportsTransfer` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'Nigeria',
  ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
  ADD COLUMN `bankType` VARCHAR(40) NULL;

CREATE INDEX `Bank_nipInstitutionCode_idx` ON `Bank`(`nipInstitutionCode`);
