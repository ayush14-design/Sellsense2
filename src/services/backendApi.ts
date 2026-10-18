// Backend API Service for SellSense
// Handles server-side operations for production deployment

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class BackendApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ AUTH ============
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: { email: string; password: string; fullName: string }): Promise<{ user: any; token: string }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // ============ RESTAURANT ============
  async createRestaurant(data: any): Promise<any> {
    return this.request('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRestaurant(id: string): Promise<any> {
    return this.request(`/restaurants/${id}`);
  }

  async updateRestaurant(id: string, data: any): Promise<any> {
    return this.request(`/restaurants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRestaurant(id: string): Promise<void> {
    return this.request(`/restaurants/${id}`, { method: 'DELETE' });
  }

  async getUserRestaurants(): Promise<any[]> {
    return this.request('/restaurants');
  }

  // ============ ZOMATO INTEGRATION (Production) ============
  async getZomatoOAuthUrl(): Promise<{ authUrl: string; state: string }> {
    return this.request('/zomato/oauth-url', {
      method: 'POST',
      body: JSON.stringify({ userId: 'current_user' }),
    });
  }

  async handleZomatoCallback(code: string, state: string): Promise<{ success: boolean; redirectUrl: string }> {
    return this.request('/zomato/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async searchZomatoRestaurants(query: string, lat?: number, lon?: number): Promise<{ restaurants: any[] }> {
    const params = new URLSearchParams({ q: query });
    if (lat) params.set('lat', lat.toString());
    if (lon) params.set('lon', lon.toString());
    return this.request(`/zomato/restaurants?${params.toString()}`);
  }

  async getZomatoRestaurantDetails(resId: string): Promise<{ restaurant: any }> {
    return this.request(`/zomato/restaurants/${resId}`);
  }

  async getZomatoRestaurantReviews(resId: string, count = 100): Promise<{ reviews: any[] }> {
    return this.request(`/zomato/restaurants/${resId}/reviews?count=${count}`);
  }

  async syncZomatoReviews(resId: string): Promise<{ success: boolean; count: number }> {
    return this.request('/zomato/sync', {
      method: 'POST',
      body: JSON.stringify({ resId }),
    });
  }

  async getZomatoStatus(): Promise<{ connected: boolean; expiresAt?: number }> {
    return this.request('/zomato/status');
  }

  async disconnectZomato(): Promise<void> {
    return this.request('/zomato/disconnect', { method: 'DELETE' });
  }

  // ============ ZOMATO INTEGRATION (Legacy - kept for compatibility) ============
  async connectZomato(authCode: string): Promise<{ restaurant: any; syncJobId: string }> {
    return this.request('/integrations/zomato/connect', {
      method: 'POST',
      body: JSON.stringify({ code: authCode }),
    });
  }

  async disconnectZomatoLegacy(restaurantId: string): Promise<void> {
    return this.request(`/integrations/zomato/${restaurantId}`, { method: 'DELETE' });
  }

  async getZomatoConnectionStatus(restaurantId: string): Promise<any> {
    return this.request(`/integrations/zomato/${restaurantId}/status`);
  }

  async syncZomatoReviewsLegacy(restaurantId: string): Promise<{ jobId: string; estimatedTime: number }> {
    return this.request(`/integrations/zomato/${restaurantId}/sync`, { method: 'POST' });
  }

  async getSyncJobStatus(jobId: string): Promise<{ status: string; progress: number; result?: any }> {
    return this.request(`/sync-jobs/${jobId}`);
  }

  // ============ PRODUCTS ============
  async getProducts(restaurantId: string): Promise<any[]> {
    return this.request(`/restaurants/${restaurantId}/products`);
  }

  async createProduct(restaurantId: string, data: any): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(restaurantId: string, productId: string, data: any): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(restaurantId: string, productId: string): Promise<void> {
    return this.request(`/restaurants/${restaurantId}/products/${productId}`, { method: 'DELETE' });
  }

  // ============ REVIEWS & ANALYSIS ============
  async getReviews(restaurantId: string, params?: { productId?: string; platform?: string; limit?: number }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', params.productId);
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.request(`/restaurants/${restaurantId}/reviews?${searchParams}`);
  }

  async getAnalysis(restaurantId: string, productId: string): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/products/${productId}/analysis`);
  }

  async triggerAnalysis(restaurantId: string, productId: string): Promise<{ jobId: string }> {
    return this.request(`/restaurants/${restaurantId}/products/${productId}/analyze`, { method: 'POST' });
  }

  // ============ INSIGHTS & REPORTS ============
  async getDashboardStats(restaurantId: string): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/dashboard/stats`);
  }

  async getSentimentTrends(restaurantId: string, days: number = 30): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/insights/sentiment-trends?days=${days}`);
  }

  async getTopThemes(restaurantId: string, limit: number = 10): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/insights/top-themes?limit=${limit}`);
  }

  async getPlatformComparison(restaurantId: string): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/insights/platform-comparison`);
  }

  async generateReport(restaurantId: string, type: 'weekly' | 'monthly' | 'quarterly'): Promise<{ reportId: string }> {
    return this.request(`/restaurants/${restaurantId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getReport(reportId: string): Promise<any> {
    return this.request(`/reports/${reportId}`);
  }

  // ============ SETTINGS ============
  async getSettings(restaurantId: string): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/settings`);
  }

  async updateSettings(restaurantId: string, settings: any): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // ============ SUBSCRIPTION ============
  async getSubscription(): Promise<any> {
    return this.request('/subscription');
  }

  async createCheckoutSession(planId: string): Promise<{ url: string }> {
    return this.request('/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async cancelSubscription(): Promise<void> {
    return this.request('/subscription', { method: 'DELETE' });
  }
}

export const backendApi = new BackendApiService();