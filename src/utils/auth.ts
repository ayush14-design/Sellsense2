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
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const isAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    return isAuth === 'true' && !!token && !!userStr;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('sellsense_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  },
};
