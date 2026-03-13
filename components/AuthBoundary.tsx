import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
}

export function AuthBoundary({ children }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, isReady } = useAuthStore();

  React.useEffect(() => {
    if (!isReady) return;

    if (!accessToken) {
      if (segments[0] === "(app)") {
        router.replace("/(auth)/login");
      }
      return;
    }
  }, [accessToken, isReady, router, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <>{children}</>;
}

