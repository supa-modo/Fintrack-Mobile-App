/**
 * App configuration - API URL from env (EXPO_PUBLIC_* are exposed to the app)
 *
 * IMPORTANT:
 * - For local development on a simulator or device, set EXPO_PUBLIC_API_URL
 *   to a LAN-accessible URL of the FinTrack server, e.g.:
 *   - iOS simulator:  http://localhost:5000
 *   - Android emulator: http://10.0.2.2:5000
 *   - Physical device: http://<your-machine-ip>:5000
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";

export const config = {
  API_BASE_URL,
  API_TIMEOUT_MS: 15000,
} as const;
