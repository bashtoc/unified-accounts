INSERT INTO `Bank` (
  `name`, `slug`, `bankCode`, `supportsTransfer`, `country`, `currency`,
  `bankType`, `logoUrl`, `active`, `featured`, `displayOrder`, `status`,
  `recentReports`, `trustScore`, `statusSource`, `createdAt`, `updatedAt`
)
VALUES (
  'Nigeria Inter-Bank Settlement System (NIBSS)', 'nibss', 'NIBSS', false,
  'Nigeria', 'NGN', 'network-switch', '/bank-logos/generated/NIBSS.svg', true,
  true, 0, 'healthy', JSON_ARRAY(), 100, 'aggregate-monitor', NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `supportsTransfer` = false,
  `bankType` = 'network-switch',
  `logoUrl` = VALUES(`logoUrl`),
  `active` = true,
  `featured` = true,
  `displayOrder` = 0,
  `statusSource` = 'aggregate-monitor';
