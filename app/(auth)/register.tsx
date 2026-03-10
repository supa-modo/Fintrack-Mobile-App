import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Text } from "../../components/Text";
import { LabeledInput } from "../../components/LabeledInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { register as registerApi } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

const schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.email?.trim() || data.phone?.trim(), {
    message: "Provide at least email or phone",
    path: ["email"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const payload: Parameters<typeof registerApi>[0] = {
      full_name: data.full_name.trim(),
      password: data.password,
    };
    if (data.email?.trim()) payload.email = data.email.trim();
    if (data.phone?.trim()) payload.phone = data.phone.trim();
    if (!payload.email && !payload.phone) {
      setApiError("Provide at least email or phone");
      return;
    }
    try {
      const res = await registerApi(payload);
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : "Registration failed";
      setApiError(message ?? "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.flex, { paddingTop: insets.top }]}
    >
      {/* Background */}
      <LinearGradient
        colors={isDark ? ["#020B18", "#041428", "#061C36"] : ["#F0F4FF", "#E8EEFF", "#F5F7FF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowTopRight, !isDark && { backgroundColor: "rgba(59,130,246,0.10)" }]} pointerEvents="none" />
      <View style={[styles.glowBottomLeft, !isDark && { backgroundColor: "rgba(99,102,241,0.10)" }]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <View style={[styles.backBtnInner, !isDark && styles.backBtnLight]}>
              <Ionicons name="arrow-back" size={18} color={isDark ? "#fff" : "#0f172a"} />
            </View>
          </Pressable>
          <ThemeToggle />
        </View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <View style={styles.tagChip}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>NEW ACCOUNT</Text>
          </View>
          <Text style={[styles.headerTitle, !isDark && { color: "#0f172a" }]}>
            Create account
          </Text>
          <Text style={[styles.headerSub, !isDark && { color: "rgba(71,85,105,0.85)" }]}>
            Sign up to start tracking your finances
          </Text>
        </Animated.View>

        {/* Glass Card */}
        <Animated.View
          entering={FadeIn.duration(500).delay(150)}
          style={[
            styles.card,
            !isDark && { backgroundColor: "rgba(255,255,255,0.96)", borderColor: "rgba(15,23,42,0.06)" },
          ]}
        >
          {/* Inner gradient shine */}
          <LinearGradient
            colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardShine}
          />

          {apiError ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#f87171" />
              <Text style={styles.errorText}>{apiError}</Text>
            </Animated.View>
          ) : null}

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="Full name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="John Doe"
                errorText={errors.full_name?.message}
                containerClassName="mb-4"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="Email"
                value={value ?? ""}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={errors.email?.message}
                containerClassName="mb-4"
              />
            )}
          />

          {/* Or divider */}
          <View style={styles.orDivider}>
            <View style={[styles.orLine, !isDark && { backgroundColor: "rgba(15,23,42,0.10)" }]} />
            <Text style={[styles.orText, !isDark && { color: "rgba(71,85,105,0.5)" }]}>or</Text>
            <View style={[styles.orLine, !isDark && { backgroundColor: "rgba(15,23,42,0.10)" }]} />
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="Phone"
                value={value ?? ""}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="+254712345678"
                keyboardType="phone-pad"
                errorText={errors.phone?.message}
                containerClassName="mb-4"
              />
            )}
          />

          {/* Divider before password */}
          <View style={[styles.sectionDivider, !isDark && { backgroundColor: "rgba(15,23,42,0.06)" }]} />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="Password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                errorText={errors.password?.message}
                containerClassName="mb-1"
                rightAccessory={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
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
          <Text style={[styles.passwordHint, !isDark && { color: "rgba(71,85,105,0.55)" }]}>
            Minimum 8 characters
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeIn.duration(400).delay(300)}>
          <Pressable
            onPress={handleSubmit(onSubmit)}
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
              <LinearGradient
                colors={["rgba(255,255,255,0.18)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaShine}
              />
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Create account</Text>
                  <View style={styles.ctaArrow}>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.footer}>
          <Text style={[styles.footerText, !isDark && { color: "rgba(100,116,139,0.9)" }]}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[styles.footerLink, !isDark && { color: "#1D4ED8" }]}>
                Sign in
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  glowTopRight: {
    position: "absolute", top: -100, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  glowBottomLeft: {
    position: "absolute", bottom: -80, left: -100,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 28,
  },
  backBtn: {},
  backBtnInner: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnLight: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },

  // Header
  header: { marginBottom: 24 },
  tagChip: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(59,130,246,0.4)",
    backgroundColor: "rgba(59,130,246,0.12)",
    gap: 6, marginBottom: 14,
  },
  tagDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  tagText: {
    fontSize: 9, fontWeight: "800",
    color: "#3B82F6", letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 30, fontWeight: "800",
    color: "#F8FAFC", lineHeight: 38,
    letterSpacing: 0.3, marginBottom: 8,
  },
  headerSub: {
    fontSize: 14, color: "rgba(148,163,184,0.8)",
    lineHeight: 22,
  },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 28, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24, overflow: "hidden", marginBottom: 20,
  },
  cardShine: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28, opacity: 0.5,
  },

  errorBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 16, gap: 8,
  },
  errorText: { color: "#f87171", fontSize: 13, flex: 1 },

  orDivider: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginVertical: 10,
  },
  orLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  orText: {
    fontSize: 10, fontWeight: "700",
    color: "rgba(148,163,184,0.5)",
    letterSpacing: 0.8, textTransform: "uppercase",
  },

  sectionDivider: {
    height: 1, backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 16,
  },

  passwordHint: {
    fontSize: 11, color: "rgba(148,163,184,0.5)",
    marginTop: 4, marginLeft: 2,
  },

  // CTA
  ctaWrapper: {
    height: 52, borderRadius: 140, overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
    marginBottom: 24,
  },
  ctaGradient: {
    flex: 1, paddingHorizontal: 24, borderRadius: 140,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  ctaShine: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "50%",
    borderTopLeftRadius: 140, borderTopRightRadius: 140,
  },
  ctaContent: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  ctaArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  footer: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "center",
  },
  footerText: { color: "rgba(148,163,184,0.6)", fontSize: 14 },
  footerLink: { color: "#93C5FD", fontSize: 14, fontWeight: "700" },
});