// ─── _layout.tsx ─────────────────────────────────────────────────────────────
// app/(app)/_layout.tsx
// Floating pill nav — modal screens are hidden from the tab bar.

import { Tabs } from "expo-router";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import React, { useEffect } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TABS = [
  { name: "index", label: "Home", icon: "home-outline", iconActive: "home" },
  { name: "accounts", label: "Accounts", icon: "wallet-outline", iconActive: "wallet" },
  { name: "transactions", label: "Activity", icon: "receipt-outline", iconActive: "receipt" },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person" },
];

function TabItem({
  route, isFocused, onPress, onLongPress, isDark,
}: {
  route: any; isFocused: boolean;
  onPress: () => void; onLongPress: () => void; isDark: boolean;
}) {
  const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: interpolate(opacity.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(0.88, { damping: 12 }, () => {
          scale.value = withSpring(1, { damping: 12 });
        });
        onPress();
      }}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabItemInner, animStyle]}>
        <Animated.View
          style={[
            styles.activePill,
            isDark
              ? { backgroundColor: "rgba(59,130,246,0.18)" }
              : { backgroundColor: "rgba(59,130,246,0.1)" },
            pillStyle,
          ]}
        />
        <Ionicons
          name={(isFocused ? tab.iconActive : tab.icon) as any}
          size={22}
          color={isFocused ? "#3B82F6" : isDark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.7)"}
        />
        <Animated.Text style={[styles.tabLabel, { color: "#3B82F6" }, pillStyle]}>
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.tabBarOuter, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={[styles.tabBarInner, isDark ? styles.tabBarDark : styles.tabBarLight]}>
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)"]
              : ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.8)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          // @ts-ignore
          borderRadius={36}
        />
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          // Hide any tab that sets tabBarButton to null (our modal screens)
          if (options.tabBarButton === null) return null;

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              isDark={isDark}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Main tabs ── */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="transactions" />
      {/* <Tabs.Screen name="profile" /> */}

    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  tabBarInner: {
    flexDirection: "row",
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 6,
    overflow: "hidden",
    width: "100%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
  },
  tabBarDark: { backgroundColor: "rgba(10,20,35,0.88)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  tabBarLight: { backgroundColor: "rgba(255,255,255,0.85)", borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", height: 50 },
  tabItemInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 50, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 24, gap: 5, position: "relative" },
  activePill: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  tabLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.1 },
});