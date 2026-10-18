import { Router, Request, Response } from 'express';
import { zomatoService } from '../services/zomatoService.js';

export const zomatoRouter = Router();

// In-memory token store (replace with database in production)
const tokenStore = new Map<string, {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}>();

// Generate OAuth URL
zomatoRouter.post('/oauth-url', (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'anonymous';
    const { authUrl, state } = zomatoService.generateAuthUrl(userId);
    res.json({ authUrl, state });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate OAuth URL' });
  }
});

// Handle OAuth callback
zomatoRouter.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const tokens = await zomatoService.exchangeCodeForTokens(code, state);

    // Store tokens (in production, associate with user ID from session/JWT)
    const userId = 'user_123'; // Would come from auth middleware
    tokenStore.set(userId, { ...tokens, userId });

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
zomatoRouter.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123'; // Would come from auth middleware
    const tokens = tokenStore.get(userId);

    if (!tokens) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    const { q, lat, lon } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const restaurants = await zomatoService.searchRestaurants(
      q as string,
      lat ? parseFloat(lat as string) : undefined,
      lon ? parseFloat(lon as string) : undefined,
      tokens.accessToken
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
zomatoRouter.get('/restaurants/:resId', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const tokens = tokenStore.get(userId);

    if (!tokens) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    const restaurant = await zomatoService.getRestaurantDetails(req.params.resId, tokens.accessToken);
    res.json({ restaurant });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch restaurant details' });
  }
});

// Get restaurant reviews
zomatoRouter.get('/restaurants/:resId/reviews', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const tokens = tokenStore.get(userId);

    if (!tokens) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }

    const count = parseInt(req.query.count as string) || 100;
    const reviews = await zomatoService.getRestaurantReviews(req.params.resId, count, tokens.accessToken);
    res.json({ reviews });
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({ error: 'Zomato session expired - please reconnect' });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch reviews' });
  }
});

// Sync reviews
zomatoRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const tokens = tokenStore.get(userId);
    const { resId } = req.body;

    if (!tokens) {
      return res.status(401).json({ error: 'Not connected to Zomato' });
    }
    if (!resId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const reviews = await zomatoService.getRestaurantReviews(resId, 100, tokens.accessToken);

    // In production, save reviews to database and trigger analysis
    console.log(`Synced ${reviews.length} reviews for restaurant ${resId}`);

    res.json({ success: true, count: reviews.length });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

// Check connection status
zomatoRouter.get('/status', (req: Request, res: Response) => {
  const userId = 'user_123';
  const tokens = tokenStore.get(userId);

  if (!tokens) {
    return res.json({ connected: false });
  }

  const isExpired = tokens.expiresAt < Date.now();
  res.json({
    connected: !isExpired,
    expiresAt: tokens.expiresAt,
  });
});

// Disconnect
zomatoRouter.delete('/disconnect', (req: Request, res: Response) => {
  const userId = 'user_123';
  tokenStore.delete(userId);
  res.json({ success: true });
});