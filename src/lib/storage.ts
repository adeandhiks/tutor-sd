import { Conversation } from './types';

const STORAGE_KEY = 'tutor-sd-conversations';
const THEME_KEY = 'tutor-sd-theme';
const SIDEBAR_KEY = 'tutor-sd-sidebar';

export const storage = {
  getConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  },

  getTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return (theme as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  },

  saveTheme(theme: 'light' | 'dark'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },

  getSidebarOpen(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const data = localStorage.getItem(SIDEBAR_KEY);
      return data !== null ? JSON.parse(data) : true;
    } catch {
      return true;
    }
  },

  saveSidebarOpen(open: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SIDEBAR_KEY, JSON.stringify(open));
    } catch (e) {
      console.error('Failed to save sidebar state:', e);
    }
  },
};
