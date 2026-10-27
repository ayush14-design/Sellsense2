// Zomato API Integration Service - Production Ready
// Supports both demo mode and real Zomato API integration via backend
// Get API credentials from: https://developers.zomato.com/api

import type { ZomatoRestaurant, ZomatoReview, ZomatoUserProfile } from './zomatoTypes';
import { backendApi } from './backendApi';

export interface ZomatoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiKey?: string;
}

export interface ZomatoTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Demo mode only constants (no real API endpoints in frontend)
const ZOMATO_OAUTH_BASE = 'https://www.zomato.com/oauth2';

class ZomatoApiService {
  private config: ZomatoConfig | null = null;
  private tokens: ZomatoTokens | null = null;
  private isDemoMode = true;

  // Initialize with configuration
  initialize(config: ZomatoConfig) {
    this.config = config;
    this.isDemoMode = !config.clientId || config.clientId === 'demo_client_id';

    // Load stored tokens
    this.loadStoredTokens();
  }

  // Check if using real API (production uses backend)
  isUsingRealApi(): boolean {
    return !this.isDemoMode && !!this.config?.clientId;
  }

  // Load tokens from localStorage
  private loadStoredTokens(): void {
    try {
      const stored = localStorage.getItem('zomato_tokens');
      if (stored) {
        this.tokens = JSON.parse(stored);
        // Check if token is expired
        if (this.tokens && this.tokens.expiresAt < Date.now()) {
          this.tokens = null;
          localStorage.removeItem('zomato_tokens');
        }
      }
    } catch {
      this.tokens = null;
    }
  }

  // Save tokens to localStorage
  private saveTokens(tokens: ZomatoTokens): void {
    this.tokens = tokens;
    localStorage.setItem('zomato_tokens', JSON.stringify(tokens));
  }

  // Generate OAuth authorization URL (demo mode only - production uses backend)
  getAuthorizationUrl(state?: string): string {
    if (!this.config) throw new Error('Zomato not configured');

    const oauthState = state || Math.random().toString(36).substring(7);
    localStorage.setItem('zomato_oauth_state', oauthState);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'restaurants.read reviews.read',
      state: oauthState,
    });

    return `${ZOMATO_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  // Handle OAuth callback (demo mode only - production uses backend)
  async handleCallback(code: string, state: string): Promise<ZomatoTokens> {
    // In demo mode, return mock tokens without making real API calls
    if (this.isDemoMode) {
      const tokens: ZomatoTokens = {
        accessToken: 'demo_access_token_' + Date.now(),
        refreshToken: 'demo_refresh_token_' + Date.now(),
        expiresAt: Date.now() + 3600 * 1000, // 1 hour
        scope: 'restaurants.read reviews.read',
      };
      this.saveTokens(tokens);
      localStorage.removeItem('zomato_oauth_state');
      return tokens;
    }
    // Production mode: use backend API
    const result = await backendApi.handleZomatoCallback(code, state);
    const tokens: ZomatoTokens = {
      accessToken: result.success ? 'backend_token' : '',
      refreshToken: '',
      expiresAt: (result as any)?.expiresAt || Date.now() + 3600 * 1000,
      scope: 'restaurants.read reviews.read',
    };
    this.saveTokens(tokens);
    localStorage.removeItem('zomato_oauth_state');
    return tokens;
  }

  // Disconnect from Zomato
  disconnect(): void {
    this.tokens = null;
    localStorage.removeItem('zomato_tokens');
    localStorage.removeItem('zomato_oauth_state');
  }

  // Check connection status
  isConnected(): boolean {
    return !!this.tokens?.accessToken;
  }

  // Get connection info
  getConnectionInfo(): { connected: boolean; demoMode: boolean; expiresAt?: number } {
    return {
      connected: this.isConnected(),
      demoMode: this.isDemoMode,
      expiresAt: this.tokens?.expiresAt,
    };
  }

  // ============ DEMO DATA ============
  private getDemoRestaurants(): ZomatoRestaurant[] {
    return [
      {
        id: 'res_nelam_001',
        name: 'Nelam Restaurants',
        url: 'https://www.zomato.com/pune/nelam-restaurants-koregaon-park',
        location: {
          address: 'Koregaon Park, Pune',
          locality: 'Koregaon Park',
          city: 'Pune',
          latitude: '18.5362',
          longitude: '73.8876',
          zipcode: '411001',
          country_id: 1,
          locality_verbose: 'Koregaon Park, Pune',
        },
        switch_to_order_menu: 1,
        cuisines: 'North Indian, Mughlai, Kebabs',
        average_cost_for_two: 1200,
        price_range: 3,
        currency: 'Rs.',
        offers: [],
        thumb: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        user_rating: {
          aggregate_rating: '4.3',
          rating_text: 'Very Good',
          rating_color: '9ACD32',
          votes: '1247',
        },
        photos_url: 'https://www.zomato.com/pune/nelam-restaurants-koregaon-park/photos',
        menu_url: 'https://www.zomato.com/pune/nelam-restaurants-koregaon-park/menu',
        featured_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        has_online_delivery: 1,
        is_delivering_now: 1,
        deeplink: 'zomato://restaurant/12345',
        has_table_booking: 1,
        events_url: 'https://www.zomato.com/pune/nelam-restaurants-koregaon-park/events',
      },
      {
        id: 'res_spice_002',
        name: 'Spice Route Cafe',
        url: 'https://www.zomato.com/pune/spice-route-cafe-koregaon-park',
        location: {
          address: 'Lane 5, Koregaon Park, Pune',
          locality: 'Koregaon Park',
          city: 'Pune',
          latitude: '18.5372',
          longitude: '73.8886',
          zipcode: '411001',
          country_id: 1,
          locality_verbose: 'Koregaon Park, Pune',
        },
        switch_to_order_menu: 1,
        cuisines: 'Continental, Italian, Cafe',
        average_cost_for_two: 800,
        price_range: 2,
        currency: 'Rs.',
        offers: [],
        thumb: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        user_rating: {
          aggregate_rating: '4.1',
          rating_text: 'Very Good',
          rating_color: '9ACD32',
          votes: '567',
        },
        photos_url: 'https://www.zomato.com/pune/spice-route-cafe-koregaon-park/photos',
        menu_url: 'https://www.zomato.com/pune/spice-route-cafe-koregaon-park/menu',
        featured_image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        has_online_delivery: 1,
        is_delivering_now: 0,
        deeplink: 'zomato://restaurant/12346',
        has_table_booking: 1,
        events_url: 'https://www.zomato.com/pune/spice-route-cafe-koregaon-park/events',
      },
    ];
  }

  private getDemoReviews(restaurantId: string): ZomatoReview[] {
    const allReviews: ZomatoReview[] = [
      {
        id: 'rev_1',
        rating: 5,
        review_text: 'Amazing biryani! Portion was generous and delivery was hot. Will definitely order again.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Rahul K.', profile_image: 'https://via.placeholder.com/40' },
        likes: 12,
        comments_count: 3,
      },
      {
        id: 'rev_2',
        rating: 4,
        review_text: 'Great taste but delivery took 50 mins. Paneer tikka was delicious though.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Amit R.', profile_image: 'https://via.placeholder.com/40' },
        likes: 8,
        comments_count: 1,
      },
      {
        id: 'rev_3',
        rating: 5,
        review_text: 'Best dal makhani in town! Creamy, flavorful, perfect with naan. Highly recommend.',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Neha P.', profile_image: 'https://via.placeholder.com/40' },
        likes: 15,
        comments_count: 2,
      },
      {
        id: 'rev_4',
        rating: 2,
        review_text: 'Food arrived cold and packaging was torn. Butter naan was hard. Disappointed.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Priya S.', profile_image: 'https://via.placeholder.com/40' },
        likes: 3,
        comments_count: 5,
      },
      {
        id: 'rev_5',
        rating: 4,
        review_text: 'Good food, reasonable prices. The ambience is nice for family dinners.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Vikram S.', profile_image: 'https://via.placeholder.com/40' },
        likes: 7,
        comments_count: 0,
      },
    ];

    return restaurantId === 'res_nelam_001' ? allReviews : allReviews.slice(0, 3);
  }

  // ============ PRODUCTION METHODS (delegate to backend) ============

  // Fetch user's restaurants - production uses search approach
  async fetchUserRestaurants(): Promise<ZomatoRestaurant[]> {
    if (this.isDemoMode) {
      return this.getDemoRestaurants();
    }

    // In production, we don't have a "my restaurants" endpoint
    // The ZomatoConnectPage will use searchRestaurants with owner's input
    throw new Error('Use searchRestaurants with query parameter for production mode');
  }

  // Search for restaurants by name/location
  async searchRestaurants(query: string, lat?: number, lon?: number): Promise<ZomatoRestaurant[]> {
    if (this.isDemoMode) {
      return this.getDemoRestaurants().filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.location.city.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Production: use backend API
    const result = await backendApi.searchZomatoRestaurants(query, lat, lon);
    return result.restaurants;
  }

  // Fetch restaurant details by ID
  async fetchRestaurantDetails(restaurantId: string): Promise<ZomatoRestaurant> {
    if (this.isDemoMode) {
      const demos = this.getDemoRestaurants();
      const found = demos.find(r => r.id === restaurantId);
      if (!found) throw new Error('Restaurant not found in demo data');
      return found;
    }

    // Production: use backend API
    const result = await backendApi.getZomatoRestaurantDetails(restaurantId);
    return result.restaurant;
  }

  // Fetch reviews for a restaurant
  async fetchRestaurantReviews(restaurantId: string, count = 100): Promise<ZomatoReview[]> {
    if (this.isDemoMode) {
      return this.getDemoReviews(restaurantId);
    }

    // Production: use backend API
    const result = await backendApi.getZomatoRestaurantReviews(restaurantId, count);
    return result.reviews;
  }

  // Fetch user profile (not available in production without additional scope)
  async fetchUserProfile(): Promise<ZomatoUserProfile> {
    if (this.isDemoMode) {
      return {
        user_id: 'demo_user',
        name: 'Demo Restaurant Owner',
        email: 'owner@demo.com',
        profile_url: '',
        profile_image: '',
        review_count: 0,
        follower_count: 0,
        following_count: 0,
      };
    }

    // Production: would need user profile scope - using backend
    throw new Error('User profile not available in production mode without additional scope');
  }

  // Sync reviews from Zomato (fetches and processes via backend)
  async syncReviews(restaurantId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      if (this.isDemoMode) {
        const reviews = await this.fetchRestaurantReviews(restaurantId);
        console.log(`Synced ${reviews.length} reviews from Zomato for restaurant ${restaurantId}`);
        return { success: true, count: reviews.length };
      }

      // Production: use backend sync
      const result = await backendApi.syncZomatoReviews(restaurantId);
      return { success: result.success, count: result.count };
    } catch (error) {
      return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get connection status from backend
  async getConnectionStatus(): Promise<{ connected: boolean; expiresAt?: number }> {
    if (this.isDemoMode) {
      return { connected: this.isConnected(), expiresAt: this.tokens?.expiresAt };
    }

    return backendApi.getZomatoStatus();
  }

  // Disconnect via backend
  async disconnectZomato(): Promise<void> {
    if (this.isDemoMode) {
      this.disconnect();
      return;
    }

    await backendApi.disconnectZomato();
    this.disconnect();
  }
}

// Export singleton
export const zomatoApi = new ZomatoApiService();

// Initialize from environment variables on import
if (typeof window !== 'undefined') {
  const clientId = import.meta.env.VITE_ZOMATO_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_ZOMATO_CLIENT_SECRET;
  const redirectUri = import.meta.env.VITE_ZOMATO_REDIRECT_URI;
  const apiKey = import.meta.env.VITE_ZOMATO_API_KEY || import.meta.env.ZOMATO_API_KEY;

  if (clientId && clientSecret && redirectUri) {
    zomatoApi.initialize({
      clientId,
      clientSecret,
      redirectUri,
      apiKey,
    });
  }
}

// Helper to convert Zomato restaurant to our Restaurant type
import type { Restaurant, BusinessType } from '../types';

export function convertZomatoToRestaurant(zomatoRes: ZomatoRestaurant, ownerId: string): Restaurant {
  return {
    id: `zomato_${zomatoRes.id}`,
    name: zomatoRes.name,
    ownerName: '', // Will be filled from user profile
    businessType: 'Restaurant' as BusinessType,
    city: zomatoRes.location.city,
    location: zomatoRes.location.address,
    contactEmail: '', // Will be filled from user profile
    description: `${zomatoRes.cuisines} • ₹${zomatoRes.average_cost_for_two} for two`,
    reviewSources: ['Zomato'],
    dataMode: 'LIVE',
    createdAt: new Date().toISOString(),
    ownerId,
    isActive: true,
  };
}