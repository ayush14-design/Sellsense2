// Theme, language and settings preferences helper

export interface AlertSettings {
  enabled: boolean;
  minStarRating: number; // e.g. 2 means 1 and 2 stars
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  recipientEmail: string;
}

export interface AiReplySettings {
  enabled: boolean;
  tone: 'empathetic' | 'professional' | 'warm';
  includeDiscountVoucher: boolean;
  voucherCode: string;
}

export const initTheme = (): void => {
  try {
    // Clear conflicting legacy key
    localStorage.removeItem('theme');

    const savedTheme = localStorage.getItem('sellsense_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // Default is always crisp, vibrant light theme unless explicitly chosen
      document.documentElement.classList.remove('dark');
      if (!savedTheme) {
        localStorage.setItem('sellsense_theme', 'light');
      }
    }
  } catch (e) {
    console.error('Failed to init theme', e);
  }
};

export const setTheme = (isDark: boolean): void => {
  try {
    // Clean legacy key
    localStorage.removeItem('theme');

    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sellsense_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sellsense_theme', 'light');
    }

    // Broadcast change to all mounted components
    window.dispatchEvent(
      new CustomEvent('sellsense_theme_changed', { detail: { isDark } })
    );
  } catch (e) {
    console.error('Failed to set theme', e);
  }
};

export const isDarkMode = (): boolean => {
  try {
    return localStorage.getItem('sellsense_theme') === 'dark';
  } catch {
    return false;
  }
};

export const subscribeThemeChange = (callback: (isDark: boolean) => void): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ isDark: boolean }>;
    callback(custom.detail ? custom.detail.isDark : isDarkMode());
  };
  window.addEventListener('sellsense_theme_changed', handler);
  return () => window.removeEventListener('sellsense_theme_changed', handler);
};

export const getLanguage = (): string => {
  try {
    return localStorage.getItem('sellsense_language') || 'en';
  } catch {
    return 'en';
  }
};

export const setLanguage = (lang: string): void => {
  try {
    localStorage.setItem('sellsense_language', lang);
  } catch (e) {
    console.error('Failed to set language', e);
  }
};

export const getAlertSettings = (): AlertSettings => {
  try {
    const data = localStorage.getItem('sellsense_alert_settings');
    if (data) return JSON.parse(data);
  } catch {}
  return {
    enabled: true,
    minStarRating: 2,
    channels: {
      email: true,
      sms: false,
      inApp: true,
    },
    recipientEmail: '',
  };
};

export const setAlertSettings = (settings: AlertSettings): void => {
  try {
    localStorage.setItem('sellsense_alert_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to set alert settings', e);
  }
};

export const getAiReplySettings = (): AiReplySettings => {
  try {
    const data = localStorage.getItem('sellsense_ai_reply_settings');
    if (data) return JSON.parse(data);
  } catch {}
  return {
    enabled: true,
    tone: 'empathetic',
    includeDiscountVoucher: true,
    voucherCode: 'SORRY10',
  };
};

export const setAiReplySettings = (settings: AiReplySettings): void => {
  try {
    localStorage.setItem('sellsense_ai_reply_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to set AI reply settings', e);
  }
};
