ALTER TABLE `BankStatusEvent`
  ADD COLUMN `transactionId` VARCHAR(128) NULL;

CREATE UNIQUE INDEX `BankStatusEvent_bankId_transactionId_key`
  ON `BankStatusEvent`(`bankId`, `transactionId`);
