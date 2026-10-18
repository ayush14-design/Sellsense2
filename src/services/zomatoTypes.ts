// Zomato API Type Definitions
// Based on Zomato API v2.1 documentation

export interface ZomatoRestaurant {
  id: string;
  name: string;
  url: string;
  location: ZomatoLocation;
  switch_to_order_menu: number;
  cuisines: string;
  average_cost_for_two: number;
  price_range: number;
  currency: string;
  offers: ZomatoOffer[];
  thumb: string;
  user_rating: ZomatoUserRating;
  photos_url: string;
  menu_url: string;
  featured_image: string;
  has_online_delivery: number;
  is_delivering_now: number;
  deeplink: string;
  has_table_booking: number;
  events_url: string;
  establishment?: string[];
  establishment_types?: number[];
}

export interface ZomatoLocation {
  address: string;
  locality: string;
  city: string;
  latitude: string;
  longitude: string;
  zipcode: string;
  country_id: number;
  locality_verbose: string;
}

export interface ZomatoUserRating {
  aggregate_rating: string;
  rating_text: string;
  rating_color: string;
  votes: string;
}

export interface ZomatoOffer {
  offer_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  promo_code: string;
  terms: string;
}

export interface ZomatoUserProfile {
  user_id: string;
  name: string;
  email: string;
  profile_url: string;
  profile_image: string;
  review_count: number;
  follower_count: number;
  following_count: number;
}

export interface ZomatoReview {
  id: string;
  rating: number;
  review_text: string;
  timestamp: string;
  user: {
    name: string;
    profile_image: string;
    user_id?: string;
  };
  likes: number;
  comments_count: number;
  food_rating?: number;
  service_rating?: number;
  ambience_rating?: number;
  value_rating?: number;
}

export interface ZomatoSearchResult {
  results_found: number;
  results_start: number;
  results_shown: number;
  restaurants: ZomatoRestaurantWrapper[];
}

export interface ZomatoRestaurantWrapper {
  restaurant: ZomatoRestaurant;
}

export interface ZomatoReviewsResponse {
  reviews_count: number;
  user_reviews: ZomatoReviewWrapper[];
}

export interface ZomatoReviewWrapper {
  review: ZomatoReview;
}

export interface ZomatoCategory {
  categories: ZomatoCategoryItem[];
}

export interface ZomatoCategoryItem {
  category: {
    id: number;
    name: string;
  };
}

export interface ZomatoCuisine {
  cuisines: ZomatoCuisineItem[];
}

export interface ZomatoCuisineItem {
  cuisine: {
    cuisine_id: number;
    cuisine_name: string;
  };
}

export interface ZomatoCity {
  location_suggestions: ZomatoLocationSuggestion[];
}

export interface ZomatoLocationSuggestion {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  city_id: number;
  city_name: string;
  country_id: number;
  country_name: string;
}