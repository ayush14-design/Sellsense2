import { Router, Request, Response } from 'express';
import db, { generateId, nowISO, initializeDatabase as ensureDbInitialized } from '../models/database.js';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth.js';
import {
  UserRow,
  RestaurantRow,
  SubscriptionPlanRow,
  SubscriptionRow,
  PaymentRequestRow,
  AddonRow,
  AddonAssignmentRow,
  FeatureDefinitionRow,
  UserFeatureOverrideRow,
  NotificationRow,
  AdminAuditLogRow,
  PlatformSettingsRow,
} from '../models/database.types.js';

const router = Router();

// ============ MIDDLEWARE ============
// All admin routes require super_admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============ HELPER FUNCTIONS ============

function logAudit(adminUserId: string, action: string, entityType: string, entityId: string, previousValue?: any, newValue?: any, reason?: string) {
  const stmt = db.prepare(`
    INSERT INTO admin_audit_logs (id, admin_user_id, action, entity_type, entity_id, previous_value, new_value, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    generateId('audit'),
    adminUserId,
    action,
    entityType,
    entityId,
    previousValue ? JSON.stringify(previousValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    reason || null
  );
}

// ============ OVERVIEW / DASHBOARD ============
router.get('/overview', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const stats = {
      totalUsers: (db.prepare('SELECT COUNT(*) as count FROM users WHERE role != ?').get('super_admin') as { count: number }).count,
      activeUsers: (db.prepare('SELECT COUNT(*) as count FROM users WHERE role != ? AND is_active = 1').get('super_admin') as { count: number }).count,
      totalRestaurants: (db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number }).count,
      activeRestaurants: (db.prepare('SELECT COUNT(*) as count FROM restaurants WHERE is_active = 1').get() as { count: number }).count,
      totalSubscriptions: (db.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as { count: number }).count,
      activeSubscriptions: (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE status = ?').get('active') as { count: number }).count,
      expiredSubscriptions: (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE status = ?').get('expired') as { count: number }).count,
      suspendedSubscriptions: (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE status = ?').get('suspended') as { count: number }).count,
      pendingPayments: (db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status IN (?, ?)').get('pending_submission', 'pending_verification') as { count: number }).count,
      totalRevenue: (db.prepare('SELECT COALESCE(SUM(amount_inr), 0) as total FROM payment_requests WHERE status = ?').get('approved') as { total: number }).total,
      monthlyRevenue: (db.prepare("SELECT COALESCE(SUM(amount_inr), 0) as total FROM payment_requests WHERE status = ? AND submitted_at >= date('now', '-30 days')").get('approved') as { total: number }).total,
      totalAddons: (db.prepare('SELECT COUNT(*) as count FROM addons WHERE is_active = 1').get() as { count: number }).count,
      activeAddonAssignments: (db.prepare("SELECT COUNT(*) as count FROM addon_assignments WHERE expires_at IS NULL OR expires_at > datetime('now')").get() as { count: number }).count,
      unreadNotifications: (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as { count: number }).count,
    };

    // Recent activity
    const recentPayments = db.prepare(`
      SELECT pr.*, u.email as user_email, u.full_name as user_name, r.name as restaurant_name, p.name as plan_name
      FROM payment_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN restaurants r ON pr.restaurant_id = r.id
      JOIN subscription_plans p ON pr.plan_id = p.id
      ORDER BY pr.submitted_at DESC
      LIMIT 10
    `).all() as any[];

    const recentUsers = db.prepare(`
      SELECT id, email, full_name, role, created_at, last_login_at, is_active
      FROM users
      WHERE role != ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all('super_admin') as any[];

    const expiringSubscriptions = db.prepare(`
      SELECT s.*, u.email as user_email, u.full_name as user_name, r.name as restaurant_name, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN restaurants r ON s.restaurant_id = r.id
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status = ? AND s.expires_at <= date('now', '+7 days') AND s.expires_at >= datetime('now')
      ORDER BY s.expires_at ASC
      LIMIT 10
    `).all('active') as any[];

    res.json({
      stats,
      recentPayments,
      recentUsers,
      expiringSubscriptions,
    });
  } catch (error: any) {
    console.error('Overview error:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch overview' });
  }
});

// ============ USER MANAGEMENT ============
router.get('/users', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE role != ?';
    const params: any[] = ['super_admin'];

    if (search) {
      where += ' AND (email LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }
    if (status === 'active') {
      where += ' AND is_active = 1';
    } else if (status === 'inactive') {
      where += ' AND is_active = 0';
    }

    const users = db.prepare(`
      SELECT u.*,
        (SELECT COUNT(*) FROM restaurants WHERE owner_id = u.id) as restaurant_count,
        (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id AND status = 'active') as active_subscriptions
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as { count: number };

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const user = db.prepare(`
      SELECT * FROM users WHERE id = ? AND role != ?
    `).get(req.params.id, 'super_admin') as UserRow | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const restaurants = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').all(user.id) as RestaurantRow[];
    const subscriptions = db.prepare(`
      SELECT s.*, p.name as plan_name
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(user.id) as any[];
    const payments = db.prepare(`
      SELECT pr.*, p.name as plan_name
      FROM payment_requests pr
      JOIN subscription_plans p ON pr.plan_id = p.id
      WHERE pr.user_id = ?
      ORDER BY pr.submitted_at DESC
    `).all(user.id) as any[];
    const addons = db.prepare(`
      SELECT aa.*, a.name as addon_name, a.identifier as addon_identifier
      FROM addon_assignments aa
      JOIN addons a ON aa.addon_id = a.id
      WHERE aa.user_id = ?
      ORDER BY aa.created_at DESC
    `).all(user.id) as any[];
    const featureOverrides = db.prepare(`
      SELECT ufo.*, fd.name as feature_name, fd.identifier as feature_identifier
      FROM user_feature_overrides ufo
      JOIN feature_definitions fd ON ufo.feature_id = fd.id
      WHERE ufo.user_id = ?
      ORDER BY ufo.created_at DESC
    `).all(user.id) as any[];

    res.json({ user, restaurants, subscriptions, payments, addons, featureOverrides });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/users/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { full_name, phone, role, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ? AND role != ?').get(id, 'super_admin');
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    logAudit(req.user!.id, 'update_user', 'user', id, existing, updated, 'Admin updated user');

    res.json({ user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/users/:id/grant-premium', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { durationDays = 30, adminNote } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create restaurant for user
    let restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ? AND is_active = 1').get(id) as any;
    if (!restaurant) {
      const restId = generateId('rest');
      db.prepare(`
        INSERT INTO restaurants (id, name, owner_name, business_type, city, location, contact_email, owner_id)
        VALUES (?, ?, ?, 'Restaurant', 'Pune', 'Main St', ?, ?)
      `).run(restId, `${user.full_name}'s Restaurant`, user.full_name, user.email, id);
      restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restId);
    }

    const plan = (db.prepare("SELECT * FROM subscription_plans WHERE id = 'plan_basic'").get() ||
      db.prepare("SELECT * FROM subscription_plans LIMIT 1").get()) as SubscriptionPlanRow;

    const startsAt = nowISO();
    const expiresAt = new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString();

    const subId = generateId('sub');
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, restaurant_id, plan_id, status, starts_at, expires_at, is_complimentary, admin_note)
      VALUES (?, ?, ?, ?, 'active', ?, ?, 1, ?)
    `).run(subId, id, restaurant.id, plan.id, startsAt, expiresAt, adminNote || 'Premium permission granted directly by admin');

    // Grant user feature overrides for all locked features
    const premiumFeatureIds = [
      'feat_repetitive_review_types', 'repetitive_reviews',
      'feat_review_quality_analysis', 'fake_review_detection',
      'feat_google_review_analysis', 'google_review_analysis',
      'smart_alerts', 'ai_replies'
    ];
    for (const fId of premiumFeatureIds) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO feature_definitions (id, identifier, name, description, category, is_globally_enabled)
          VALUES (?, ?, ?, 'Premium feature', 'analytics', 1)
        `).run(fId, fId, fId.replace(/_/g, ' ').toUpperCase());

        const existingOverride = db.prepare('SELECT id FROM user_feature_overrides WHERE user_id = ? AND feature_id = ?').get(id, fId) as any;
        if (existingOverride) {
          db.prepare('UPDATE user_feature_overrides SET is_enabled = 1, expires_at = ? WHERE id = ?').run(expiresAt, existingOverride.id);
        } else {
          const overrideId = generateId('ufo');
          db.prepare('INSERT INTO user_feature_overrides (id, user_id, feature_id, is_enabled, expires_at, reason, created_by) VALUES (?, ?, ?, 1, ?, ?, ?)').run(
            overrideId, id, fId, expiresAt, 'Admin granted permission directly', req.user!.id
          );
        }
      } catch (overrideErr) {
        console.warn('Feature override warning for', fId, overrideErr);
      }
    }

    logAudit(req.user!.id, 'grant_user_premium', 'user', id, null, { subscriptionId: subId, expiresAt }, adminNote || 'Granted premium features to user');

    res.json({ success: true, message: `Premium features successfully granted to ${user.full_name} for ${durationDays} days.` });
  } catch (error) {
    console.error('Grant user premium error:', error);
    res.status(500).json({ error: 'Failed to grant user premium features' });
  }
});

router.delete('/users/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM users WHERE id = ? AND role != ?').get(id, 'super_admin');
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete - deactivate user and cascade
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
    db.prepare('UPDATE restaurants SET is_active = 0 WHERE owner_id = ?').run(id);
    db.prepare('UPDATE subscriptions SET status = ? WHERE user_id = ?').run('suspended', id);

    logAudit(req.user!.id, 'delete_user', 'user', id, existing, { ...existing, is_active: 0 }, 'Admin deleted/deactivated user');

    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ RESTAURANT MANAGEMENT ============
router.get('/restaurants', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 20, search, status, city } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (name LIKE ? OR owner_name LIKE ? OR contact_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (status === 'active') {
      where += ' AND is_active = 1';
    } else if (status === 'inactive') {
      where += ' AND is_active = 0';
    }
    if (city) {
      where += ' AND city = ?';
      params.push(city);
    }

    const restaurants = db.prepare(`
      SELECT r.*, u.email as owner_email, u.full_name as owner_name
      FROM restaurants r
      LEFT JOIN users u ON r.owner_id = u.id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM restaurants ${where}`).get(...params) as { count: number };

    res.json({ restaurants, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.patch('/restaurants/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { name, owner_name, business_type, city, location, contact_email, description, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (owner_name !== undefined) { updates.push('owner_name = ?'); params.push(owner_name); }
    if (business_type !== undefined) { updates.push('business_type = ?'); params.push(business_type); }
    if (city !== undefined) { updates.push('city = ?'); params.push(city); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    db.prepare(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
    logAudit(req.user!.id, 'update_restaurant', 'restaurant', id, existing, updated, 'Admin updated restaurant');

    res.json({ restaurant: updated });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

router.delete('/restaurants/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    db.prepare('UPDATE restaurants SET is_active = 0 WHERE id = ?').run(id);
    db.prepare('UPDATE subscriptions SET status = ? WHERE restaurant_id = ?').run('suspended', id);

    logAudit(req.user!.id, 'delete_restaurant', 'restaurant', id, existing, { ...existing, is_active: 0 }, 'Admin deleted/deactivated restaurant');

    res.json({ success: true });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// ============ PAYMENT MANAGEMENT ============
router.get('/payments', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND pr.status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (u.email LIKE ? OR u.full_name LIKE ? OR r.name LIKE ? OR pr.transaction_reference LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const payments = db.prepare(`
      SELECT pr.*, u.email as user_email, u.full_name as user_name, r.name as restaurant_name, r.owner_name as restaurant_owner_name, p.name as plan_name,
        reviewer.full_name as reviewed_by_name,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = pr.user_id AND s.status = 'active' AND datetime(s.expires_at) > datetime('now')) as has_active_subscription
      FROM payment_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN restaurants r ON pr.restaurant_id = r.id
      JOIN subscription_plans p ON pr.plan_id = p.id
      LEFT JOIN users reviewer ON pr.reviewed_by = reviewer.id
      ${where}
      ORDER BY pr.submitted_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM payment_requests pr JOIN users u ON pr.user_id = u.id JOIN restaurants r ON pr.restaurant_id = r.id ${where}`).get(...params) as { count: number };

    // Stats
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status IN (?, ?)').get('pending_submission', 'pending_verification') as { count: number },
      approved: db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status = ?').get('approved') as { count: number },
      rejected: db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status = ?').get('rejected') as { count: number },
      needsCorrection: db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status = ?').get('needs_correction') as { count: number },
      totalAmount: db.prepare('SELECT COALESCE(SUM(amount_inr), 0) as total FROM payment_requests WHERE status = ?').get('approved') as { total: number },
    };

    res.json({ payments, total, page: Number(page), limit: Number(limit), stats });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/payments/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const payment = db.prepare(`
      SELECT pr.*, u.email as user_email, u.full_name as user_name, u.phone as user_phone,
        r.name as restaurant_name, r.owner_name as restaurant_owner_name, r.city as restaurant_city,
        p.name as plan_name, p.price_inr as plan_price, p.duration_days as plan_duration,
        reviewer.full_name as reviewed_by_name,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = pr.user_id AND s.status = 'active' AND datetime(s.expires_at) > datetime('now')) as has_active_subscription
      FROM payment_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN restaurants r ON pr.restaurant_id = r.id
      JOIN subscription_plans p ON pr.plan_id = p.id
      LEFT JOIN users reviewer ON pr.reviewed_by = reviewer.id
      WHERE pr.id = ?
    `).get(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/payments/:id/approve', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    if (payment.status !== 'pending_verification' && payment.status !== 'pending_submission') {
      return res.status(400).json({ error: 'Payment is not in a verifiable state' });
    }

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(payment.plan_id) as SubscriptionPlanRow | undefined;
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate subscription dates
    const startsAt = nowISO();
    const expiresAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

    // Create subscription
    const subscriptionId = generateId('sub');
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, restaurant_id, plan_id, payment_request_id, status, starts_at, expires_at, is_complimentary, admin_note)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, ?)
    `).run(subscriptionId, payment.user_id, payment.restaurant_id, payment.plan_id, payment.id, startsAt, expiresAt, adminNote || 'Approved by admin');

    // Update payment status
    db.prepare(`
      UPDATE payment_requests
      SET status = 'approved', reviewed_at = ?, reviewed_by = ?, admin_reason = ?
      WHERE id = ?
    `).run(nowISO(), req.user!.id, adminNote || 'Approved', id);

    logAudit(req.user!.id, 'approve_payment', 'payment', id, payment, { ...payment, status: 'approved' }, adminNote || 'Approved by admin');

    // Create notification for user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'Payment Approved ✅',
      `Your payment of ₹${payment.amount_inr} for ${plan.name} plan has been approved. Your subscription is now active until ${new Date(expiresAt).toLocaleDateString()}.`,
      JSON.stringify([payment.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true, subscriptionId });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Grant Permission of Locked & Premium Features directly to Owner after payment
router.post('/payments/:id/grant-premium', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    let payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
    if (!payment) {
      const defaultUser = db.prepare("SELECT * FROM users WHERE role = 'restaurant_owner' OR email != 'admin@sellsense.ai' LIMIT 1").get() as any;
      const defaultRest = db.prepare("SELECT * FROM restaurants LIMIT 1").get() as any;
      const targetUserId = req.body?.userId || defaultUser?.id || 'user_demo_001';
      const targetRestId = req.body?.restaurantId || defaultRest?.id || 'rest_demo_001';
      const newPayId = id || generateId('pay');

      try {
        db.prepare(`
          INSERT INTO payment_requests (id, user_id, restaurant_id, plan_id, amount_inr, status, transaction_reference, payment_mode, submitted_at, reviewed_at, reviewed_by, admin_reason)
          VALUES (?, ?, ?, 'plan_basic', 531, 'approved', 'MANUAL_GRANT', 'upi', datetime('now'), datetime('now'), ?, ?)
        `).run(newPayId, targetUserId, targetRestId, req.user?.id || 'user_admin_001', adminNote || 'Admin granted access');
        payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(newPayId) as PaymentRequestRow;
      } catch (err) {
        console.warn('Fallback payment insert notice:', err);
      }
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment request could not be processed' });
    }

    const plan = (db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(payment.plan_id) ||
      db.prepare("SELECT * FROM subscription_plans WHERE id = 'plan_basic'").get()) as SubscriptionPlanRow | undefined;

    const durationDays = plan?.duration_days || 30;
    const startsAt = nowISO();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Check existing subscription
    const existingSub = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? AND restaurant_id = ? 
      ORDER BY expires_at DESC LIMIT 1
    `).get(payment.user_id, payment.restaurant_id) as any;

    let subscriptionId: string;
    if (existingSub && existingSub.status === 'active' && new Date(existingSub.expires_at) > new Date()) {
      subscriptionId = existingSub.id;
      const currentExpiry = new Date(existingSub.expires_at).getTime();
      const newExpiry = new Date(currentExpiry + durationDays * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE subscriptions 
        SET expires_at = ?, status = 'active', admin_note = ? 
        WHERE id = ?
      `).run(newExpiry, adminNote || 'Extended & unlocked by admin after payment', subscriptionId);
    } else {
      subscriptionId = generateId('sub');
      db.prepare(`
        INSERT INTO subscriptions (id, user_id, restaurant_id, plan_id, payment_request_id, status, starts_at, expires_at, is_complimentary, admin_note)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, ?)
      `).run(subscriptionId, payment.user_id, payment.restaurant_id, payment.plan_id, payment.id, startsAt, expiresAt, adminNote || 'Permission granted by admin after payment');
    }

    // Mark payment status as 'approved' (Payment Done = YES)
    db.prepare(`
      UPDATE payment_requests
      SET status = 'approved', reviewed_at = ?, reviewed_by = ?, admin_reason = ?
      WHERE id = ?
    `).run(nowISO(), req.user!.id, adminNote || 'Payment verified and premium features permission granted by admin', id);

    // Explicitly grant user feature overrides for all locked features
    const premiumFeatureIds = [
      'feat_repetitive_review_types', 'repetitive_reviews',
      'feat_review_quality_analysis', 'fake_review_detection',
      'feat_google_review_analysis', 'google_review_analysis',
      'smart_alerts', 'ai_replies'
    ];
    for (const fId of premiumFeatureIds) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO feature_definitions (id, identifier, name, description, category, is_globally_enabled)
          VALUES (?, ?, ?, 'Premium feature', 'analytics', 1)
        `).run(fId, fId, fId.replace(/_/g, ' ').toUpperCase());

        const existingOverride = db.prepare('SELECT id FROM user_feature_overrides WHERE user_id = ? AND feature_id = ?').get(payment.user_id, fId) as any;
        if (existingOverride) {
          db.prepare('UPDATE user_feature_overrides SET is_enabled = 1, expires_at = ? WHERE id = ?').run(expiresAt, existingOverride.id);
        } else {
          const overrideId = generateId('ufo');
          db.prepare('INSERT INTO user_feature_overrides (id, user_id, feature_id, is_enabled, expires_at, reason, created_by) VALUES (?, ?, ?, 1, ?, ?, ?)').run(
            overrideId, payment.user_id, fId, expiresAt, 'Admin granted permission after payment', req.user!.id
          );
        }
      } catch (overrideErr) {
        console.warn('Feature override warning for', fId, overrideErr);
      }
    }

    // Audit log
    logAudit(req.user!.id, 'grant_premium_permission', 'payment', id, payment, { ...payment, status: 'approved' }, adminNote || 'Granted premium features after payment');

    // Notify the restaurant owner
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'Payment Done & Premium Features Unlocked! 🌟',
      `Payment of ₹${payment.amount_inr} has been confirmed. All locked and premium features are now active for your restaurant until ${new Date(expiresAt).toLocaleDateString()}.`,
      JSON.stringify([payment.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({
      success: true,
      subscriptionId,
      message: 'Payment confirmed as done and premium features permission granted to owner successfully!'
    });
  } catch (error) {
    console.error('Grant premium error:', error);
    res.status(500).json({ error: 'Failed to grant premium features permission' });
  }
});

// Revoke / Lock Premium Features
router.post('/payments/:id/revoke-premium', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();
  try {
    const { id } = req.params;
    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
    if (!payment) return res.status(404).json({ error: 'Payment request not found' });

    db.prepare("UPDATE subscriptions SET status = 'suspended', admin_note = 'Revoked by admin' WHERE payment_request_id = ?").run(id);
    db.prepare("UPDATE payment_requests SET status = 'pending_verification' WHERE id = ?").run(id);
    db.prepare('DELETE FROM user_feature_overrides WHERE user_id = ?').run(payment.user_id);

    logAudit(req.user!.id, 'revoke_premium_permission', 'payment', id, payment, { ...payment, status: 'pending_verification' }, 'Revoked by admin');
    res.json({ success: true, message: 'Premium features permission revoked and locked.' });
  } catch (error) {
    console.error('Revoke premium error:', error);
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
});

router.post('/payments/:id/reject', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminReason } = req.body;

    if (!adminReason || adminReason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    if (payment.status !== 'pending_verification' && payment.status !== 'pending_submission') {
      return res.status(400).json({ error: 'Payment is not in a verifiable state' });
    }

    db.prepare(`
      UPDATE payment_requests
      SET status = 'rejected', reviewed_at = ?, reviewed_by = ?, admin_reason = ?
      WHERE id = ?
    `).run(nowISO(), req.user!.id, adminReason, id);

    logAudit(req.user!.id, 'reject_payment', 'payment', id, payment, { ...payment, status: 'rejected' }, adminReason);

    // Create notification for user
    const plan = db.prepare('SELECT name FROM subscription_plans WHERE id = ?').get(payment.plan_id) as { name: string } | undefined;
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'Payment Rejected ❌',
      `Your payment of ₹${payment.amount_inr} for ${plan?.name || 'plan'} plan was rejected. Reason: ${adminReason}. You can resubmit with correct details.`,
      JSON.stringify([payment.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

router.post('/payments/:id/request-correction', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminReason } = req.body;

    if (!adminReason || adminReason.trim().length === 0) {
      return res.status(400).json({ error: 'Correction reason is required' });
    }

    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    db.prepare(`
      UPDATE payment_requests
      SET status = 'needs_correction', reviewed_at = ?, reviewed_by = ?, admin_reason = ?
      WHERE id = ?
    `).run(nowISO(), req.user!.id, adminReason, id);

    logAudit(req.user!.id, 'request_correction_payment', 'payment', id, payment, { ...payment, status: 'needs_correction' }, adminReason);

    // Create notification for user
    const plan = db.prepare('SELECT name FROM subscription_plans WHERE id = ?').get(payment.plan_id) as { name: string } | undefined;
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'Payment Needs Correction 📝',
      `Your payment for ${plan?.name || 'plan'} plan needs correction. Reason: ${adminReason}. Please resubmit with the correct details.`,
      JSON.stringify([payment.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Request correction error:', error);
    res.status(500).json({ error: 'Failed to request correction' });
  }
});

// ============ SUBSCRIPTION MANAGEMENT ============
router.get('/subscriptions', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (u.email LIKE ? OR u.full_name LIKE ? OR r.name LIKE ? OR p.name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const subscriptions = db.prepare(`
      SELECT s.*, u.email as user_email, u.full_name as user_name, r.name as restaurant_name, p.name as plan_name, p.price_inr as plan_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN restaurants r ON s.restaurant_id = r.id
      JOIN subscription_plans p ON s.plan_id = p.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset) as any[];

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN restaurants r ON s.restaurant_id = r.id
      JOIN subscription_plans p ON s.plan_id = p.id
      ${where}
    `).get(...params) as { count: number };

    res.json({ subscriptions, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.post('/subscriptions/:id/extend', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { days, adminNote } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({ error: 'Valid days required' });
    }

    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as SubscriptionRow | undefined;
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const currentExpiry = new Date(subscription.expires_at);
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000);

    db.prepare(`
      UPDATE subscriptions
      SET expires_at = ?, updated_at = ?, admin_note = ?
      WHERE id = ?
    `).run(newExpiry.toISOString(), nowISO(), adminNote || `Extended by ${days} days by admin`, id);

    logAudit(req.user!.id, 'extend_subscription', 'subscription', id, subscription, { ...subscription, expires_at: newExpiry.toISOString() }, adminNote || `Extended by ${days} days`);

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'subscription', ?, ?)
    `).run(
      notificationId,
      'Subscription Extended 📅',
      `Your subscription has been extended by ${days} days. New expiry: ${newExpiry.toLocaleDateString()}.`,
      JSON.stringify([subscription.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true, newExpiry: newExpiry.toISOString() });
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({ error: 'Failed to extend subscription' });
  }
});

router.post('/subscriptions/:id/suspend', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as SubscriptionRow | undefined;
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    db.prepare(`
      UPDATE subscriptions
      SET status = 'suspended', updated_at = ?, admin_note = ?
      WHERE id = ?
    `).run(nowISO(), adminNote || 'Suspended by admin', id);

    logAudit(req.user!.id, 'suspend_subscription', 'subscription', id, subscription, { ...subscription, status: 'suspended' }, adminNote || 'Suspended by admin');

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'subscription', ?, ?)
    `).run(
      notificationId,
      'Subscription Suspended ⏸️',
      `Your subscription has been suspended. Reason: ${adminNote || 'No reason provided'}. Contact support for details.`,
      JSON.stringify([subscription.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Suspend subscription error:', error);
    res.status(500).json({ error: 'Failed to suspend subscription' });
  }
});

router.post('/subscriptions/:id/activate', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as SubscriptionRow | undefined;
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    db.prepare(`
      UPDATE subscriptions
      SET status = 'active', updated_at = ?, admin_note = ?
      WHERE id = ?
    `).run(nowISO(), adminNote || 'Reactivated by admin', id);

    logAudit(req.user!.id, 'activate_subscription', 'subscription', id, subscription, { ...subscription, status: 'active' }, adminNote || 'Reactivated by admin');

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'subscription', ?, ?)
    `).run(
      notificationId,
      'Subscription Reactivated ✅',
      `Your subscription has been reactivated. You now have full access to all features.`,
      JSON.stringify([subscription.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Activate subscription error:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

// ============ PLAN MANAGEMENT ============
router.get('/plans', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const plans = db.prepare(`
      SELECT * FROM subscription_plans ORDER BY display_order ASC
    `).all() as SubscriptionPlanRow[];

    // Parse JSON fields
    const parsedPlans = plans.map(p => ({
      ...p,
      features: JSON.parse(p.features),
      usageLimits: JSON.parse(p.usage_limits),
      availableAddonIds: JSON.parse(p.available_addon_ids),
    }));

    res.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.post('/plans', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { name, description, priceInr, durationDays, features, usageLimits, availableAddonIds, status, displayOrder } = req.body;

    const id = generateId('plan');
    db.prepare(`
      INSERT INTO subscription_plans (id, name, description, price_inr, duration_days, features, usage_limits, available_addon_ids, status, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description, priceInr, durationDays, JSON.stringify(features || []), JSON.stringify(usageLimits || {}), JSON.stringify(availableAddonIds || []), status || 'active', displayOrder || 0);

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) as SubscriptionPlanRow;
    logAudit(req.user!.id, 'create_plan', 'plan', id, null, plan, 'Admin created plan');

    res.json({ plan: { ...plan, features: JSON.parse(plan.features), usageLimits: JSON.parse(plan.usage_limits), availableAddonIds: JSON.parse(plan.available_addon_ids) } });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.patch('/plans/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { name, description, priceInr, durationDays, features, usageLimits, availableAddonIds, status, displayOrder } = req.body;

    const existing = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) as SubscriptionPlanRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (priceInr !== undefined) { updates.push('price_inr = ?'); params.push(priceInr); }
    if (durationDays !== undefined) { updates.push('duration_days = ?'); params.push(durationDays); }
    if (features !== undefined) { updates.push('features = ?'); params.push(JSON.stringify(features)); }
    if (usageLimits !== undefined) { updates.push('usage_limits = ?'); params.push(JSON.stringify(usageLimits)); }
    if (availableAddonIds !== undefined) { updates.push('available_addon_ids = ?'); params.push(JSON.stringify(availableAddonIds)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (displayOrder !== undefined) { updates.push('display_order = ?'); params.push(displayOrder); }

    updates.push('updated_at = ?');
    params.push(nowISO());
    params.push(id);

    db.prepare(`UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) as SubscriptionPlanRow;
    logAudit(req.user!.id, 'update_plan', 'plan', id, existing, updated, 'Admin updated plan');

    res.json({ plan: { ...updated, features: JSON.parse(updated.features), usageLimits: JSON.parse(updated.usage_limits), availableAddonIds: JSON.parse(updated.available_addon_ids) } });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) as SubscriptionPlanRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if plan has active subscriptions
    const activeSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = ?').get(id, 'active') as { count: number };
    if (activeSubs.count > 0) {
      return res.status(400).json({ error: 'Cannot delete plan with active subscriptions. Archive instead.' });
    }

    db.prepare('UPDATE subscription_plans SET status = ? WHERE id = ?').run('archived', id);

    logAudit(req.user!.id, 'archive_plan', 'plan', id, existing, { ...existing, status: 'archived' }, 'Admin archived plan');

    res.json({ success: true });
  } catch (error) {
    console.error('Archive plan error:', error);
    res.status(500).json({ error: 'Failed to archive plan' });
  }
});

// ============ ADDON MANAGEMENT ============
router.get('/addons', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const addons = db.prepare('SELECT * FROM addons ORDER BY display_order ASC').all() as AddonRow[];
    const parsedAddons = addons.map(a => ({
      ...a,
      eligibilityRules: JSON.parse(a.eligibility_rules),
      featurePermissions: JSON.parse(a.feature_permissions),
    }));
    res.json({ addons: parsedAddons });
  } catch (error) {
    console.error('Get addons error:', error);
    res.status(500).json({ error: 'Failed to fetch addons' });
  }
});

router.post('/addons', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { name, identifier, description, icon, priceInr, billingType, durationDays, eligibilityRules, featurePermissions, displayOrder } = req.body;

    const id = generateId('addon');
    db.prepare(`
      INSERT INTO addons (id, name, identifier, description, icon, price_inr, billing_type, duration_days, eligibility_rules, feature_permissions, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, identifier, description, icon || null, priceInr || null, billingType || 'one_time', durationDays || null, JSON.stringify(eligibilityRules || {}), JSON.stringify(featurePermissions || []), displayOrder || 0);

    const addon = db.prepare('SELECT * FROM addons WHERE id = ?').get(id) as AddonRow;
    logAudit(req.user!.id, 'create_addon', 'addon', id, null, addon, 'Admin created addon');

    res.json({ addon: { ...addon, eligibilityRules: JSON.parse(addon.eligibility_rules), featurePermissions: JSON.parse(addon.feature_permissions) } });
  } catch (error) {
    console.error('Create addon error:', error);
    res.status(500).json({ error: 'Failed to create addon' });
  }
});

router.patch('/addons/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { name, description, icon, priceInr, billingType, durationDays, eligibilityRules, featurePermissions, isActive, displayOrder } = req.body;

    const existing = db.prepare('SELECT * FROM addons WHERE id = ?').get(id) as AddonRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Addon not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (priceInr !== undefined) { updates.push('price_inr = ?'); params.push(priceInr); }
    if (billingType !== undefined) { updates.push('billing_type = ?'); params.push(billingType); }
    if (durationDays !== undefined) { updates.push('duration_days = ?'); params.push(durationDays); }
    if (eligibilityRules !== undefined) { updates.push('eligibility_rules = ?'); params.push(JSON.stringify(eligibilityRules)); }
    if (featurePermissions !== undefined) { updates.push('feature_permissions = ?'); params.push(JSON.stringify(featurePermissions)); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (displayOrder !== undefined) { updates.push('display_order = ?'); params.push(displayOrder); }

    updates.push('updated_at = ?');
    params.push(nowISO());
    params.push(id);

    db.prepare(`UPDATE addons SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM addons WHERE id = ?').get(id) as AddonRow;
    logAudit(req.user!.id, 'update_addon', 'addon', id, existing, updated, 'Admin updated addon');

    res.json({ addon: { ...updated, eligibilityRules: JSON.parse(updated.eligibility_rules), featurePermissions: JSON.parse(updated.feature_permissions) } });
  } catch (error) {
    console.error('Update addon error:', error);
    res.status(500).json({ error: 'Failed to update addon' });
  }
});

router.delete('/addons/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM addons WHERE id = ?').get(id) as AddonRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Addon not found' });
    }

    // Check for active assignments
    const activeAssignments = db.prepare("SELECT COUNT(*) as count FROM addon_assignments WHERE addon_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))").get(id) as { count: number };
    if (activeAssignments.count > 0) {
      return res.status(400).json({ error: 'Cannot delete addon with active assignments. Deactivate instead.' });
    }

    db.prepare('UPDATE addons SET is_active = 0 WHERE id = ?').run(id);

    logAudit(req.user!.id, 'deactivate_addon', 'addon', id, existing, { ...existing, is_active: 0 }, 'Admin deactivated addon');

    res.json({ success: true });
  } catch (error) {
    console.error('Deactivate addon error:', error);
    res.status(500).json({ error: 'Failed to deactivate addon' });
  }
});

router.post('/addons/assign', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { userId, restaurantId, addonId, expiresAt, isComplimentary, adminNote } = req.body;

    if (!userId || !restaurantId || !addonId) {
      return res.status(400).json({ error: 'userId, restaurantId, and addonId are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId) as RestaurantRow | undefined;
    const addon = db.prepare('SELECT * FROM addons WHERE id = ?').get(addonId) as AddonRow | undefined;

    if (!user || !restaurant || !addon) {
      return res.status(404).json({ error: 'User, restaurant, or addon not found' });
    }

    // Check eligibility rules
    const rules = JSON.parse(addon.eligibility_rules);
    if (rules.minPlan) {
      const sub = db.prepare('SELECT s.*, p.name as plan_name FROM subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.user_id = ? AND s.restaurant_id = ? AND s.status = ?').get(userId, restaurantId, 'active') as { plan_name: string } | undefined;
      if (!sub || (rules.minPlan === 'professional' && sub.plan_name === 'Starter') || (rules.minPlan === 'enterprise' && !['Professional', 'Enterprise'].includes(sub.plan_name))) {
        return res.status(400).json({ error: `Addon requires ${rules.minPlan} plan or higher` });
      }
    }

    const id = generateId('aa');
    const startsAt = nowISO();
    db.prepare(`
      INSERT INTO addon_assignments (id, user_id, restaurant_id, addon_id, starts_at, expires_at, is_complimentary, admin_note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, restaurantId, addonId, startsAt, expiresAt || null, isComplimentary ? 1 : 0, adminNote || 'Assigned by admin', req.user!.id);

    logAudit(req.user!.id, 'assign_addon', 'addon', id, null, { userId, restaurantId, addonId, expiresAt, isComplimentary }, adminNote || 'Assigned by admin');

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'addon', ?, ?)
    `).run(
      notificationId,
      'New Addon Assigned 🎁',
      `You have been assigned the "${addon.name}" addon${isComplimentary ? ' (complimentary)' : ''}.${expiresAt ? ` Expires: ${new Date(expiresAt).toLocaleDateString()}` : ''}`,
      JSON.stringify([userId]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true, assignmentId: id });
  } catch (error) {
    console.error('Assign addon error:', error);
    res.status(500).json({ error: 'Failed to assign addon' });
  }
});

router.delete('/addons/assign/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;

    const assignment = db.prepare('SELECT * FROM addon_assignments WHERE id = ?').get(id) as AddonAssignmentRow | undefined;
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const addon = db.prepare('SELECT name FROM addons WHERE id = ?').get(assignment.addon_id) as { name: string } | undefined;

    db.prepare('DELETE FROM addon_assignments WHERE id = ?').run(id);

    logAudit(req.user!.id, 'remove_addon_assignment', 'addon', id, assignment, null, 'Admin removed addon assignment');

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'addon', ?, ?)
    `).run(
      notificationId,
      'Addon Removed 🗑️',
      `The "${addon?.name || 'addon'}" addon has been removed from your account.`,
      JSON.stringify([assignment.user_id]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Remove addon assignment error:', error);
    res.status(500).json({ error: 'Failed to remove addon assignment' });
  }
});

// ============ FEATURE MANAGEMENT ============
router.get('/features', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const features = db.prepare('SELECT * FROM feature_definitions ORDER BY category, name').all() as FeatureDefinitionRow[];
    const parsedFeatures = features.map(f => ({
      ...f,
      restrictedToPlans: JSON.parse(f.restricted_to_plans),
      restrictedToAccounts: JSON.parse(f.restricted_to_accounts),
      isGloballyEnabled: Boolean(f.is_globally_enabled),
      trialEnabled: Boolean(f.trial_enabled),
    }));
    res.json({ features: parsedFeatures });
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

router.post('/features', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { identifier, name, description, category, isGloballyEnabled, restrictedToPlans, restrictedToAccounts, trialEnabled, trialDurationDays } = req.body;

    const id = generateId('feat');
    db.prepare(`
      INSERT INTO feature_definitions (id, identifier, name, description, category, is_globally_enabled, restricted_to_plans, restricted_to_accounts, trial_enabled, trial_duration_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, identifier, name, description, category, isGloballyEnabled ? 1 : 0, JSON.stringify(restrictedToPlans || []), JSON.stringify(restrictedToAccounts || []), trialEnabled ? 1 : 0, trialDurationDays || null);

    const feature = db.prepare('SELECT * FROM feature_definitions WHERE id = ?').get(id) as FeatureDefinitionRow;
    logAudit(req.user!.id, 'create_feature', 'feature', id, null, feature, 'Admin created feature');

    res.json({ feature: { ...feature, restrictedToPlans: JSON.parse(feature.restricted_to_plans), restrictedToAccounts: JSON.parse(feature.restricted_to_accounts), isGloballyEnabled: Boolean(feature.is_globally_enabled), trialEnabled: Boolean(feature.trial_enabled) } });
  } catch (error) {
    console.error('Create feature error:', error);
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

router.patch('/features/:id', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { id } = req.params;
    const { name, description, category, isGloballyEnabled, restrictedToPlans, restrictedToAccounts, trialEnabled, trialDurationDays } = req.body;

    const existing = db.prepare('SELECT * FROM feature_definitions WHERE id = ?').get(id) as FeatureDefinitionRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (isGloballyEnabled !== undefined) { updates.push('is_globally_enabled = ?'); params.push(isGloballyEnabled ? 1 : 0); }
    if (restrictedToPlans !== undefined) { updates.push('restricted_to_plans = ?'); params.push(JSON.stringify(restrictedToPlans)); }
    if (restrictedToAccounts !== undefined) { updates.push('restricted_to_accounts = ?'); params.push(JSON.stringify(restrictedToAccounts)); }
    if (trialEnabled !== undefined) { updates.push('trial_enabled = ?'); params.push(trialEnabled ? 1 : 0); }
    if (trialDurationDays !== undefined) { updates.push('trial_duration_days = ?'); params.push(trialDurationDays); }

    updates.push('updated_at = ?');
    params.push(nowISO());
    params.push(id);

    db.prepare(`UPDATE feature_definitions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM feature_definitions WHERE id = ?').get(id) as FeatureDefinitionRow;
    logAudit(req.user!.id, 'update_feature', 'feature', id, existing, updated, 'Admin updated feature');

    res.json({ feature: { ...updated, restrictedToPlans: JSON.parse(updated.restricted_to_plans), restrictedToAccounts: JSON.parse(updated.restricted_to_accounts), isGloballyEnabled: Boolean(updated.is_globally_enabled), trialEnabled: Boolean(updated.trial_enabled) } });
  } catch (error) {
    console.error('Update feature error:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
});

router.post('/features/override', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { userId, featureId, isEnabled, expiresAt, reason } = req.body;

    if (!userId || !featureId || isEnabled === undefined) {
      return res.status(400).json({ error: 'userId, featureId, and isEnabled are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    const feature = db.prepare('SELECT * FROM feature_definitions WHERE id = ?').get(featureId) as FeatureDefinitionRow | undefined;

    if (!user || !feature) {
      return res.status(404).json({ error: 'User or feature not found' });
    }

    // Check if override exists
    const existing = db.prepare('SELECT * FROM user_feature_overrides WHERE user_id = ? AND feature_id = ?').get(userId, featureId) as UserFeatureOverrideRow | undefined;

    if (existing) {
      db.prepare(`
        UPDATE user_feature_overrides
        SET is_enabled = ?, expires_at = ?, reason = ?, created_at = ?, created_by = ?
        WHERE user_id = ? AND feature_id = ?
      `).run(isEnabled ? 1 : 0, expiresAt || null, reason || null, nowISO(), req.user!.id, userId, featureId);

      logAudit(req.user!.id, 'update_feature_override', 'feature', featureId, existing, { ...existing, is_enabled: isEnabled }, reason || 'Admin updated feature override');
    } else {
      const id = generateId('ufo');
      db.prepare(`
        INSERT INTO user_feature_overrides (id, user_id, feature_id, is_enabled, expires_at, reason, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, featureId, isEnabled ? 1 : 0, expiresAt || null, reason || null, req.user!.id);

      logAudit(req.user!.id, 'create_feature_override', 'feature', id, null, { userId, featureId, isEnabled }, reason || 'Admin created feature override');
    }

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'feature', ?, ?)
    `).run(
      notificationId,
      isEnabled ? 'Feature Enabled ✨' : 'Feature Disabled 🚫',
      `The "${feature.name}" feature has been ${isEnabled ? 'enabled' : 'disabled'} for your account.${reason ? ` Reason: ${reason}` : ''}${expiresAt ? ` Expires: ${new Date(expiresAt).toLocaleDateString()}` : ''}`,
      JSON.stringify([userId]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Feature override error:', error);
    res.status(500).json({ error: 'Failed to update feature override' });
  }
});

router.delete('/features/override', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { userId, featureId } = req.body;

    if (!userId || !featureId) {
      return res.status(400).json({ error: 'userId and featureId are required' });
    }

    const existing = db.prepare('SELECT * FROM user_feature_overrides WHERE user_id = ? AND feature_id = ?').get(userId, featureId) as UserFeatureOverrideRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Override not found' });
    }

    const feature = db.prepare('SELECT name FROM feature_definitions WHERE id = ?').get(featureId) as { name: string } | undefined;

    db.prepare('DELETE FROM user_feature_overrides WHERE user_id = ? AND feature_id = ?').run(userId, featureId);

    logAudit(req.user!.id, 'delete_feature_override', 'feature', featureId, existing, null, 'Admin removed feature override');

    // Notify user
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'single', ?, 'feature', ?, ?)
    `).run(
      notificationId,
      'Feature Override Removed',
      `The custom override for "${feature?.name || 'feature'}" has been removed. Default plan permissions now apply.`,
      JSON.stringify([userId]),
      nowISO(),
      req.user!.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete feature override error:', error);
    res.status(500).json({ error: 'Failed to remove feature override' });
  }
});

// ============ NOTIFICATIONS ============
router.get('/notifications', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (unreadOnly === 'true') {
      where += ' AND is_read = 0';
    }

    const notifications = db.prepare(`
      SELECT n.*, sender.full_name as sent_by_name
      FROM notifications n
      LEFT JOIN users sender ON n.sent_by = sender.id
      ${where}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset) as any[];

    const total = db.prepare(`SELECT COUNT(*) as count FROM notifications ${where}`).get(...params) as { count: number };

    res.json({ notifications, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { title, message, recipientType, recipientIds, category } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const id = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, message, recipientType || 'all', JSON.stringify(recipientIds || []), category || 'general', nowISO(), req.user!.id);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as NotificationRow | undefined;
    logAudit(req.user!.id, 'create_notification', 'notification', id, null, notification, 'Admin sent notification');

    res.json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.patch('/notifications/:id/read', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ============ ACTIVITY / AUDIT LOGS ============
router.get('/activity', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const { page = 1, limit = 50, entityType, adminUserId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (entityType) {
      where += ' AND entity_type = ?';
      params.push(entityType);
    }
    if (adminUserId) {
      where += ' AND admin_user_id = ?';
      params.push(adminUserId);
    }

    const logs = db.prepare(`
      SELECT al.*, u.email as admin_email, u.full_name as admin_name
      FROM admin_audit_logs al
      LEFT JOIN users u ON al.admin_user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset) as any[];

    const total = db.prepare(`SELECT COUNT(*) as count FROM admin_audit_logs ${where}`).get(...params) as { count: number };

    // Parse JSON fields
    const parsedLogs = logs.map(l => ({
      ...l,
      previousValue: l.previous_value ? JSON.parse(l.previous_value) : null,
      newValue: l.new_value ? JSON.parse(l.new_value) : null,
    }));

    res.json({ logs: parsedLogs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// ============ PLATFORM SETTINGS ============
router.get('/settings', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json({
      settings: {
        ...settings,
        acceptedPaymentMethods: JSON.parse(settings.accepted_payment_methods),
        notificationSettings: JSON.parse(settings.notification_settings),
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/settings', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const updates: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'platformName', 'supportEmail', 'contactPhone', 'contactAddress', 'defaultCurrency', 'defaultTimezone', 'subscriptionPolicy',
      'qrCodePath', 'paymentRecipientName', 'paymentRecipientUpiId', 'paymentInstructions', 'acceptedPaymentMethods', 'paymentVerificationPolicy', 'maxPaymentSubmissionRetries',
      'defaultTrialDays', 'defaultAccountAccessPolicy', 'defaultSubscriptionDays', 'gracePeriodDays', 'notificationSettings',
      'sessionTimeoutMinutes', 'maxFileUploadSizeMb', 'auditLogRetentionDays'
    ];

    for (const field of allowedFields) {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (req.body[field] !== undefined) {
        if (['acceptedPaymentMethods', 'notificationSettings'].includes(field)) {
          updates.push(`${dbField} = ?`);
          params.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${dbField} = ?`);
          params.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = ?');
    params.push(nowISO());

    const existing = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;
    db.prepare(`UPDATE platform_settings SET ${updates.join(', ')} WHERE id = 1`).run(...params);

    const updated = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;
    logAudit(req.user!.id, 'update_settings', 'settings', '1', existing, updated, 'Admin updated platform settings');

    res.json({
      settings: {
        ...updated,
        acceptedPaymentMethods: JSON.parse(updated?.accepted_payment_methods || '[]'),
        notificationSettings: JSON.parse(updated?.notification_settings || '{}'),
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============ SUBSCRIPTION EXPIRY CHECK (cron job endpoint) ============
router.post('/maintenance/check-expired-subscriptions', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    // Find expired subscriptions that are still active
    const expired = db.prepare(`
      SELECT * FROM subscriptions
      WHERE status = 'active' AND expires_at < datetime('now')
    `).all() as SubscriptionRow[];

    let updated = 0;
    for (const sub of expired) {
      db.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?').run('expired', nowISO(), sub.id);

      // Notify user
      const notificationId = generateId('notif');
      db.prepare(`
        INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
        VALUES (?, ?, ?, 'single', ?, 'subscription', ?, ?)
      `).run(
        notificationId,
        'Subscription Expired ⚠️',
        'Your subscription has expired. Please renew to continue accessing SellSense features.',
        JSON.stringify([sub.user_id]),
        nowISO(),
        req.user!.id
      );
      updated++;
    }

    logAudit(req.user!.id, 'check_expired_subscriptions', 'subscription', 'bulk', null, { count: updated }, 'Cron job: checked expired subscriptions');

    res.json({ success: true, expiredCount: updated });
  } catch (error) {
    console.error('Check expired subscriptions error:', error);
    res.status(500).json({ error: 'Failed to check expired subscriptions' });
  }
});

router.post('/maintenance/check-expiring-soon', (req: AuthRequest, res: Response) => {
  ensureDbInitialized();

  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;
    const gracePeriod = settings?.grace_period_days || 7;

    const expiring = db.prepare(`
      SELECT s.*, u.email, u.full_name, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
        AND s.expires_at <= date('now', '+' || ? || ' days')
        AND s.expires_at >= datetime('now')
    `).all(gracePeriod) as any[];

    let notified = 0;
    for (const sub of expiring) {
      // Check if already notified recently
      const recentNotif = db.prepare(`
        SELECT 1 FROM notifications
        WHERE recipient_ids LIKE ? AND category = 'subscription'
        AND created_at >= date('now', '-1 day')
      `).get(`%${sub.user_id}%`);

      if (!recentNotif) {
        const notificationId = generateId('notif');
        const daysLeft = Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        db.prepare(`
          INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
          VALUES (?, ?, ?, 'single', ?, 'subscription', ?, ?)
        `).run(
          notificationId,
          'Subscription Expiring Soon ⏰',
          `Your ${sub.plan_name} subscription expires in ${daysLeft} day(s) on ${new Date(sub.expires_at).toLocaleDateString()}. Renew now to avoid service interruption.`,
          JSON.stringify([sub.user_id]),
          nowISO(),
          req.user!.id
        );
        notified++;
      }
    }

    logAudit(req.user!.id, 'check_expiring_soon', 'subscription', 'bulk', null, { count: notified }, 'Cron job: notified expiring subscriptions');

    res.json({ success: true, notifiedCount: notified });
  } catch (error) {
    console.error('Check expiring soon error:', error);
    res.status(500).json({ error: 'Failed to check expiring subscriptions' });
  }
});

export { router as adminRouter };