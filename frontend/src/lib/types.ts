export type BusinessSession = {
  clientId: string;
  secretKey: string;
  refreshToken?: string;
  applicationId?: string;
  name: string;
  email?: string;
  websiteUrl?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  canContributeBankStatus?: boolean;
};

export type MonitoringAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: "OWNER" | "REVIEWER" | "READ_ONLY";
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED";
  lastLoginAt?: string | null;
  createdAt?: string;
};

export type MonitoringAdminSession = {
  accessToken: string;
  refreshToken: string;
  admin: MonitoringAdmin;
};

export type BusinessApplication = {
  id: string;
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  status: "INACTIVE" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "DELETED";
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email?: string | null; phoneNumber?: string | null; status: string; createdAt: string };
  apiKeys: Array<{ id: string; keyPrefix: string; scopes: string[]; revokedAt?: string | null; expiresAt?: string | null; lastUsedAt?: string | null; createdAt: string }>;
  latestReview?: { id: string; reviewerId: string; reviewerEmail?: string | null; previousStatus?: string | null; newStatus: string; decision: string; reason?: string | null; createdAt: string } | null;
};

export type BankStatus = {
  id: number;
  name: string;
  bankCode: string;
  institutionType?: "bank" | "network_switch";
  isNetworkSwitch?: boolean;
  longCode?: string | null;
  nipInstitutionCode?: string | null;
  supportsTransfer?: boolean;
  country?: string;
  currency?: string;
  bankType?: string | null;
  logoUrl?: string | null;
  featured?: boolean;
  displayOrder?: number;
  status: string;
  networkSignal?: "positive" | "negative" | null;
  downBankCount?: number | null;
  downThreshold?: number | null;
  trustScore: number;
  successRate?: number | null;
  latencyMs?: number | null;
  lastCheckedAt?: string | null;
  statusSource?: string;
  updatedAt?: string;
};

export type BankStatusEvent = {
  id: string;
  bankId: number;
  status: string;
  trustScore: number;
  latencyMs?: number | null;
  source: string;
  details?: { success?: boolean; transactionId?: string; transactionStatus?: string; failureCategory?: string; countsAgainstUptime?: boolean; impact?: string; reason?: string; downBankCount?: number; downThreshold?: number; downBanks?: string[] } | null;
  createdAt: string;
};
