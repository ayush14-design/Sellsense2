// Database row types for TypeScript

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  role: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

export interface RestaurantRow {
  id: string;
  name: string;
  owner_name: string;
  business_type: string;
  city: string;
  location: string;
  contact_email: string;
  description: string | null;
  review_sources: string;
  data_mode: string;
  created_at: string;
  owner_id: string;
  is_active: number;
  zomato_res_id: string | null;
  zomato_access_token: string | null;
  zomato_token_expires_at: string | null;
}

export interface SubscriptionPlanRow {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  duration_days: number;
  features: string;
  usage_limits: string;
  available_addon_ids: string;
  status: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  plan_id: string;
  payment_request_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string;
  is_complimentary: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  plan_id: string;
  amount_inr: number;
  transaction_reference: string;
  payment_date: string;
  screenshot_path: string | null;
  notes: string | null;
  status: string;
  admin_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AddonRow {
  id: string;
  name: string;
  identifier: string;
  description: string;
  icon: string | null;
  price_inr: number | null;
  billing_type: string;
  duration_days: number | null;
  eligibility_rules: string;
  feature_permissions: string;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AddonAssignmentRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  addon_id: string;
  starts_at: string;
  expires_at: string | null;
  is_complimentary: number;
  payment_request_id: string | null;
  admin_note: string | null;
  created_at: string;
  created_by: string;
}

export interface FeatureDefinitionRow {
  id: string;
  identifier: string;
  name: string;
  description: string;
  category: string;
  is_globally_enabled: number;
  restricted_to_plans: string;
  restricted_to_accounts: string;
  trial_enabled: number;
  trial_duration_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserFeatureOverrideRow {
  id: string;
  user_id: string;
  feature_id: string;
  is_enabled: number;
  expires_at: string | null;
  reason: string | null;
  created_at: string;
  created_by: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  recipient_type: string;
  recipient_ids: string;
  category: string;
  is_read: number;
  created_at: string;
  sent_at: string | null;
  sent_by: string | null;
}

export interface AdminAuditLogRow {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

export interface PlatformSettingsRow {
  id: number;
  platform_name: string;
  support_email: string;
  contact_phone: string | null;
  contact_address: string | null;
  default_currency: string;
  default_timezone: string;
  subscription_policy: string | null;
  qr_code_path: string;
  payment_recipient_name: string;
  payment_recipient_upi_id: string;
  payment_instructions: string;
  accepted_payment_methods: string;
  payment_verification_policy: string;
  max_payment_submission_retries: number;
  default_trial_days: number;
  default_account_access_policy: string;
  default_subscription_days: number;
  grace_period_days: number;
  notification_settings: string;
  session_timeout_minutes: number;
  max_file_upload_size_mb: number;
  audit_log_retention_days: number;
  updated_at: string;
}

export interface ZomatoTokenRow {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleConnectionRow {
  id: string;
  restaurant_id: string;
  google_account_email: string | null;
  account_name: string | null;
  location_id: string | null;
  location_name: string | null;
  location_address: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  status: string; // 'connected' | 'disconnected' | 'pending_location' | 'error'
  is_verified: number;
  total_reviews: number;
  average_rating: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleReviewRow {
  id: string;
  restaurant_id: string;
  location_id: string | null;
  google_review_id: string | null;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  star_rating: number;
  comment: string | null;
  review_date: string;
  reply_comment: string | null;
  reply_date: string | null;
  sentiment: string; // 'positive' | 'negative' | 'neutral'
  sentiment_score: number;
  themes: string; // JSON array
  ai_summary: string | null;
  created_at: string;
}