import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeStore } from "../store/themeStore";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const isDark = theme === "dark";

  const handleToggle = async () => {
    const next = isDark ? "light" : "dark";
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setTheme(next);
  };

  return (
    <Pressable
      onPress={handleToggle}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
      ]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name={isDark ? "moon-outline" : "sunny-outline"}
          size={18}
          color={isDark ? "#e5e7eb" : "#0f172a"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    padding: 6,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.06)",
  },
});

