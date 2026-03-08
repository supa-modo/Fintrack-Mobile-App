import { Redirect } from "expo-router";
import { Tabs, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { Pressable } from "react-native";
import { Text } from "../../components/Text";
import { logout as logoutApi, getMe } from "../../services/auth";
import { useEffect } from "react";
import React from "react";

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  useEffect(() => {
    if (accessToken && !user) {
      getMe()
        .then((data) => setUser(data.user))
        .catch(() => {});
    }
  }, [accessToken, user, setUser]);

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    await useAuthStore.getState().logout();
    router.replace("/(auth)/login");
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#64748b",
        headerLeft: () => (
          <Pressable onPress={handleLogout} className="ml-4">
            <Text className="text-slate-600 text-sm">Logout</Text>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(app)/create-transaction")}
            className="mr-4"
          >
            <Text className="text-emerald-600 font-medium">Add</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarLabel: "Transactions",
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarLabel: "Accounts",
        }}
      />
      <Tabs.Screen
        name="create-account"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="update-balance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create-transaction"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
