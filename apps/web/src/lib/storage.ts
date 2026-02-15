// Safe localStorage wrapper for Safari Private Browsing compatibility
// Safari Private mode throws errors when accessing localStorage

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      // Safari Private Browsing - silently fail
      console.warn('localStorage not available');
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // Safari Private Browsing - silently fail
    }
  },
};
