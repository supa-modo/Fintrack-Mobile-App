# FinTrack Mobile

React Native (Expo) app for FinTrack personal finance tracking. Uses NativeWind (Tailwind CSS), Expo Router, and connects to the FinTrack backend API.

## Setup

1. **Install dependencies**

   ```bash
   cd fintrack/mobile
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   # Set EXPO_PUBLIC_API_URL to your backend:
   # - Simulator/emulator: http://localhost:5000 (iOS) or http://10.0.2.2:5000 (Android emulator)
   # - Physical device: see "Running on a physical device" below
   ```

3. **Start backend** (from `fintrack/server`)

   ```bash
   npm run dev
   ```

4. **Start Expo**

   ```bash
   npm start
   ```

   If you see "Incompatible SDK version" in Expo Go, the project is on **Expo SDK 54** and works with the **Expo Go** app from the Play Store / App Store. After changing dependencies or upgrading, run with a clear cache:

   ```bash
   npm run start:clear
   ```

   Then press `a` for Android or `i` for iOS simulator.

### Running on a physical device (Expo Go)

To use Expo Go on your phone while the backend runs on your laptop:

1. Put your **phone and laptop on the same Wi‑Fi network**.
2. Find your **laptop’s LAN IP address**:
   - **Windows:** `ipconfig` → use the IPv4 address (e.g. 192.168.1.5).
   - **Mac/Linux:** `ifconfig` or `hostname -I` → use the inet address.
3. In `fintrack/mobile/.env`, set:
   ```bash
   EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000
   ```
   Example: `EXPO_PUBLIC_API_URL=http://192.168.1.5:5000`
4. Start the backend on the laptop (`npm run dev` in `fintrack/server`). The server listens on all interfaces by default, so the phone can connect.
5. Restart Expo (`npm start` or `npm run start:clear`) so it picks up the new env value, then scan the QR code with Expo Go.

If the app still cannot reach the API, check that Windows Firewall (or your OS firewall) allows inbound connections on port 5000, or temporarily allow the Node/Expo process.

## Features

- **Splash & onboarding** – First launch shows onboarding slides; then login/register.
- **Auth** – Login (email or phone), Register, Forgot password (OTP), Reset password.
- **Dashboard** – Total balance, account cards, monthly income/expense/net, spending trend.
- **Accounts** – List accounts, add account, update balance, delete (long-press for actions).
- **Transactions** – List transactions, add income/expense/transfer (via “Add” in header).

## Security

- Tokens stored in `expo-secure-store` (keychain/keystore) only.
- API client adds `Authorization: Bearer <token>` and refreshes on 401.
- Passwords and tokens are never logged.

## Tech stack

- Expo SDK 54, Expo Router, TypeScript
- NativeWind v4 + Tailwind CSS
- Zustand (auth), TanStack Query (server state), Axios, React Hook Form + Zod
