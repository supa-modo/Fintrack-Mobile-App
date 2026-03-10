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
import React, { useState } from "react";
import { requestPasswordReset } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

const schema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email?.trim() || data.phone?.trim(), {
    message: "Provide email or phone",
    path: ["email"],
  });

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", phone: "" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const email = data.email?.trim();
    const phone = data.phone?.trim();
    if (!email && !phone) {
      setApiError("Provide email or phone");
      return;
    }
    try {
      await requestPasswordReset({ email: email || undefined, phone: phone || undefined });
      setSuccess(true);
      setTimeout(() => {
        router.push({
          pathname: "/(auth)/reset-password",
          params: {
            contact: email || phone || "",
            contactType: email ? "email" : "phone",
          },
        });
      }, 800);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
            ?.data?.error
          : "Failed to send code";
      setApiError(message ?? "Failed to send code");
    }
  };

  if (success) {
    return (
      <View style={[styles.successScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={isDark ? ["#020B18", "#041428", "#061C36"] : ["#F0F4FF", "#E8EEFF", "#F5F7FF"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.successInner}>
          <View style={styles.successIconRing}>
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.successIconGrad}>
              <Ionicons name="mail-outline" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.successTitle, !isDark && { color: "#0f172a" }]}>Check your inbox</Text>
          <Text style={[styles.successSub, !isDark && { color: "rgba(71,85,105,0.8)" }]}>
            A reset code has been sent to your email or phone.
          </Text>
          <ActivityIndicator style={{ marginTop: 24 }} size="small" color="#3B82F6" />
        </View>
        <View style={styles.toggleTopRight}>
          <ThemeToggle />
        </View>
      </View>
    );
  }

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
          {/* Icon badge */}
          <View style={styles.iconBadge}>
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.iconBadgeGrad}>
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.headerTitle, !isDark && { color: "#0f172a" }]}>Forgot password?</Text>
          <Text style={[styles.headerSub, !isDark && { color: "rgba(71,85,105,0.85)" }]}>
            Enter your email or phone and we'll send you a reset code.
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
          {apiError ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#f87171" />
              <Text style={styles.errorText}>{apiError}</Text>
            </Animated.View>
          ) : null}

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
                containerClassName="mb-4"
              />
            )}
          />

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
                errorText={(errors.email as { message?: string } | undefined)?.message}
                containerClassName="mb-2"
              />
            )}
          />
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
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Send Reset Code</Text>
                  <View style={styles.ctaArrow}>
                    <Ionicons name="arrow-forward" size={15} color="#fff" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>


        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.backToLogin}>
            <Ionicons name="arrow-back" size={14} color="#3B82F6" />
            <Text style={styles.backToLoginText}>Back to sign in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Background
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
    justifyContent: "space-between", marginBottom: 32,
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // Header
  header: { marginBottom: 28 },
  iconBadge: {
    width: 52, height: 52, borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  iconBadgeGrad: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28, fontWeight: "800",
    color: "#F8FAFC", lineHeight: 36,
    letterSpacing: 0.3, marginBottom: 8,
  },
  headerSub: {
    fontSize: 14, color: "rgba(148,163,184,0.8)",
    lineHeight: 22, fontWeight: "400",
  },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 28, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24, marginBottom: 20,
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
    gap: 10, marginVertical: 12,
  },
  orLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  orText: {
    fontSize: 11, fontWeight: "700",
    color: "rgba(148,163,184,0.5)",
    letterSpacing: 0.8, textTransform: "uppercase",
  },

  // CTA
  ctaWrapper: {
    height: 52, borderRadius: 140, overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  ctaGradient: {
    flex: 1, paddingHorizontal: 24,
    borderRadius: 140, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  ctaShine: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "50%",
    borderTopLeftRadius: 140, borderTopRightRadius: 140,
  },
  ctaContent: {
    paddingVertical: 13,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  ctaArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  backToLogin: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
  },
  backToLoginText: {
    color: "#3B82F6", fontSize: 14, fontWeight: "700",
  },

  // Success screen
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  successInner: { alignItems: "center" },
  successIconRing: {
    width: 80, height: 80, borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  successIconGrad: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: {
    fontSize: 24, fontWeight: "800",
    color: "#F8FAFC", marginBottom: 10, textAlign: "center",
  },
  successSub: {
    fontSize: 14, color: "rgba(148,163,184,0.8)",
    textAlign: "center", lineHeight: 22,
  },
  toggleTopRight: { position: "absolute", top: 16, right: 24 },
});