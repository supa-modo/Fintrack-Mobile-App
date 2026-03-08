import { create } from "zustand";
import type { User } from "../types/api";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken as saveAccessToken,
  setRefreshToken as saveRefreshToken,
  clearTokens as clearStoredTokens,
  getHasOnboarded,
} from "../lib/secureStorage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  hasOnboarded: boolean | null;
  setTokens: (access: string, refresh: string, user: User) => Promise<void>;
  setTokensOnly: (access: string, refresh: string) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setHasOnboarded: (value: boolean) => void;
  hydrateOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isReady: false,
  hasOnboarded: null,

  setTokens: async (access, refresh, user) => {
    await saveAccessToken(access);
    await saveRefreshToken(refresh);
    set({ accessToken: access, refreshToken: refresh, user });
  },

  setTokensOnly: async (access: string, refresh: string) => {
    await saveAccessToken(access);
    await saveRefreshToken(refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await clearStoredTokens();
    set({ user: null, accessToken: null, refreshToken: null });
  },

  hydrate: async () => {
    try {
      const [access, refresh] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);
      const hasOnboarded = await getHasOnboarded();
      set({
        accessToken: access,
        refreshToken: refresh,
        hasOnboarded,
        isReady: true,
      });
    } catch {
      set({ isReady: true, hasOnboarded: false });
    }
  },

  setHasOnboarded: (value) => set({ hasOnboarded: value }),

  hydrateOnboarding: async () => {
    try {
      const value = await getHasOnboarded();
      set({ hasOnboarded: value });
    } catch {
      set({ hasOnboarded: false });
    }
  },
}));
