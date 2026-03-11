// ─── components/BottomSheet.tsx ──────────────────────────────────────────────
// A reusable animated bottom sheet that slides up to 78% screen height.
// Usage:
//   <BottomSheet visible={open} onClose={() => setOpen(false)} title="Add Account">
//     {children}
//   </BottomSheet>

import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Text } from "../../components/Text";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_H * 0.78;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accentColor?: string;
  accentColors?: [string, string];
  icon?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  accentColor = "#3B82F6",
  accentColors,
  icon,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const gradientColors: [string, string] = accentColors ?? [accentColor, accentColor];

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 280 });
      translateY.value = withSpring(0, {
        damping: 26,
        stiffness: 260,
        mass: 0.9,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 300 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kvContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            isDark ? styles.sheetDark : styles.sheetLight,
            sheetStyle,
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, isDark && styles.handleDark]} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              {icon && (
                <LinearGradient
                  colors={gradientColors}
                  style={styles.sheetIconBg}
                >
                  <Ionicons name={icon as any} size={20} color="#fff" />
                </LinearGradient>
              )}
              <View>
                <Text style={[styles.sheetTitle, isDark && { color: "#F1F5F9" }]}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={styles.sheetSubtitle}>{subtitle}</Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, isDark && styles.closeBtnDark]}
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, isDark && styles.dividerDark]} />

          {/* Scrollable content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(2,11,24,0.72)",
  },
  kvContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  sheetLight: {
    backgroundColor: "#F8FAFC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 30,
  },
  sheetDark: {
    backgroundColor: "#0D1B2E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 30,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15,23,42,0.14)",
  },
  handleDark: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15,23,42,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15,23,42,0.1)",
    marginHorizontal: 24,
  },
  dividerDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
});