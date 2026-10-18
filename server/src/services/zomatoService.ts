import crypto from 'crypto';

const ZOMATO_API_BASE = 'https://api.zomato.com/v2.1';
const ZOMATO_OAUTH_BASE = 'https://www.zomato.com/oauth2';

interface ZomatoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiKey: string;
}

interface ZomatoTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

interface ZomatoRestaurant {
  id: string;
  name: string;
  url: string;
  location: {
    address: string;
    locality: string;
    city: string;
    latitude: string;
    longitude: string;
    zipcode: string;
    country_id: number;
    locality_verbose: string;
  };
  cuisines: string;
  average_cost_for_two: number;
  price_range: number;
  currency: string;
  thumb: string;
  user_rating: {
    aggregate_rating: string;
    rating_text: string;
    rating_color: string;
    votes: string;
  };
  featured_image: string;
  has_online_delivery: number;
  is_delivering_now: number;
}

interface ZomatoReview {
  id: string;
  rating: number;
  review_text: string;
  timestamp: string;
  user: {
    name: string;
    profile_image: string;
  };
  likes: number;
  comments_count: number;
}

interface ZomatoUserProfile {
  user_id: string;
  name: string;
  email: string;
}

interface ZomatoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  error_description?: string;
}

interface ZomatoSearchResponse {
  restaurants?: Array<{ restaurant: ZomatoRestaurant }>;
}

interface ZomatoRestaurantResponse {
  restaurant?: ZomatoRestaurant;
}

interface ZomatoReviewsResponse {
  user_reviews?: Array<{ review: ZomatoReview }>;
}

interface ZomatoProfileResponse {
  user_profile?: ZomatoUserProfile;
}

interface ZomatoErrorResponse {
  error?: {
    message?: string;
  };
  error_description?: string;
}

export class ZomatoService {
  private config: ZomatoConfig;
  private pkceStore: Map<string, { codeVerifier: string; state: string }> = new Map();

  constructor() {
    this.config = {
      clientId: process.env.ZOMATO_CLIENT_ID || '',
      clientSecret: process.env.ZOMATO_CLIENT_SECRET || '',
      redirectUri: process.env.ZOMATO_REDIRECT_URI || '',
      apiKey: process.env.ZOMATO_API_KEY || '',
    };

    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri || !this.config.apiKey) {
      throw new Error('Missing Zomato configuration. Check environment variables.');
    }
  }

  // Generate PKCE code verifier and challenge
  private generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  // Generate OAuth authorization URL with PKCE
  generateAuthUrl(userId: string): { authUrl: string; state: string } {
    const state = crypto.randomBytes(16).toString('hex');
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    // Store PKCE verifier with state for later validation
    this.pkceStore.set(state, { codeVerifier, state });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'restaurants.read reviews.read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      authUrl: `${ZOMATO_OAUTH_BASE}/authorize?${params.toString()}`,
      state,
    };
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, state: string): Promise<ZomatoTokens> {
    const pkceData = this.pkceStore.get(state);
    if (!pkceData) {
      throw new Error('Invalid or expired state parameter');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: pkceData.codeVerifier,
    });

    const response = await fetch(`${ZOMATO_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as ZomatoErrorResponse;
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }

    const data = await response.json() as ZomatoTokenResponse;
    this.pkceStore.delete(state);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<ZomatoTokens> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(`${ZOMATO_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json() as ZomatoTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    };
  }

  // Make authenticated API request to Zomato
  private async apiRequest<T>(endpoint: string, params: Record<string, string>, accessToken: string): Promise<T> {
    const url = new URL(`${ZOMATO_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'user-key': this.config.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as ZomatoErrorResponse;
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Search restaurants by name/location
  async searchRestaurants(query: string, lat?: number, lon?: number, accessToken?: string): Promise<ZomatoRestaurant[]> {
    const params: Record<string, string> = { q: query };
    if (lat && lon) {
      params.lat = lat.toString();
      params.lon = lon.toString();
    }

    const token = accessToken || await this.getValidAccessToken();
    const data = await this.apiRequest<ZomatoSearchResponse>('/search', params, token);
    return data.restaurants?.map((r) => r.restaurant) || [];
  }

  // Get restaurant details by ID
  async getRestaurantDetails(resId: string, accessToken?: string): Promise<ZomatoRestaurant> {
    const token = accessToken || await this.getValidAccessToken();
    const data = await this.apiRequest<ZomatoRestaurantResponse>(`/restaurant`, { res_id: resId }, token);
    if (!data.restaurant) throw new Error('Restaurant not found');
    return data.restaurant;
  }

  // Get reviews for a restaurant
  async getRestaurantReviews(resId: string, count = 100, accessToken?: string): Promise<ZomatoReview[]> {
    const token = accessToken || await this.getValidAccessToken();
    const data = await this.apiRequest<ZomatoReviewsResponse>('/reviews', {
      res_id: resId,
      count: count.toString()
    }, token);
    return data.user_reviews?.map((r) => r.review) || [];
  }

  // Get user profile
  async getUserProfile(accessToken?: string): Promise<ZomatoUserProfile> {
    const token = accessToken || await this.getValidAccessToken();
    const data = await this.apiRequest<ZomatoProfileResponse>('/user/profile', {}, token);
    if (!data.user_profile) throw new Error('User profile not found');
    return data.user_profile;
  }

  // Get valid access token (placeholder - in production, fetch from DB)
  private async getValidAccessToken(): Promise<string> {
    // This would normally fetch from database
    // For now, throw error indicating tokens need to be stored
    throw new Error('No access token available. Please connect Zomato account first.');
  }
}

export const zomatoService = new ZomatoService();