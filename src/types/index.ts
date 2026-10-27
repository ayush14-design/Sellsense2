export type Sentiment = 'positive' | 'negative' | 'neutral';
export type Platform = 'Zomato' | 'Swiggy' | 'Google';
export type BusinessType = 'Restaurant' | 'Café' | 'Food Stall' | 'Street Food Vendor' | 'Other';
export type ConnectionStatus = 'Not Connected' | 'Connecting' | 'Connected' | 'Demo Connection';
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer' | 'restaurant_owner';

export type PaymentStatus = 'pending_submission' | 'pending_verification' | 'approved' | 'rejected' | 'needs_correction' | 'expired';
export type SubscriptionStatus = 'inactive' | 'active' | 'expired' | 'suspended';
export type AddonBillingType = 'one_time' | 'recurring' | 'complimentary';
export type PlanStatus = 'active' | 'archived' | 'draft';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  phone?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  businessType: BusinessType;
  city: string;
  location: string;
  contactEmail: string;
  description?: string;
  reviewSources: Platform[];
  dataMode: 'DEMO' | 'LIVE';
  createdAt: string;
  ownerId: string;
  isActive: boolean;
}

export interface PlatformConnection {
  id: string;
  restaurantId: string;
  platform: Platform;
  status: ConnectionStatus;
  lastSynced?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  imageUrl: string;
  platforms: Platform[];
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  lastAnalyzed: string;
  dataMode: 'DEMO' | 'LIVE';
}

export interface Review {
  id: string;
  restaurantId: string;
  productId: string;
  platform: Platform;
  reviewText: string;
  sentiment: Sentiment;
  theme: string;
  createdAt: string;
  dataMode: 'DEMO' | 'LIVE';
  scope?: 'product' | 'restaurant';
}

export interface ReviewTheme {
  theme: string;
  count: number;
  percentage: number;
  sentiment: Sentiment;
  representativeQuote: string;
}

export interface AnalysisResult {
  productId: string;
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveThemes: ReviewTheme[];
  negativeThemes: ReviewTheme[];
  platformDistribution: PlatformStats[];
  trends?: TrendData[];
  recommendations: string[];
  fakeReviewsCount: number;
  fakeReviewsPercentage: number;
  duplicateReviewsCount: number;
  duplicateReviewsPercentage: number;
}

export interface PlatformStats {
  platform: Platform;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface TrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

// ============ ADMIN & PAYMENT TYPES ============

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceInr: number;
  durationDays: number;
  features: string[];
  usageLimits?: Record<string, number>;
  availableAddonIds: string[];
  status: PlanStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  restaurantId: string;
  planId: string;
  amountInr: number;
  transactionReference: string;
  paymentDate: string;
  screenshotPath?: string;
  notes?: string;
  status: PaymentStatus;
  adminReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  restaurantId: string;
  planId: string;
  paymentRequestId?: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isComplimentary: boolean;
  adminNote?: string;
}

export interface Addon {
  id: string;
  name: string;
  identifier: string;
  description: string;
  icon?: string;
  priceInr?: number;
  billingType: AddonBillingType;
  durationDays?: number;
  eligibilityRules?: Record<string, any>;
  featurePermissions: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddonAssignment {
  id: string;
  userId: string;
  restaurantId: string;
  addonId: string;
  startsAt: string;
  expiresAt?: string;
  isComplimentary: boolean;
  paymentRequestId?: string;
  adminNote?: string;
  createdAt: string;
  createdBy: string;
}

export interface FeatureDefinition {
  id: string;
  identifier: string;
  name: string;
  description: string;
  category: string;
  isGloballyEnabled: boolean;
  restrictedToPlans: string[];
  restrictedToAccounts: string[];
  trialEnabled: boolean;
  trialDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserFeatureOverride {
  id: string;
  userId: string;
  featureId: string;
  isEnabled: boolean;
  expiresAt?: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  recipientType: 'all' | 'selected' | 'single';
  recipientIds?: string[];
  category: 'payment' | 'subscription' | 'addon' | 'feature' | 'maintenance' | 'general';
  isRead: boolean;
  createdAt: string;
  sentAt?: string;
  sentBy?: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  entityType: 'user' | 'restaurant' | 'payment' | 'subscription' | 'addon' | 'feature' | 'plan' | 'settings';
  entityId: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
  createdAt: string;
}

export interface PlatformSettings {
  // Business settings
  platformName: string;
  supportEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  defaultCurrency: string;
  defaultTimezone: string;
  subscriptionPolicy?: string;

  // Payment settings
  qrCodePath: string;
  paymentRecipientName: string;
  paymentRecipientUpiId: string;
  paymentInstructions: string;
  acceptedPaymentMethods: string[];
  paymentVerificationPolicy: string;
  maxPaymentSubmissionRetries: number;

  // Access settings
  defaultTrialDays: number;
  defaultAccountAccessPolicy: 'free_tier_only' | 'require_payment' | 'manual_approval';
  defaultSubscriptionDays: number;
  gracePeriodDays: number;
  notificationSettings: Record<string, boolean>;

  // Security settings
  sessionTimeoutMinutes: number;
  maxFileUploadSizeMb: number;
  auditLogRetentionDays: number;
}