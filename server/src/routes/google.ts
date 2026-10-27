import { Router, Request, Response } from 'express';
import { googleReviewsService } from '../services/googleService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const googleRouter = Router();

// Public / Authenticated status endpoint
googleRouter.get('/status', (req: Request, res: Response) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || 'rest_demo_001';
    const status = googleReviewsService.getConnectionStatus(restaurantId);
    res.json(status);
  } catch (error: any) {
    console.error('Google status error:', error);
    res.status(500).json({ error: 'Failed to check Google connection status' });
  }
});

// Generate OAuth 2.0 URL
googleRouter.get('/auth-url', (req: Request, res: Response) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || 'rest_demo_001';
    const authUrl = googleReviewsService.generateAuthUrl(restaurantId);
    res.json({
      authUrl,
      isConfigured: googleReviewsService.isConfigured(),
      missingKeys: googleReviewsService.getMissingConfigKeys(),
    });
  } catch (error: any) {
    console.error('Google auth-url error:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// Exchange OAuth code (POST API)
googleRouter.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const result = await googleReviewsService.handleOAuthCallback(code, state || '');
    res.json(result);
  } catch (error: any) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: error?.message || 'Failed to complete Google authorization' });
  }
});

// Browser redirect callback from Google OAuth (GET)
googleRouter.get('/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const code = (req.query.code as string) || '';
    const state = (req.query.state as string) || '';

    if (!code) {
      return res.redirect(`${frontendUrl}/google-reviews/prod_001?error=Authorization+code+missing`);
    }

    await googleReviewsService.handleOAuthCallback(code, state);
    return res.redirect(`${frontendUrl}/google-reviews/prod_001?connected=true`);
  } catch (error: any) {
    console.error('Google GET callback error:', error);
    return res.redirect(`${frontendUrl}/google-reviews/prod_001?error=${encodeURIComponent(error?.message || 'Failed+to+connect+Google')}`);
  }
});

// Discover eligible restaurant business profile locations
googleRouter.get('/locations', async (req: Request, res: Response) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || 'rest_demo_001';
    const locations = await googleReviewsService.getLocations(restaurantId);
    res.json({ locations });
  } catch (error: any) {
    console.error('Google locations error:', error);
    res.status(500).json({ error: 'Failed to retrieve Google Business Profile locations' });
  }
});

// Select business profile location
googleRouter.post('/select-location', async (req: Request, res: Response) => {
  try {
    const { restaurantId, locationId, locationName, locationAddress } = req.body;
    if (!restaurantId || !locationId) {
      return res.status(400).json({ error: 'restaurantId and locationId are required' });
    }

    const connection = await googleReviewsService.selectLocation(restaurantId, locationId, locationName || 'Restaurant Location', locationAddress || '');
    res.json({ success: true, connection });
  } catch (error: any) {
    console.error('Google select-location error:', error);
    res.status(500).json({ error: 'Failed to select Google location' });
  }
});

// Direct Instant Google Business Profile Connect
googleRouter.post('/connect-direct', async (req: Request, res: Response) => {
  try {
    const { restaurantId, locationName, locationAddress } = req.body;
    const targetRestId = restaurantId || 'rest_demo_001';
    const connection = await googleReviewsService.connectDirect(targetRestId, locationName, locationAddress);
    res.json({ success: true, connection });
  } catch (error: any) {
    console.error('Google direct connect error:', error);
    res.status(500).json({ error: error?.message || 'Failed to connect Google Business Profile' });
  }
});

// Trigger review synchronization
googleRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.body;
    const targetRestId = restaurantId || 'rest_demo_001';
    const syncedCount = await googleReviewsService.syncReviews(targetRestId);
    res.json({ success: true, syncedCount, syncedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Google sync error:', error);
    res.status(500).json({ error: 'Failed to synchronize Google reviews' });
  }
});

// Disconnect Google Account
googleRouter.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.body;
    const targetRestId = restaurantId || 'rest_demo_001';
    await googleReviewsService.disconnect(targetRestId);
    res.json({ success: true, message: 'Google connection disconnected successfully' });
  } catch (error: any) {
    console.error('Google disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Google connection' });
  }
});

// Get AI Review Analysis Dashboard data
googleRouter.get('/analysis', async (req: Request, res: Response) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || 'rest_demo_001';
    const analysis = await googleReviewsService.getAnalysis(restaurantId);
    res.json(analysis);
  } catch (error: any) {
    console.error('Google analysis error:', error);
    res.status(500).json({ error: 'Failed to generate Google reviews analysis' });
  }
});
