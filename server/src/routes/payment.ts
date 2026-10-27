import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import db, { generateId, nowISO } from '../models/database.js';
import { SubscriptionPlanRow, RestaurantRow, PaymentRequestRow, SubscriptionRow, PlatformSettingsRow, AddonRow } from '../models/database.types.js';

export const paymentRouter = Router();

// Public routes: Available plans and QR scanner / payment settings
paymentRouter.get('/plans', (req: Request, res: Response) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM subscription_plans WHERE status = 'active' AND price_inr = 531 ORDER BY display_order ASC
    `).all() as SubscriptionPlanRow[];

    const parsedPlans = plans.map(p => ({
      ...p,
      features: JSON.parse(p.features),
      usageLimits: JSON.parse(p.usage_limits),
      availableAddonIds: JSON.parse(p.available_addon_ids),
    }));

    res.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Get payment plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get platform settings (for QR code, payment instructions) - Public
paymentRouter.get('/settings/public', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;

    res.json({
      settings: {
        qrCodePath: settings?.qr_code_path || '/qr-code.jpeg',
        paymentRecipientName: settings?.payment_recipient_name || 'Ayush Sujit Mandalkar',
        paymentRecipientUpiId: settings?.payment_recipient_upi_id || '7385561145@fam',
        paymentInstructions: settings?.payment_instructions || 'Scan QR code and pay the exact amount. Include transaction reference in notes.',
        acceptedPaymentMethods: settings ? JSON.parse(settings.accepted_payment_methods) : ["UPI", "Bank Transfer"],
        paymentVerificationPolicy: settings?.payment_verification_policy || 'Manual verification within 24 hours',
        maxPaymentSubmissionRetries: settings?.max_payment_submission_retries || 3,
      }
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// User restaurants endpoint - accessible with or without token (falls back gracefully)
paymentRouter.get('/my-restaurants', (req: Request, res: Response) => {
  try {
    // If auth header provided, verify user
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let restaurants: RestaurantRow[] = [];

    if (token) {
      try {
        const decoded = (req as any).user;
        if (decoded?.id) {
          restaurants = db.prepare(`
            SELECT * FROM restaurants WHERE owner_id = ? AND is_active = 1
          `).all(decoded.id) as RestaurantRow[];
        }
      } catch (e) {
        // Fallback to active restaurants
      }
    }

    if (!restaurants || restaurants.length === 0) {
      restaurants = db.prepare(`
        SELECT * FROM restaurants WHERE is_active = 1 LIMIT 5
      `).all() as RestaurantRow[];
    }

    res.json({ restaurants });
  } catch (error) {
    console.error('Get my restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Protected payment routes (require valid authentication)
paymentRouter.use(authenticateToken);

// Submit payment request
paymentRouter.post('/submit', (req: AuthRequest, res: Response) => {
  try {
    const { planId, restaurantId, amountInr, transactionReference, paymentDate, screenshotPath, notes } = req.body;
    const userId = req.user!.id;

    // Validate required fields
    if (!planId || !restaurantId || !amountInr || !transactionReference || !paymentDate) {
      return res.status(400).json({ error: 'All fields are required: planId, restaurantId, amountInr, transactionReference, paymentDate' });
    }

    // Verify plan exists
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND status = ?').get(planId, 'active') as SubscriptionPlanRow | undefined;
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify restaurant belongs to user
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ? AND owner_id = ? AND is_active = 1').get(restaurantId, userId) as RestaurantRow | undefined;
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check for existing pending payment for same plan/restaurant
    const existingPending = db.prepare(`
      SELECT * FROM payment_requests
      WHERE user_id = ? AND restaurant_id = ? AND plan_id = ? AND status IN (?, ?)
    `).get(userId, restaurantId, planId, 'pending_submission', 'pending_verification') as PaymentRequestRow | undefined;

    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending payment for this plan. Please wait for verification or contact support.' });
    }

    // Check for active subscription for same plan/restaurant
    const activeSub = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND restaurant_id = ? AND plan_id = ? AND status = ?
    `).get(userId, restaurantId, planId, 'active') as SubscriptionRow | undefined;

    if (activeSub) {
      return res.status(400).json({ error: 'You already have an active subscription for this plan' });
    }

    // Verify amount matches plan price
    if (amountInr !== plan.price_inr) {
      return res.status(400).json({ error: `Amount must be ₹${plan.price_inr} for ${plan.name} plan` });
    }

    // Create payment request
    const paymentId = generateId('pay');
    db.prepare(`
      INSERT INTO payment_requests (id, user_id, restaurant_id, plan_id, amount_inr, transaction_reference, payment_date, screenshot_path, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification')
    `).run(paymentId, userId, restaurantId, planId, amountInr, transactionReference, paymentDate, screenshotPath || null, notes || null);

    // Log audit
    logAudit(userId, 'submit_payment', 'payment', paymentId, null, { planId, restaurantId, amountInr, transactionReference }, 'User submitted payment request');

    // Create notification for admins
    const notificationId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'selected', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'New Payment Submitted 💰',
      `${req.user!.fullName} (${req.user!.email}) submitted payment of ₹${amountInr} for ${plan.name} plan for "${restaurant.name}". Transaction: ${transactionReference}`,
      JSON.stringify(['user_admin_001']), // Admin user IDs
      nowISO(),
      userId
    );

    res.json({
      success: true,
      paymentId,
      message: 'Payment submitted successfully. Our team will verify within 24 hours.'
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Get user's payment history
paymentRouter.get('/history', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const payments = db.prepare(`
      SELECT pr.*, p.name as plan_name, r.name as restaurant_name
      FROM payment_requests pr
      JOIN subscription_plans p ON pr.plan_id = p.id
      JOIN restaurants r ON pr.restaurant_id = r.id
      WHERE pr.user_id = ?
      ORDER BY pr.submitted_at DESC
    `).all(userId) as any[];

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get payment details
paymentRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const payment = db.prepare(`
      SELECT pr.*, p.name as plan_name, p.description as plan_description, p.duration_days as plan_duration,
        r.name as restaurant_name, r.city as restaurant_city
      FROM payment_requests pr
      JOIN subscription_plans p ON pr.plan_id = p.id
      JOIN restaurants r ON pr.restaurant_id = r.id
      WHERE pr.id = ? AND pr.user_id = ?
    `).get(req.params.id, userId) as any;

    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});


// Get user's current subscription status
paymentRouter.get('/subscription/status', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const subscription = db.prepare(`
      SELECT s.*, p.name as plan_name, p.price_inr as plan_price, p.features as plan_features,
        r.name as restaurant_name
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      JOIN restaurants r ON s.restaurant_id = r.id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.expires_at DESC
      LIMIT 1
    `).get(userId) as any;

    if (!subscription) {
      return res.json({
        hasActiveSubscription: false,
        subscription: null,
        message: 'No active subscription found'
      });
    }

    const isExpiringSoon = new Date(subscription.expires_at).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    res.json({
      hasActiveSubscription: true,
      subscription: {
        ...subscription,
        features: JSON.parse(subscription.plan_features),
        isExpiringSoon,
        daysUntilExpiry,
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Retry/resubmit a payment (for rejected or needs_correction status)
paymentRouter.post('/:id/retry', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const paymentId = req.params.id;

    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ? AND user_id = ?').get(paymentId, userId) as PaymentRequestRow | undefined;

    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    if (!['rejected', 'needs_correction'].includes(payment.status)) {
      return res.status(400).json({ error: 'Only rejected or needs_correction payments can be retried' });
    }

    // Check retry limit
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as PlatformSettingsRow | undefined;
    const maxRetries = settings?.max_payment_submission_retries || 3;

    // Count previous submissions for this plan/restaurant
    const submissionCount = db.prepare(`
      SELECT COUNT(*) as count FROM payment_requests
      WHERE user_id = ? AND restaurant_id = ? AND plan_id = ? AND id != ?
    `).get(userId, payment.restaurant_id, payment.plan_id, paymentId) as { count: number };

    if (submissionCount.count >= maxRetries) {
      return res.status(400).json({ error: `Maximum retry limit (${maxRetries}) reached. Please contact support.` });
    }

    // Update payment to pending_verification
    db.prepare(`
      UPDATE payment_requests
      SET status = 'pending_verification', updated_at = ?
      WHERE id = ?
    `).run(nowISO(), paymentId);

    // Log audit
    logAudit(userId, 'retry_payment', 'payment', paymentId, { status: payment.status }, { status: 'pending_verification' }, 'User retried payment submission');

    // Notify admins
    const notificationId = generateId('notif');
    const plan = db.prepare('SELECT name FROM subscription_plans WHERE id = ?').get(payment.plan_id) as { name: string } | undefined;
    const restaurant = db.prepare('SELECT name FROM restaurants WHERE id = ?').get(payment.restaurant_id) as { name: string } | undefined;

    db.prepare(`
      INSERT INTO notifications (id, title, message, recipient_type, recipient_ids, category, sent_at, sent_by)
      VALUES (?, ?, ?, 'selected', ?, 'payment', ?, ?)
    `).run(
      notificationId,
      'Payment Resubmitted 🔄',
      `${req.user!.fullName} (${req.user!.email}) resubmitted payment of ₹${payment.amount_inr} for ${plan?.name || 'plan'} for "${restaurant?.name || 'restaurant'}". Transaction: ${payment.transaction_reference}`,
      JSON.stringify(['user_admin_001']),
      nowISO(),
      userId
    );

    res.json({ success: true, message: 'Payment resubmitted for verification' });
  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({ error: 'Failed to retry payment' });
  }
});

// Get user's active addons
paymentRouter.get('/addons/active', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const addons = db.prepare(`
      SELECT aa.*, a.name, a.identifier, a.description, a.icon, a.price_inr, a.billing_type, a.feature_permissions
      FROM addon_assignments aa
      JOIN addons a ON aa.addon_id = a.id
      WHERE aa.user_id = ? AND (aa.expires_at IS NULL OR aa.expires_at > datetime('now'))
      ORDER BY aa.created_at DESC
    `).all(userId) as any[];

    const parsedAddons = addons.map(a => ({
      ...a,
      featurePermissions: JSON.parse(a.feature_permissions),
    }));

    res.json({ addons: parsedAddons });
  } catch (error) {
    console.error('Get active addons error:', error);
    res.status(500).json({ error: 'Failed to fetch addons' });
  }
});

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