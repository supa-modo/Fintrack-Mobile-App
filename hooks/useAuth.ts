import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { setHasOnboarded as persistOnboarding } from "../lib/secureStorage";

export function useAuth() {
  const {
    user,
    accessToken,
    isReady,
    hasOnboarded,
    hydrate,
    hydrateOnboarding,
    setHasOnboarded,
  } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isReady && hasOnboarded === null) {
      hydrateOnboarding();
    }
  }, [isReady, hasOnboarded, hydrateOnboarding]);

  const completeOnboarding = async () => {
    await persistOnboarding();
    setHasOnboarded(true);
  };

  return {
    user,
    accessToken,
    isReady,
    hasOnboarded: hasOnboarded ?? false,
    isAuthenticated: !!accessToken,
    completeOnboarding,
  };
}
