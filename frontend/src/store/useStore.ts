import { create } from 'zustand';
import type { ParsedUser } from '@/types/userTypes';

interface StoreState {
  dark: boolean;
  toggleDark: () => void;
  user: ParsedUser | null;
  setUser: (user: ParsedUser) => void;
  loadUser: () => void;
}

const parseUserFromStorage = (): ParsedUser | null => {
  try {
    const raw = localStorage.getItem('daily_brew_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id,
      username: parsed.username,
      role: parsed.role,
      first_name: parsed.firstName ?? parsed.first_name ?? parsed.username,
      last_name: parsed.lastName ?? parsed.last_name ?? '',
      avatar_url: parsed.avatarUrl ?? parsed.avatar_url ?? null,
    };
  } catch {
    return null;
  }
};

export const useStore = create<StoreState>((set) => ({
  dark: (localStorage.getItem('pos_inventory_dark_mode') || 'false') === 'true',

  toggleDark: () => {
    set((state) => {
      const newDark = !state.dark;
      localStorage.setItem('pos_inventory_dark_mode', String(newDark));
      return { dark: newDark };
    });
  },

  user: parseUserFromStorage(),

  setUser: (user: ParsedUser) => {
    localStorage.setItem('daily_brew_user', JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
    }));
    set({ user });
  },

  loadUser: () => {
    set({ user: parseUserFromStorage() });
  },
}));