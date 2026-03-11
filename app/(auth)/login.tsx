import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { LabeledInput } from "../../components/LabeledInput";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useRouter, Link } from "expo-router";
import { useState } from "react";

import { useAuthStore } from "../../store/authStore";
import { login as loginApi } from "../../services/auth";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import React from "react";
import { useColorScheme } from "nativewind";
import { ThemeToggle } from "../../components/ThemeToggle";

const schema = z.object({
  email_or_phone: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setTokens = useAuthStore((s) => s.setTokens);

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await loginApi(data);
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setApiError(message ?? "Invalid credentials. Please try again.");
    }
  };

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSubmit(onSubmit)();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
    >
      {/* Multi-layer background for depth */}
      <LinearGradient
        colors={
          isDark
            ? ["#020B18", "#041428", "#061C36"]
            : ["#EEF2FF", "#E5E7EB", "#DBEAFE"]
        }
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow top-right */}
      <View
        style={[
          styles.glowTopRight,
          !isDark && { backgroundColor: "rgba(59,130,246,0.10)" },
        ]}
        pointerEvents="none"
      />
      {/* Radial glow bottom-left */}
      <View
        style={[
          styles.glowBottomLeft,
          !isDark && { backgroundColor: "rgba(129,140,248,0.10)" },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(700).springify()}
          style={styles.heroSection}
        >
          <View style={styles.heroHeader}>
            <Image
              source={require("../../assets/icon2.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemeToggle />
          </View>

          <Text
            style={[
              styles.heroTitle,
              !isDark && { color: "#0f172a" },
            ]}
          >
            Welcome Back !
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              !isDark && { color: "rgba(71,85,105,0.9)" },
            ]}
          >
            Enter your credentials to Sign In to your account
          </Text>
        </Animated.View>

        {/* Glass Card */}
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          style={[
            styles.glassCard,
            !isDark && {
              backgroundColor: "rgba(255,255,255,0.96)",
              borderColor: "rgba(15,23,42,0.06)",
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
          />

          {apiError && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                styles.errorBanner,
                !isDark && {
                  backgroundColor: "rgba(254,242,242,1)",
                  borderColor: "rgba(248,113,113,0.8)",
                },
              ]}
            >
              <Ionicons name="alert-circle" size={17} color="#f87171" />
              <Text style={styles.errorText}>{apiError}</Text>
            </Animated.View>
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email_or_phone"
            render={({ field: { onChange, value } }) => (
              <LabeledInput
                label="Email or Phone"
                labelClassName="mb-1.5"
                placeholder="you@example.com"
                placeholderTextColor="rgba(148,163,184,0.4)"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={errors.email_or_phone?.message}
                inputClassName="h-13 text-base"
                inputWrapperClassName="rounded-xl px-4"
                containerClassName="mb-5"
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <LabeledInput
                rightAccessoryHref="/(auth)/forgot-password"
                rightAccessoryOnPress={() => {}}
                rightAccessoryText="Forgot password?"
                label="Password"
                labelClassName="mb-1.5"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(148,163,184,0.4)"
                errorText={errors.password?.message}
                inputClassName="h-13 text-base"
                inputWrapperClassName="rounded-2xl px-4"
                containerClassName="mb-2"
                rightAccessory={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="rgba(148,163,184,0.7)"
                    />
                  </Pressable>
                }
              />
            )}
          />

          {/* CTA Button */}
          <Pressable
            onPress={handleLoginPress}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.ctaWrapper,
              pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
            ]}
          >
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
           
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Sign In</Text>
                  <View style={styles.ctaArrow}>
                    <Ionicons name="arrow-forward" size={15} color="#fff" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeIn.duration(400).delay(500)}
          style={styles.dividerRow}
        >
          <View
          className="ml-5 bg-gray-400 dark:bg-slate-500"
            style={[
              styles.dividerLine,
              
            ]}
          />
          <Text
            style={[
              styles.dividerText,
              !isDark && { color: "rgba(71,85,105,0.6)" },
              isDark && { color: "rgba(148,163,184,0.7)" },
            ]}
          >
            or continue with
          </Text>
          <View
          className="mr-5 bg-gray-400 dark:bg-slate-500"
            style={[
              styles.dividerLine,
              
            ]}
          />
        </Animated.View>

        {/* ── Social buttons ── */}
        <Animated.View
          entering={FadeIn.duration(500).delay(400).springify()}
          style={styles.socialRow}
        >
          {/* Google */}
          <Pressable
          className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-gray-700 rounded-full"
            style={({ pressed }) => [
              styles.socialBtn,
             pressed && styles.socialBtnPressed,
            ]}
          >
            <View style={styles.socialBtnInner}>
              {/* Google multicolour "G" SVG-equivalent using nested views */}
              <View style={styles.googleIconWrapper}>
              <Ionicons name="logo-google" size={18}
               color= "#ef4444"
               />
              </View>
              <Text
                style={[
                  styles.socialBtnText,
                  !isDark && styles.socialBtnTextLight,
                ]}
              >
                Google
              </Text>
            </View>
          </Pressable>

          {/* Apple */}
          <Pressable
          className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-gray-700 rounded-full"
            style={({ pressed }) => [
              styles.socialBtn,
              
              pressed && styles.socialBtnPressed,
            ]}
          >
            <View style={styles.socialBtnInner}>
              <View style={styles.appleIconWrapper}>
                <Ionicons
                  name="logo-apple"
                  size={18}
                  color={isDark ? "#fff" : "#0f172a"}
                />
              </View>
              <Text
                style={[
                  styles.socialBtnText,
                  !isDark && styles.socialBtnTextLight,
                ]}
              >
                Apple
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.duration(400).delay(600)}
          style={styles.footer}
        >
          <Text
            style={[
              styles.footerText,
              !isDark && { color: "rgba(100,116,139,0.9)" },
            ]}
          >
            Don't have an account?{" "}
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text
                  style={[
                    styles.footerLink,
                    !isDark && { color: "#1D4ED8" },
                  ]}
                >
                  Create one
                </Text>
              </Pressable>
            </Link>
          </Text>
        </Animated.View>

        <Link href="/(onboarding)" asChild>
          <Pressable>
            <Text
              style={[
                styles.footerLink,
                styles.textCenter,
                !isDark && { color: "#1D4ED8" },
              ]}
            >
              Go to onboarding
            </Text>
          </Pressable>
        </Link>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  textCenter: { textAlign: "center" },

  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  heroSection: {
    paddingTop: 120,
    paddingBottom: 30,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 180,
    height: 70,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F8FAFC",
    lineHeight: 50,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(148,163,184,0.8)",
    fontWeight: "400",
    letterSpacing: 0.1,
    marginLeft: 5,
  },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardGradientBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    opacity: 0.5,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    flex: 1,
  },

  ctaWrapper: {
    height: 50,
    borderRadius: 140,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 8,
  },
  ctaGradient: {
    height: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 140,
    overflow: "hidden",
    position: "relative",
  },
  
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 24,
    height: 24,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ── Social buttons ── */
  socialRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 32,
  },
  socialBtn: {
    flex: 1,
    
    overflow: "hidden",
  
  },
  // Dark mode: semi-transparent white glass pill
  socialBtnDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
  },
  // Light mode: solid white card with visible border
  socialBtnLight: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#3B82F6",
  },
  socialBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  socialBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  // Google "G" badge
  googleIconWrapper: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",

  },

  appleIconWrapper: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtnText: {
    // Dark mode: bright white
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  socialBtnTextLight: {
    // Light mode: near-black for full contrast
    color: "#0f172a",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  footerText: {
    color: "rgba(148,163,184,0.6)",
    fontSize: 14,
  },
  footerLink: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "700",
  },
});