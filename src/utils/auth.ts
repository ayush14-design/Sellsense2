import type { Restaurant, User } from '../types';

const STORAGE_KEYS = {
  USER: 'sellsense_user',
  RESTAURANT: 'sellsense_restaurant',
  IS_AUTHENTICATED: 'sellsense_is_authenticated',
};

export const authStorage = {
  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  setRestaurant: (restaurant: Restaurant) => {
    localStorage.setItem(STORAGE_KEYS.RESTAURANT, JSON.stringify(restaurant));
  },

  getRestaurant: (): Restaurant | null => {
    const restaurantStr = localStorage.getItem(STORAGE_KEYS.RESTAURANT);
    return restaurantStr ? JSON.parse(restaurantStr) : null;
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.RESTAURANT);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
  },
};
