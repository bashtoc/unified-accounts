UPDATE `Bank`
SET `logoUrl` = CONCAT('/bank-logos/generated/', `bankCode`, '.svg')
WHERE `logoUrl` IS NULL OR `logoUrl` = '';

UPDATE `Bank`
SET `trustScore` = 100;

ALTER TABLE `Bank`
  MODIFY `logoUrl` VARCHAR(191) NOT NULL,
  MODIFY `trustScore` INTEGER NOT NULL DEFAULT 100;
