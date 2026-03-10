import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [hydrated, setHydrated] = useState(false);
  const [themeHydrated, setThemeHydrated] = useState(false);

  const [fontsLoaded] = useFonts({
    GoogleSansFlex: require("../assets/fonts/GoogleSansFlex.ttf"),
  });

  useEffect(() => {
    useAuthStore.getState().hydrate().then(() => setHydrated(true));
    useThemeStore.getState().hydrate().then(() => setThemeHydrated(true));
  }, []);

  useEffect(() => {
    if (
      !hydrated ||
      !useAuthStore.getState().isReady ||
      !themeHydrated ||
      !fontsLoaded
    ) {
      return;
    }
    SplashScreen.hideAsync();
  }, [hydrated, themeHydrated, fontsLoaded]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
