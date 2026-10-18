export type Sentiment = 'positive' | 'negative' | 'neutral';
export type Platform = 'Zomato' | 'Swiggy' | 'Google';
export type BusinessType = 'Restaurant' | 'Café' | 'Food Stall' | 'Street Food Vendor' | 'Other';
export type ConnectionStatus = 'Not Connected' | 'Connecting' | 'Connected' | 'Demo Connection';

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  businessType: BusinessType;
  city: string;
  location: string;
  contactEmail: string;
  description?: string;
  reviewSources: Platform[];
  dataMode: 'DEMO' | 'LIVE';
  createdAt: string;
}

export interface PlatformConnection {
  id: string;
  restaurantId: string;
  platform: Platform;
  status: ConnectionStatus;
  lastSynced?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  imageUrl: string;
  platforms: Platform[];
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  lastAnalyzed: string;
  dataMode: 'DEMO' | 'LIVE';
}

export interface Review {
  id: string;
  restaurantId: string;
  productId: string;
  platform: Platform;
  reviewText: string;
  sentiment: Sentiment;
  theme: string;
  createdAt: string;
  dataMode: 'DEMO' | 'LIVE';
  scope?: 'product' | 'restaurant';
}

export interface ReviewTheme {
  theme: string;
  count: number;
  percentage: number;
  sentiment: Sentiment;
  representativeQuote: string;
}

export interface AnalysisResult {
  productId: string;
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveThemes: ReviewTheme[];
  negativeThemes: ReviewTheme[];
  platformDistribution: PlatformStats[];
  trends?: TrendData[];
  recommendations: string[];
  fakeReviewsCount: number;
  fakeReviewsPercentage: number;
  duplicateReviewsCount: number;
  duplicateReviewsPercentage: number;
}

export interface PlatformStats {
  platform: Platform;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface TrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}
