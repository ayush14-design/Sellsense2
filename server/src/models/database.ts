import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import crypto from 'crypto';

// Resolve data directory robustly whether executed from root or server subfolder
function getDatabaseDirectory(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  const rootServerData = join(process.cwd(), 'server', 'data');
  if (existsSync(rootServerData)) {
    return rootServerData;
  }
  const directData = join(process.cwd(), 'data');
  return directData;
}

const DATA_DIR = getDatabaseDirectory();
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db: Database.Database = new Database(join(DATA_DIR, 'sellsense.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============ SCHEMA INITIALIZATION ============

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'restaurant_owner',
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    )
  `);

  // Restaurants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      city TEXT NOT NULL,
      location TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      description TEXT,
      review_sources TEXT NOT NULL DEFAULT '["Zomato"]',
      data_mode TEXT NOT NULL DEFAULT 'DEMO',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      owner_id TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      zomato_res_id TEXT,
      zomato_access_token TEXT,
      zomato_token_expires_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // Platform connections
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_connections (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Not Connected',
      last_synced TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
  `);

  // Subscription Plans
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_inr INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      features TEXT NOT NULL DEFAULT '[]',
      usage_limits TEXT DEFAULT '{}',
      available_addon_ids TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      payment_request_id TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_complimentary INTEGER NOT NULL DEFAULT 0,
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    )
  `);

  // Payment Requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      amount_inr INTEGER NOT NULL,
      transaction_reference TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      screenshot_path TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending_submission',
      admin_reason TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )
  `);

  // Addons
  db.exec(`
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      identifier TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      price_inr INTEGER,
      billing_type TEXT NOT NULL DEFAULT 'one_time',
      duration_days INTEGER,
      eligibility_rules TEXT DEFAULT '{}',
      feature_permissions TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Addon Assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS addon_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      is_complimentary INTEGER NOT NULL DEFAULT 0,
      payment_request_id TEXT,
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (addon_id) REFERENCES addons(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id)
    )
  `);

  // Feature Definitions
  db.exec(`
    CREATE TABLE IF NOT EXISTS feature_definitions (
      id TEXT PRIMARY KEY,
      identifier TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      is_globally_enabled INTEGER NOT NULL DEFAULT 1,
      restricted_to_plans TEXT DEFAULT '[]',
      restricted_to_accounts TEXT DEFAULT '[]',
      trial_enabled INTEGER NOT NULL DEFAULT 0,
      trial_duration_days INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // User Feature Overrides
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_feature_overrides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      feature_id TEXT NOT NULL,
      is_enabled INTEGER NOT NULL,
      expires_at TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (feature_id) REFERENCES feature_definitions(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      recipient_type TEXT NOT NULL DEFAULT 'all',
      recipient_ids TEXT DEFAULT '[]',
      category TEXT NOT NULL DEFAULT 'general',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT,
      sent_by TEXT,
      FOREIGN KEY (sent_by) REFERENCES users(id)
    )
  `);

  // Admin Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_user_id) REFERENCES users(id)
    )
  `);

  // Google Business Profile Connections & Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS google_connections (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL UNIQUE,
      google_account_email TEXT,
      account_name TEXT,
      location_id TEXT,
      location_name TEXT,
      location_address TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expiry TEXT,
      status TEXT NOT NULL DEFAULT 'disconnected',
      is_verified INTEGER DEFAULT 1,
      total_reviews INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0.0,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS google_reviews (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      location_id TEXT,
      google_review_id TEXT UNIQUE,
      reviewer_name TEXT,
      reviewer_photo_url TEXT,
      star_rating INTEGER NOT NULL,
      comment TEXT,
      review_date TEXT,
      reply_comment TEXT,
      reply_date TEXT,
      sentiment TEXT NOT NULL DEFAULT 'neutral',
      sentiment_score REAL DEFAULT 0.0,
      themes TEXT DEFAULT '[]',
      ai_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
  `);

  // Manual Spreadsheet Upload Batches
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_review_batches (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      total_rows INTEGER NOT NULL DEFAULT 0,
      imported_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
  `);

  // Manual Customer Reviews from Spreadsheet Uploads
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_reviews (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      product_name TEXT,
      customer_review TEXT NOT NULL,
      rating INTEGER,
      review_date TEXT,
      platform TEXT NOT NULL DEFAULT 'Uploaded Data',
      sentiment TEXT NOT NULL DEFAULT 'neutral',
      sentiment_score REAL DEFAULT 0.0,
      theme TEXT,
      is_general INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (batch_id) REFERENCES manual_review_batches(id)
    )
  `);

  // Platform Settings (single row)
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      platform_name TEXT NOT NULL DEFAULT 'SellSense',
      support_email TEXT NOT NULL DEFAULT 'support@sellsense.ai',
      contact_phone TEXT,
      contact_address TEXT,
      default_currency TEXT NOT NULL DEFAULT 'INR',
      default_timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      subscription_policy TEXT,
      qr_code_path TEXT NOT NULL DEFAULT '/qr-code.jpeg',
      payment_recipient_name TEXT NOT NULL DEFAULT 'Ayush Sujit Mandalkar',
      payment_recipient_upi_id TEXT NOT NULL DEFAULT '7385561145@fam',
      payment_instructions TEXT NOT NULL DEFAULT 'Scan QR code and pay the exact amount. Include transaction reference in notes.',
      accepted_payment_methods TEXT NOT NULL DEFAULT '["UPI", "Bank Transfer"]',
      payment_verification_policy TEXT NOT NULL DEFAULT 'Manual verification within 24 hours',
      max_payment_submission_retries INTEGER NOT NULL DEFAULT 3,
      default_trial_days INTEGER NOT NULL DEFAULT 14,
      default_account_access_policy TEXT NOT NULL DEFAULT 'manual_approval',
      default_subscription_days INTEGER NOT NULL DEFAULT 30,
      grace_period_days INTEGER NOT NULL DEFAULT 7,
      notification_settings TEXT NOT NULL DEFAULT '{"payment_submitted": true, "payment_approved": true, "payment_rejected": true, "subscription_expiring": true, "subscription_expired": true, "addon_assigned": true, "feature_changed": true}',
      session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
      max_file_upload_size_mb INTEGER NOT NULL DEFAULT 10,
      audit_log_retention_days INTEGER NOT NULL DEFAULT 365,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Insert default platform settings if not exists or update scanner details
  const settingsExists = db.prepare('SELECT 1 FROM platform_settings WHERE id = 1').get();
  if (!settingsExists) {
    db.prepare(`
      INSERT INTO platform_settings (id, payment_recipient_name, payment_recipient_upi_id, qr_code_path)
      VALUES (1, 'Ayush Sujit Mandalkar', '7385561145@fam', '/qr-code.jpeg')
    `).run();
  } else {
    db.prepare(`
      UPDATE platform_settings
      SET payment_recipient_name = 'Ayush Sujit Mandalkar',
          payment_recipient_upi_id = '7385561145@fam',
          qr_code_path = '/qr-code.jpeg'
      WHERE id = 1
    `).run();
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_requests(status);
    CREATE INDEX IF NOT EXISTS idx_addon_assignments_user ON addon_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(recipient_ids);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_google_conn_restaurant ON google_connections(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_google_reviews_restaurant ON google_reviews(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_google_reviews_date ON google_reviews(review_date);
    CREATE INDEX IF NOT EXISTS idx_google_reviews_sentiment ON google_reviews(sentiment);
    CREATE INDEX IF NOT EXISTS idx_manual_batches_restaurant ON manual_review_batches(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_manual_reviews_restaurant ON manual_reviews(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_manual_reviews_product ON manual_reviews(product_name);
    CREATE INDEX IF NOT EXISTS idx_manual_reviews_batch ON manual_reviews(batch_id);
    CREATE INDEX IF NOT EXISTS idx_manual_reviews_sentiment ON manual_reviews(sentiment);
  `);

  // Seed default plans
  seedDefaultPlans();
  seedDefaultAddons();
  seedDefaultFeatures();
  seedDemoUsers();
}

function seedDefaultPlans() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as { count: number };
  if (existing.count > 0) return;

  const plans = [
    {
      id: 'plan_basic',
      name: 'Basic',
      description: 'Perfect for small restaurants getting started with review analytics',
      priceInr: 531,
      durationDays: 30,
      features: JSON.stringify([
        'review_monitoring',
        'sentiment_analysis',
        'basic_insights',
        'email_alerts',
        'up_to_5_products',
        'repetitive_review_types',
        'review_quality_analysis',
        'google_review_analysis'
      ]),
      usageLimits: JSON.stringify({ products: 5, reviews_per_month: 500, api_calls_per_day: 100 }),
      availableAddonIds: JSON.stringify(['addon_advanced_analytics', 'addon_competitor_analysis', 'addon_white_label_reports']),
      status: 'active',
      displayOrder: 1,
    },
    {
      id: 'plan_professional',
      name: 'Professional',
      description: 'For growing restaurants needing advanced analytics and automation',
      priceInr: 2499,
      durationDays: 30,
      features: JSON.stringify([
        'review_monitoring',
        'sentiment_analysis',
        'advanced_insights',
        'email_alerts',
        'sms_alerts',
        'competitor_analysis',
        'trend_analysis',
        'fake_review_detection',
        'up_to_20_products',
        'priority_support',
        'repetitive_review_types',
        'review_quality_analysis',
        'google_review_analysis'
      ]),
      usageLimits: JSON.stringify({ products: 20, reviews_per_month: 5000, api_calls_per_day: 1000 }),
      availableAddonIds: JSON.stringify(['addon_white_label_reports', 'addon_api_access', 'addon_dedicated_manager']),
      status: 'active',
      displayOrder: 2,
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      description: 'For large chains and enterprises with custom requirements',
      priceInr: 7999,
      durationDays: 30,
      features: JSON.stringify([
        'review_monitoring',
        'sentiment_analysis',
        'advanced_insights',
        'email_alerts',
        'sms_alerts',
        'competitor_analysis',
        'trend_analysis',
        'fake_review_detection',
        'unlimited_products',
        'priority_support',
        'dedicated_account_manager',
        'custom_integrations',
        'sso',
        'white_label',
        'api_access',
        'repetitive_review_types',
        'review_quality_analysis',
        'google_review_analysis'
      ]),
      usageLimits: JSON.stringify({ products: -1, reviews_per_month: -1, api_calls_per_day: 10000 }),
      availableAddonIds: JSON.stringify(['addon_dedicated_manager']),
      status: 'active',
      displayOrder: 3,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO subscription_plans (id, name, description, price_inr, duration_days, features, usage_limits, available_addon_ids, status, display_order)
    VALUES (@id, @name, @description, @priceInr, @durationDays, @features, @usageLimits, @availableAddonIds, @status, @displayOrder)
  `);

  for (const plan of plans) {
    insert.run(plan);
  }
}

function seedDefaultAddons() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM addons').get() as { count: number };
  if (existing.count > 0) return;

  const addons = [
    {
      id: 'addon_advanced_analytics',
      name: 'Advanced Analytics',
      identifier: 'advanced_analytics',
      description: 'Deep-dive analytics with cohort analysis, customer lifetime value, and predictive insights',
      icon: '📊',
      priceInr: 999,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({ minPlan: 'professional' }),
      featurePermissions: JSON.stringify(['cohort_analysis', 'clv_prediction', 'churn_prediction']),
      isActive: 1,
      displayOrder: 1,
    },
    {
      id: 'addon_competitor_analysis',
      name: 'Competitor Analysis',
      identifier: 'competitor_analysis',
      description: 'Track and compare your performance against nearby competitors',
      icon: '🏆',
      priceInr: 799,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({ minPlan: 'starter' }),
      featurePermissions: JSON.stringify(['competitor_tracking', 'benchmarking', 'market_share']),
      isActive: 1,
      displayOrder: 2,
    },
    {
      id: 'addon_white_label_reports',
      name: 'White-Label Reports',
      identifier: 'white_label_reports',
      description: 'Generate branded PDF reports with your logo and colors for stakeholders',
      icon: '📄',
      priceInr: 499,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({ minPlan: 'starter' }),
      featurePermissions: JSON.stringify(['custom_branding', 'pdf_export', 'scheduled_reports']),
      isActive: 1,
      displayOrder: 3,
    },
    {
      id: 'addon_api_access',
      name: 'API Access',
      identifier: 'api_access',
      description: 'REST API access for integrating SellSense data into your own systems',
      icon: '🔌',
      priceInr: 1499,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({ minPlan: 'professional' }),
      featurePermissions: JSON.stringify(['rest_api', 'webhooks', 'rate_limit_1000']),
      isActive: 1,
      displayOrder: 4,
    },
    {
      id: 'addon_dedicated_manager',
      name: 'Dedicated Success Manager',
      identifier: 'dedicated_manager',
      description: 'Personal customer success manager for strategy and optimization',
      icon: '👤',
      priceInr: 4999,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({ minPlan: 'professional' }),
      featurePermissions: JSON.stringify(['dedicated_support', 'quarterly_reviews', 'strategy_sessions']),
      isActive: 1,
      displayOrder: 5,
    },
    {
      id: 'addon_sms_alerts',
      name: 'SMS Alerts',
      identifier: 'sms_alerts',
      description: 'Real-time SMS notifications for critical reviews and sentiment changes',
      icon: '📱',
      priceInr: 299,
      billingType: 'recurring',
      durationDays: 30,
      eligibilityRules: JSON.stringify({}),
      featurePermissions: JSON.stringify(['sms_notifications']),
      isActive: 1,
      displayOrder: 6,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO addons (id, name, identifier, description, icon, price_inr, billing_type, duration_days, eligibility_rules, feature_permissions, is_active, display_order)
    VALUES (@id, @name, @identifier, @description, @icon, @priceInr, @billingType, @durationDays, @eligibilityRules, @featurePermissions, @isActive, @displayOrder)
  `);

  for (const addon of addons) {
    insert.run(addon);
  }
}

function seedDefaultFeatures() {
  const features = [
    // Core features
    { id: 'feat_review_monitoring', identifier: 'review_monitoring', name: 'Review Monitoring', description: 'Monitor reviews across Zomato, Swiggy, Google', category: 'core', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify([]), restrictedToAccounts: JSON.stringify([]), trialEnabled: 1, trialDurationDays: 14 },
    { id: 'feat_sentiment_analysis', identifier: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'AI-powered sentiment classification for reviews', category: 'core', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify([]), restrictedToAccounts: JSON.stringify([]), trialEnabled: 1, trialDurationDays: 14 },
    { id: 'feat_basic_insights', identifier: 'basic_insights', name: 'Basic Insights', description: 'Summary dashboards and key metrics', category: 'core', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify([]), restrictedToAccounts: JSON.stringify([]), trialEnabled: 1, trialDurationDays: 14 },
    { id: 'feat_email_alerts', identifier: 'email_alerts', name: 'Email Alerts', description: 'Email notifications for new reviews', category: 'core', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify([]), restrictedToAccounts: JSON.stringify([]), trialEnabled: 1, trialDurationDays: 14 },

    // Advanced features
    { id: 'feat_advanced_insights', identifier: 'advanced_insights', name: 'Advanced Insights', description: 'Detailed analytics and drill-down reports', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_sms_alerts', identifier: 'sms_alerts', name: 'SMS Alerts', description: 'SMS notifications for critical events', category: 'notifications', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_competitor_analysis', identifier: 'competitor_analysis', name: 'Competitor Analysis', description: 'Competitor tracking and benchmarking', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_trend_analysis', identifier: 'trend_analysis', name: 'Trend Analysis', description: 'Historical trends and pattern detection', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_fake_review_detection', identifier: 'fake_review_detection', name: 'Fake Review Detection', description: 'AI-powered fake review identification', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_priority_support', identifier: 'priority_support', name: 'Priority Support', description: 'Faster response times and dedicated support', category: 'support', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },

    // Premium features (locked behind subscription)
    { id: 'feat_repetitive_review_types', identifier: 'repetitive_review_types', name: 'Most Repetitive Review Types', description: 'Identify most common review themes and patterns', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_review_quality_analysis', identifier: 'review_quality_analysis', name: 'Review Quality Analysis', description: 'Fake and duplicate review detection', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'feat_google_review_analysis', identifier: 'google_review_analysis', name: 'Google Review Analysis', description: 'Google Maps reviews sentiment and trends', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },

    // Aliases to match override identifiers directly
    { id: 'repetitive_reviews', identifier: 'repetitive_reviews', name: 'Most Repetitive Review Types', description: 'Identify most common review themes and patterns', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'fake_review_detection', identifier: 'fake_review_detection_direct', name: 'Fake & Duplicate Review Detection', description: 'AI-powered fake and nonsense review identification', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'google_review_analysis', identifier: 'google_review_analysis_direct', name: 'Google Review Analysis', description: 'Google Maps reviews sentiment and trends', category: 'analytics', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'smart_alerts', identifier: 'smart_alerts', name: 'Smart Alerts', description: 'Instant notification for critical negative reviews', category: 'notifications', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
    { id: 'ai_replies', identifier: 'ai_replies', name: 'AI Auto-Replies', description: 'Empathetic automated review responses', category: 'automation', isGloballyEnabled: 1, restrictedToPlans: JSON.stringify(['basic', 'professional', 'enterprise']), restrictedToAccounts: JSON.stringify([]), trialEnabled: 0 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO feature_definitions (id, identifier, name, description, category, is_globally_enabled, restricted_to_plans, restricted_to_accounts, trial_enabled, trial_duration_days)
    VALUES (@id, @identifier, @name, @description, @category, @isGloballyEnabled, @restrictedToPlans, @restrictedToAccounts, @trialEnabled, @trialDurationDays)
  `);

  for (const feature of features) {
    try {
      insert.run({ trialDurationDays: null, ...feature });
    } catch (e) {}
  }
}

function seedDemoUsers() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('admin@sellsense.ai') as { count: number };
  if (existing.count === 0) {
    const users = [
      {
        id: 'user_admin_001',
        email: 'admin@sellsense.ai',
        passwordHash: '$2a$10$demo', // placeholder
        fullName: 'Super Admin',
        role: 'super_admin',
        phone: '+91-9876543210',
        isActive: 1,
      },
      {
        id: 'user_demo_001',
        email: 'demo@nelamrestaurants.com',
        passwordHash: '$2a$10$demo',
        fullName: 'Demo Restaurant Owner',
        role: 'restaurant_owner',
        phone: '+91-9876543211',
        isActive: 1,
      },
      {
        id: 'user_owner_001',
        email: 'owner@spicekitchen.com',
        passwordHash: '$2a$10$demo',
        fullName: 'Rajesh Kumar',
        role: 'restaurant_owner',
        phone: '+91-9876543212',
        isActive: 1,
      },
    ];

    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, phone, is_active)
      VALUES (@id, @email, @passwordHash, @fullName, @role, @phone, @isActive)
    `);

    for (const user of users) {
      insert.run(user);
    }
  }

  // Always ensure demo restaurants exist (both restaurant_nelam_001 and rest_demo_001)
  seedDemoRestaurants();
}

function seedDemoRestaurants() {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO restaurants (id, name, owner_name, business_type, city, location, contact_email, description, review_sources, data_mode, owner_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'rest_demo_001',
      'Nelam Restaurants',
      'Demo Restaurant Owner',
      'Restaurant',
      'Mumbai',
      'Andheri West, Mumbai',
      'demo@nelamrestaurants.com',
      'Authentic North Indian cuisine',
      JSON.stringify(['Zomato']),
      'DEMO',
      'user_demo_001',
      1
    );

    db.prepare(`
      INSERT OR IGNORE INTO restaurants (id, name, owner_name, business_type, city, location, contact_email, description, review_sources, data_mode, owner_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'restaurant_nelam_001',
      'Nelam Restaurants',
      'Demo Restaurant Owner',
      'Restaurant',
      'Pune',
      'Koregaon Park, Pune',
      'demo@nelamrestaurants.com',
      'Fine dining with traditional Indian flavors',
      JSON.stringify(['Zomato', 'Swiggy']),
      'DEMO',
      'user_demo_001',
      1
    );
  } catch (e) {
    console.warn('Could not seed demo restaurants:', e);
  }
}

// ============ HELPER FUNCTIONS ============

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export default db;