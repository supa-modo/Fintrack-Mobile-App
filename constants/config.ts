/**
 * App configuration - API URL from env (EXPO_PUBLIC_* are exposed to the app)
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";

export const config = {
  API_BASE_URL,
  API_TIMEOUT_MS: 15000,
} as const;
