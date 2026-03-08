import { Redirect } from "expo-router";
import { View, ActivityIndicator, Image } from "react-native";
import { useAuthStore } from "../store/authStore";
import React from "react";

/**
 * Entry: show splash until hydrated, then redirect is handled in _layout.
 */
export default function IndexScreen() {
  const { isReady, hasOnboarded } = useAuthStore();

  if (!isReady || hasOnboarded === null) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Image source={require("../assets/icon2.png")} className="w-20 h-20" />
        <ActivityIndicator size="small" color="#0f172a" />
      </View>
    );
  }

  if (hasOnboarded) {
    // if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }
  if (!useAuthStore.getState().accessToken) {
    return <Redirect href="/(auth)/login" />;
  }
  return <Redirect href="/(app)" />;
}
