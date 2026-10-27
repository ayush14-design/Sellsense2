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
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message?.includes('fetch'))) {
        throw new Error(`Cannot connect to SellSense backend server at ${API_BASE}. Please ensure the server is running on port 3001.`);
      }
      throw err;
    }
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

  async googleAuth(data: { credential?: string; email?: string; fullName?: string }): Promise<{
    user: any;
    token: string;
    hasRestaurant: boolean;
    restaurant: any | null;
  }> {
    return this.request('/auth/google', {
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

  async handleZomatoCallback(code: string, state: string): Promise<{ success: boolean; redirectUrl: string; expiresAt?: number }> {
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

  // ============ PAYMENT & SUBSCRIPTION (Public) ============
  async getPaymentPlans(): Promise<{ plans: any[] }> {
    return this.request('/payment/plans');
  }

  async getMyRestaurants(): Promise<{ restaurants: any[] }> {
    return this.request('/payment/my-restaurants');
  }

  async getPaymentSettings(): Promise<{ settings: any }> {
    return this.request('/payment/settings/public');
  }

  async submitPayment(data: {
    planId: string;
    restaurantId: string;
    amountInr: number;
    transactionReference: string;
    paymentDate: string;
    screenshotPath?: string;
    notes?: string;
  }): Promise<{ success: boolean; paymentId: string; message: string }> {
    return this.request('/payment/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentHistory(): Promise<{ payments: any[] }> {
    return this.request('/payment/history');
  }

  async getPaymentDetails(id: string): Promise<{ payment: any }> {
    return this.request(`/payment/${id}`);
  }

  async getSubscriptionStatus(): Promise<{ hasActiveSubscription: boolean; subscription: any; message?: string }> {
    return this.request('/payment/subscription/status');
  }

  async getActiveAddons(): Promise<{ addons: any[] }> {
    return this.request('/payment/addons/active');
  }

  // ============ ADMIN ============
  async getAdminOverview(): Promise<any> {
    return this.request('/admin/overview');
  }

  async getAdminUsers(params: { page: number; limit: number; search: string; role: string; status: string }): Promise<any> {
    return this.request(`/admin/users?page=${params.page}&limit=${params.limit}&search=${params.search}&role=${params.role}&status=${params.status}`);
  }

  async getAdminPayments(params: { page: number; limit: number; status: string; search: string }): Promise<any> {
    return this.request(`/admin/payments?page=${params.page}&limit=${params.limit}&status=${params.status}&search=${params.search}`);
  }

  async getAdminSubscriptions(params: { page: number; limit: number; status: string; search: string }): Promise<any> {
    return this.request(`/admin/subscriptions?page=${params.page}&limit=${params.limit}&status=${params.status}&search=${params.search}`);
  }

  async getAdminPlans(): Promise<any> {
    return this.request('/admin/plans');
  }

  async getAdminAddons(): Promise<any> {
    return this.request('/admin/addons');
  }

  async getAdminFeatures(): Promise<any> {
    return this.request('/admin/features');
  }

  async getAdminRestaurants(params: { page: number; limit: number; search: string; status: string }): Promise<any> {
    return this.request(`/admin/restaurants?page=${params.page}&limit=${params.limit}&search=${params.search}&status=${params.status}`);
  }

  async getAdminActivity(params: { page: number; limit: number }): Promise<any> {
    return this.request(`/admin/activity?page=${params.page}&limit=${params.limit}`);
  }

  async getAdminNotifications(params: { page: number; limit: number }): Promise<any> {
    return this.request(`/admin/notifications?page=${params.page}&limit=${params.limit}`);
  }

  async getAdminSettings(): Promise<any> {
    return this.request('/admin/settings');
  }

  async adminAction(endpoint: string, data: any): Promise<any> {
    return this.request(`/admin/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin PATCH/DELETE methods
  async adminPatch(endpoint: string, data: any): Promise<any> {
    return this.request(`/admin/${endpoint}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async adminDelete(endpoint: string): Promise<any> {
    return this.request(`/admin/${endpoint}`, {
      method: 'DELETE',
    });
  }

  // ============ GOOGLE REVIEWS INTEGRATION ============
  async getGoogleStatus(restaurantId = 'rest_demo_001'): Promise<{
    isConfigured: boolean;
    missingKeys: string[];
    connection: any | null;
  }> {
    return this.request(`/google/status?restaurantId=${restaurantId}`);
  }

  async getGoogleAuthUrl(restaurantId = 'rest_demo_001'): Promise<{
    authUrl: string;
    isConfigured: boolean;
    missingKeys: string[];
    message?: string;
  }> {
    return this.request(`/google/auth-url?restaurantId=${restaurantId}`);
  }

  async handleGoogleCallback(code: string, state: string): Promise<any> {
    return this.request('/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async getGoogleLocations(restaurantId = 'rest_demo_001'): Promise<{ locations: any[] }> {
    return this.request(`/google/locations?restaurantId=${restaurantId}`);
  }

  async selectGoogleLocation(data: {
    restaurantId: string;
    locationId: string;
    locationName: string;
    locationAddress?: string;
  }): Promise<any> {
    return this.request('/google/select-location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncGoogleReviews(restaurantId = 'rest_demo_001'): Promise<any> {
    return this.request('/google/sync', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    });
  }

  async connectGoogleDirect(restaurantId = 'rest_demo_001', locationName?: string, locationAddress?: string): Promise<any> {
    return this.request('/google/connect-direct', {
      method: 'POST',
      body: JSON.stringify({ restaurantId, locationName, locationAddress }),
    });
  }

  async disconnectGoogle(restaurantId = 'rest_demo_001'): Promise<any> {
    return this.request('/google/disconnect', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    });
  }

  async getGoogleAnalysis(restaurantId = 'rest_demo_001'): Promise<any> {
    return this.request(`/google/analysis?restaurantId=${restaurantId}`);
  }

  // ============ MANUAL SPREADSHEET REVIEWS ============
  async importManualReviews(data: {
    restaurantId: string;
    filename: string;
    fileType: string;
    reviews: Array<{
      productName: string;
      customerReview: string;
      rating?: number | null;
      reviewDate?: string;
      platform?: string;
      isGeneral?: boolean;
    }>;
  }): Promise<{
    success: boolean;
    batchId: string;
    filename: string;
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    productsWithReviews: string[];
    errors: string[];
  }> {
    return this.request('/reviews/manual-import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getManualReviews(params: {
    restaurantId?: string;
    productName?: string;
    platform?: string;
    batchId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    reviews: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    stats: {
      totalImportedReviews: number;
      productsCount: number;
      productNames: string[];
      latestImportDate: string | null;
      platformDistribution: Array<{ platform: string; count: number }>;
    };
  }> {
    const query = new URLSearchParams();
    if (params.restaurantId) query.set('restaurantId', params.restaurantId);
    if (params.productName) query.set('productName', params.productName);
    if (params.platform) query.set('platform', params.platform);
    if (params.batchId) query.set('batchId', params.batchId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request(`/reviews/manual?${query.toString()}`);
  }

  async getManualBatches(restaurantId = 'rest_demo_001'): Promise<{ batches: any[] }> {
    return this.request(`/reviews/batches?restaurantId=${restaurantId}`);
  }

  async deleteManualBatch(batchId: string, restaurantId = 'rest_demo_001'): Promise<any> {
    return this.request(`/reviews/batch/${batchId}?restaurantId=${restaurantId}`, {
      method: 'DELETE',
    });
  }

  async getProductReviewAnalysis(productName: string, restaurantId = 'rest_demo_001'): Promise<{
    productName: string;
    totalReviews: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    averageRating: number | null;
    ratingDistribution?: Record<string, { count: number; percentage: number }>;
    positiveThemes: Array<{ theme: string; count: number; percentage: number; representativeQuote: string }>;
    negativeThemes: Array<{ theme: string; count: number; percentage: number; representativeQuote: string }>;
    pairedTypeAnalysis?: Array<{
      id: string;
      category: string;
      icon: string;
      positiveCount: number;
      negativeCount: number;
      sentimentScore: number;
      goodPoints: Array<{ point: string; count: number; quote: string }>;
      badPoints: Array<{ point: string; count: number; quote: string }>;
    }>;
    qualityAnalysis?: {
      authenticityScore: number;
      totalFlagged: number;
      duplicateCount: number;
      nonsenseCount: number;
      contradictionCount: number;
      spamCount: number;
      flaggedReviews: Array<{
        id: string;
        customerReview: string;
        rating: number | null;
        reviewDate: string;
        platform: string;
        issueType: 'duplicate' | 'gibberish' | 'mismatch' | 'spam';
        reason: string;
        severity: 'high' | 'medium' | 'low';
        explanation: string;
      }>;
    };
    customerPreferences: string[];
    improvementOpportunities: string[];
    aiSummary: string;
    sampleReviews: any[];
  }> {
    const query = new URLSearchParams({
      productName,
      restaurantId,
    });
    return this.request(`/reviews/product-analysis?${query.toString()}`);
  }

  async getProductsSummary(restaurantId = 'rest_demo_001'): Promise<{
    products: Array<{
      id: string;
      name: string;
      category: string;
      totalReviews: number;
      positiveCount: number;
      negativeCount: number;
      neutralCount: number;
      positivePercentage: number;
      negativePercentage: number;
      neutralPercentage: number;
      averageRating: number | null;
      lastAnalyzed: string;
      latestReviewDate: string | null;
      platforms: string[];
      imageUrl: string;
      dataMode: string;
    }>;
    total: number;
  }> {
    return this.request(`/reviews/products-summary?restaurantId=${encodeURIComponent(restaurantId)}`);
  }
}

export const backendApi = new BackendApiService();