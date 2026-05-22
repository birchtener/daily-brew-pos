import { create } from 'zustand';

interface StoreState {
  dark: boolean;
  toggleDark: () => void;
}

export const useStore = create<StoreState>((set) => ({
  dark: (localStorage.getItem('pos_inventory_dark_mode') || 'false') === 'true',
  
  toggleDark: () => {
    set((state) => {
      const newDark = !state.dark;
      localStorage.setItem('pos_inventory_dark_mode', String(newDark));
      return { dark: newDark };
    });
  },
}));