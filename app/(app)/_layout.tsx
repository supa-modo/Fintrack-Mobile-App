// ─── app/(app)/_layout.tsx ───────────────────────────────────────────────────
import { Tabs } from "expo-router";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { Text } from "../../components/Text";
import React, { useEffect } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TABS = [
  { name: "index",        label: "Home",     icon: "home-outline",    iconActive: "home"    },
  { name: "accounts",     label: "Accounts", icon: "wallet-outline",  iconActive: "wallet"  },
  { name: "transactions", label: "Activity", icon: "receipt-outline", iconActive: "receipt" },
  { name: "profile",      label: "Profile",  icon: "person-outline",  iconActive: "person"  },
];

const ACTIVE_COLOR   = "#3B82F6";
const DURATION       = 180;
const EASING         = Easing.out(Easing.quad);

function TabItem({
  route, isFocused, onPress, onLongPress, isDark,
}: {
  route: any; isFocused: boolean;
  onPress: () => void; onLongPress: () => void; isDark: boolean;
}) {
  const tab      = TABS.find((t) => t.name === route.name) ?? TABS[0];
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [isFocused]);

  const pillAnim = useAnimatedStyle(() => ({
    opacity: progress.value * (isDark ? 0.18 : 0.1),
  }));

  const inactiveColor = isDark ? "rgba(100,116,139,0.65)" : "rgba(100,116,139,0.7)";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      android_ripple={{ color: "rgba(59,130,246,0.08)", borderless: true }}
    >
      {/* Pill highlight */}
      <Animated.View style={[styles.pill, pillAnim, { backgroundColor: ACTIVE_COLOR }]} />

      {/* Icon */}
      <Ionicons
        name={(isFocused ? tab.iconActive : tab.icon) as any}
        size={20}
        color={isFocused ? ACTIVE_COLOR : inactiveColor}
      />

      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? ACTIVE_COLOR : inactiveColor },
          isFocused && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets  = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark  = colorScheme === "dark";

  return (
    <View
      style={[styles.outer, { bottom: Math.max(insets.bottom, 8) + 8 }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, isDark ? styles.barDark : styles.barLight]}>
        {state.routes.map((route, index) => {
          const isFocused   = state.index === index;
          const { options } = descriptors[route.key];
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
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: "row",
    height: 66,
    borderRadius: 26,
    overflow: "hidden",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18 },
      android: { elevation: 16 },
    }),
  },
  barDark: {
    backgroundColor: "rgba(8,18,32,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  barLight: {
    backgroundColor: "rgba(255,255,255, 0.97)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
  },

  // Each tab = exact 25% width
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    position: "relative",
  },

  // Pill sits flush behind the content
  pill: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 8,
    marginVertical: 7,
    borderRadius: 16,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.15,
    textAlign: "center",
  },
  tabLabelActive: {
    fontWeight: "700",
    fontSize: 10.5,
  },
});