import { create } from "zustand";
import { colorScheme } from "nativewind";
import { getThemePreference, setThemePreference } from "../lib/secureStorage";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  isReady: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  isReady: false,

  setTheme: async (theme) => {
    const current = get().theme;
    if (current === theme) return;
    await setThemePreference(theme);
    colorScheme.set(theme);
    set({ theme });
  },

  hydrate: async () => {
    try {
      const stored = await getThemePreference();
      const theme: ThemeMode =
        stored === "light" || stored === "dark" ? stored : "light";

      colorScheme.set(theme);
      set({ theme, isReady: true });
    } catch {
      colorScheme.set("light");
      set({ theme: "light", isReady: true });
    }
  },
}));

