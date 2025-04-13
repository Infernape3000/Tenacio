import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
  uid: string;
  email: string | null;
  // Add other relevant user properties from Firebase/Supabase Auth if needed
}

interface AppState {
  user: User | null;
  role: string | null;
  consentGiven: boolean;
  dailyQuoteCount: number;
  lastAccessDate: string | null; // Store date as ISO string (e.g., '2024-04-13')
  currentQuote: string | null;
  currentAuthor: string | null;
  isLoadingQuote: boolean;

  setUser: (user: User | null) => void;
  setRole: (role: string) => void;
  setConsent: (consent: boolean) => void;
  decrementQuoteCount: () => void;
  resetQuoteCount: (currentDate: string) => void;
  checkAndResetQuoteCount: () => Promise<void>; // Checks date and resets if needed
  setCurrentQuote: (quote: string, author: string) => void;
  clearCurrentQuote: () => void;
  setLoadingQuote: (loading: boolean) => void;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      role: null,
      consentGiven: false,
      dailyQuoteCount: 5,
      lastAccessDate: null,
      currentQuote: null,
      currentAuthor: null,
      isLoadingQuote: false,

      // Actions
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setConsent: (consent) => set({ consentGiven: consent }),
      decrementQuoteCount: () => set((state) => ({ dailyQuoteCount: Math.max(0, state.dailyQuoteCount - 1) })),
      resetQuoteCount: (currentDate) => set({ dailyQuoteCount: 5, lastAccessDate: currentDate }),
      setCurrentQuote: (quote, author) => set({ currentQuote: quote, currentAuthor: author, isLoadingQuote: false }),
      clearCurrentQuote: () => set({ currentQuote: null, currentAuthor: null }),
      setLoadingQuote: (loading) => set({ isLoadingQuote: loading }),

      checkAndResetQuoteCount: async () => {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = get().lastAccessDate;

        if (lastDate !== today) {
          console.log('Resetting daily quote count for new day:', today);
          get().resetQuoteCount(today);
        } else {
          console.log('Quote count already up-to-date for:', today);
        }
      },
    }),
    {
      name: 'tenacio-app-storage', // Unique name for AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only parts of the state needed across sessions
      partialize: (state) => ({
        role: state.role,
        consentGiven: state.consentGiven,
        dailyQuoteCount: state.dailyQuoteCount,
        lastAccessDate: state.lastAccessDate,
        // user: state.user, // Typically handle auth state separately or re-fetch on load
      }),
    }
  )
);

export default useStore; 