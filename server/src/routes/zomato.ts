import { Router, Request, Response } from 'express';
import { zomatoService } from '../services/zomatoService.js';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import db, { generateId, nowISO } from '../models/database.js';
import { RestaurantRow } from '../models/database.types.js';

export const zomatoRouter = Router();

// All zomato routes require authentication
zomatoRouter.use(authenticateToken);

// Generate OAuth URL
zomatoRouter.post('/oauth-url', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { authUrl, state } = zomatoService.generateAuthUrl(userId);
    res.json({ authUrl, state });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate OAuth URL' });
  }
});

// Handle OAuth callback
zomatoRouter.post('/callback', async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const tokens = await zomatoService.exchangeCodeForTokens(code, state);
    const userId = req.user!.id;

    // Store tokens in database (associated with user's restaurant)
    // For now, we'll store in a temp table or update the restaurant record
    // In production, you'd have a zomato_connections table

    res.json({
      success: true,
      expiresAt: tokens.expiresAt,
      redirectUrl: '/zomato-connect?connected=true'
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'OAuth callback failed' });
  }
});

// Search restaurants
zomatoRouter.get('/restaurants', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's restaurant with Zomato connection
    const restaurant = db.prepare(`
      SELECT * FROM restaurants WHERE owner_id = ? AND zomato_access_token IS NOT NULL AND is_active = 1
    `).get(userId) as RestaurantRow | undefined;

    if (!restaurant || !restaurant.zomato_access_token) {
      return res.status(401).json({ error: 'Not connected to Zomato. Please connect your restaurant first.' });
    }

    // Check if token expired
    if (restaurant.zomato_token_expires_at && new Date(restaurant.zomato_token_expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }

    const { q, lat, lon } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const restaurants = await zomatoService.searchRestaurants(
      q as string,
      lat ? parseFloat(lat as string) : undefined,
      lon ? parseFloat(lon as string) : undefined,
      restaurant.zomato_access_token
    );

    res.json({ restaurants });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to search restaurants' });
  }
});

// Get restaurant details
zomatoRouter.get('/restaurants/:resId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const restaurant = db.prepare(`
      SELECT * FROM restaurants WHERE owner_id = ? AND zomato_access_token IS NOT NULL AND is_active = 1
    `).get(userId) as RestaurantRow | undefined;

    if (!restaurant || !restaurant.zomato_access_token) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    if (restaurant.zomato_token_expires_at && new Date(restaurant.zomato_token_expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }

    const restaurantDetails = await zomatoService.getRestaurantDetails(req.params.resId, restaurant.zomato_access_token);
    res.json({ restaurant: restaurantDetails });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch restaurant details' });
  }
});

// Get restaurant reviews
zomatoRouter.get('/restaurants/:resId/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const restaurant = db.prepare(`
      SELECT * FROM restaurants WHERE owner_id = ? AND zomato_access_token IS NOT NULL AND is_active = 1
    `).get(userId) as RestaurantRow | undefined;

    if (!restaurant || !restaurant.zomato_access_token) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    if (restaurant.zomato_token_expires_at && new Date(restaurant.zomato_token_expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }

    const count = parseInt(req.query.count as string) || 100;
    const reviews = await zomatoService.getRestaurantReviews(req.params.resId, count, restaurant.zomato_access_token);
    res.json({ reviews });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch reviews' });
  }
});

// Save Zomato connection (after selecting restaurant)
zomatoRouter.post('/connect-restaurant', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { resId, resName, accessToken, expiresAt } = req.body;

    if (!resId || !resName || !accessToken) {
      return res.status(400).json({ error: 'Restaurant ID, name, and access token required' });
    }

    // Check if user has a restaurant record
    let restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ? AND is_active = 1').get(userId) as RestaurantRow | undefined;

    if (restaurant) {
      // Update existing restaurant
      db.prepare(`
        UPDATE restaurants
        SET zomato_res_id = ?, zomato_access_token = ?, zomato_token_expires_at = ?, name = ?, updated_at = ?
        WHERE id = ?
      `).run(resId, accessToken, expiresAt, resName, nowISO(), restaurant.id);
    } else {
      // Create new restaurant record
      const newId = generateId('rest');
      db.prepare(`
        INSERT INTO restaurants (id, name, owner_name, business_type, city, location, contact_email, zomato_res_id, zomato_access_token, zomato_token_expires_at, owner_id, is_active, data_mode)
        VALUES (?, ?, ?, 'Restaurant', 'Unknown', 'Unknown', ?, ?, ?, ?, ?, 1, 'LIVE')
      `).run(newId, resName, req.user!.fullName, req.user!.email, resId, accessToken, expiresAt, userId);
      restaurant = { id: newId } as RestaurantRow;
    }

    // Create platform connection record
    const connId = generateId('conn');
    db.prepare(`
      INSERT INTO platform_connections (id, restaurant_id, platform, status, is_active)
      VALUES (?, ?, 'Zomato', 'Connected', 1)
    `).run(connId, restaurant.id);

    logAudit(userId, 'connect_zomato', 'restaurant', restaurant.id, null, { resId, resName }, 'Connected restaurant to Zomato');

    res.json({ success: true, restaurantId: restaurant.id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save Zomato connection' });
  }
});

// Sync reviews
zomatoRouter.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const restaurant = db.prepare(`
      SELECT * FROM restaurants WHERE owner_id = ? AND zomato_access_token IS NOT NULL AND is_active = 1
    `).get(userId) as RestaurantRow | undefined;

    if (!restaurant || !restaurant.zomato_access_token || !restaurant.zomato_res_id) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    if (restaurant.zomato_token_expires_at && new Date(restaurant.zomato_token_expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }

    const reviews = await zomatoService.getRestaurantReviews(restaurant.zomato_res_id, 100, restaurant.zomato_access_token);

    // In production, save reviews to database and trigger analysis
    console.log(`Synced ${reviews.length} reviews for restaurant ${restaurant.zomato_res_id}`);

    // Update last synced timestamp
    db.prepare(`
      UPDATE platform_connections SET last_synced = ? WHERE restaurant_id = ? AND platform = 'Zomato'
    `).run(nowISO(), restaurant.id);

    logAudit(userId, 'sync_reviews', 'restaurant', restaurant.id, null, { count: reviews.length }, 'Synced Zomato reviews');

    res.json({ success: true, count: reviews.length });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

// Check connection status
zomatoRouter.get('/status', (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const restaurant = db.prepare(`
    SELECT * FROM restaurants WHERE owner_id = ? AND zomato_access_token IS NOT NULL AND is_active = 1
  `).get(userId) as RestaurantRow | undefined;

  if (!restaurant || !restaurant.zomato_access_token) {
    return res.json({ connected: false });
  }

  const isExpired = restaurant.zomato_token_expires_at && new Date(restaurant.zomato_token_expires_at).getTime() < Date.now();
  res.json({
    connected: !isExpired,
    expiresAt: restaurant.zomato_token_expires_at,
    restaurantName: restaurant.name,
    restaurantId: restaurant.zomato_res_id,
  });
});

// Disconnect
zomatoRouter.delete('/disconnect', (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ? AND is_active = 1').get(userId) as RestaurantRow | undefined;

  if (restaurant) {
    db.prepare(`
      UPDATE restaurants
      SET zomato_res_id = NULL, zomato_access_token = NULL, zomato_token_expires_at = NULL
      WHERE id = ?
    `).run(restaurant.id);

    db.prepare('UPDATE platform_connections SET is_active = 0, status = ? WHERE restaurant_id = ? AND platform = ?').run('Disconnected', restaurant.id, 'Zomato');

    logAudit(userId, 'disconnect_zomato', 'restaurant', restaurant.id, null, null, 'Disconnected Zomato');
  }

  res.json({ success: true });
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