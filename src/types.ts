export type CategoryType = "GMAIL" | "PHOTOS" | "DRIVE" | "SYSTEM";
export type SaturationStatus = "CRITICAL" | "WARNING" | "HEALTHY";

export interface StorageMetrics {
  totalGb: number;
  usedGb: number;
  freeGb: number;
  usedPercentage: number;
  status: SaturationStatus;
  totalPotentialFreedGb: number;
  projectedUsedGbAfterCleanup: number;
  projectedPercentage: number;
  annualSavingsUsd: number;
  heavyEmailsCount: number;
  duplicatePhotosCount: number;
  oldDriveFilesCount: number;
}

export interface SaturationVectors {
  heavyEmailsGb: number;
  duplicatePhotosGb: number;
  oldDriveFilesGb: number;
  trashCacheGb: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  gbSavings: number;
  count: number;
  searchQuery: string;
  riskLevel: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH";
  actionableType: "EMAILS" | "PHOTOS" | "DRIVE_FILES" | "TRASH";
}

export interface HeavyEmail {
  id: string;
  subject: string;
  sender: string;
  date: string;
  sizeMb: number;
  hasAttachment: boolean;
  attachmentType: "ZIP" | "PDF" | "MP4" | "RAW" | "DOCX";
  category: string;
  selected?: boolean;
}

export interface DuplicatePhotoGroup {
  id: string;
  title: string;
  location: string;
  totalSizeMb: number;
  potentialSavedMb: number;
  similarityScore: number; // e.g. 98%
  photos: {
    id: string;
    url: string;
    filename: string;
    resolution: string;
    dateTaken: string;
    sizeMb: number;
    isBestQuality: boolean;
    selectedForDeletion: boolean;
  }[];
}

export interface OldDriveFile {
  id: string;
  name: string;
  path: string;
  fileType: "ZIP" | "ISO" | "MP4" | "PSD" | "PDF" | "OTHER";
  sizeMb: number;
  lastModified: string;
  daysUnmodified: number;
  owner: string;
  selected?: boolean;
}

export interface TrashItem {
  id: string;
  source: "Google Drive Trash" | "Gmail Trash & Spam" | "Photos Archive Trash" | "App Cache";
  itemCount: number;
  sizeGb: number;
  daysInTrash: number;
  selected?: boolean;
}

export interface AiActionStep {
  step: number;
  title: string;
  category: CategoryType;
  estimatedReleaseGb: string;
  searchFilter: string;
  safetyAdvice: string;
}

export interface AiReport {
  executiveSummary: string;
  primaryVector: string;
  actionPlan: AiActionStep[];
  proactivePrevention: string[];
}

export interface ActionLogItem {
  id: string;
  timestamp: string;
  actionName: string;
  category: CategoryType;
  gbFreed: number;
  itemsAffected: number;
}

export interface UserProfile {
  id: string;
  google_id: string;
  email: string;
  nombre: string;
  avatar_url: string;
  plan: "FREE" | "PRO";
}

export interface PlanLimits {
  chatUsed: number;
  chatMax: number;
  reportsUsed: number;
  reportsMax: number;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  total_gb: number;
  used_gb: number;
  heavy_emails: number;
  duplicate_photos: number;
  old_drive_files: number;
  badge: string;
}
