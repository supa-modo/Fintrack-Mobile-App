import React, { useRef } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
} from "react-native";
import { Text } from "../../components/Text";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "../../components/ThemeToggle";
import { verifyOtp, requestPasswordReset } from "../../services/auth";
import { ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

type FormData = z.infer<typeof schema>;

export default function EnterResetCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ contact?: string; contactType?: string }>();
  const contact = (params.contact ?? "").toString();
  const contactType = (params.contactType ?? "").toString() as "email" | "phone" | "";

  const [apiError, setApiError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const code = watch("code");
  const inputs = [
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
  ];

  const handleChangeAtIndex = (index: number, value: string) => {
    const trimmed = value.replace(/[^0-9]/g, "").slice(-1);
    const chars = code.split("");
    chars[index] = trimmed;
    const nextCode = chars.join("").padEnd(6, "").slice(0, 6);
    setValue("code", nextCode, { shouldValidate: true });
    if (trimmed && index < inputs.length - 1) {
      inputs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!contact || (contactType !== "email" && contactType !== "phone")) {
      setApiError("Missing contact details. Please start the reset flow again.");
      return;
    }
    setApiError(null);
    setInfoMessage(null);
    try {
      if (__DEV__ || process.env.EXPO_PUBLIC_LOG_RESET_CODES === "true") {
        // eslint-disable-next-line no-console
        console.log("[DEV] Reset code submitted", {
          contactType,
          contact,
          code: data.code,
        });
      }
      const payload: { email?: string; phone?: string; code: string } = {
        code: data.code,
        ...(contactType === "email" ? { email: contact } : { phone: contact }),
      };
      const res = await verifyOtp(payload);
      if (!res.valid) {
        setApiError(res.message ?? "Invalid code. Please try again.");
        return;
      }
      router.push({
        pathname: "/(auth)/reset-password",
        params: {
          contact,
          contactType,
          code: data.code,
        },
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Failed to verify code";
      setApiError(message ?? "Failed to verify code");
    }
  };

  const handleResend = async () => {
    if (!contact || (contactType !== "email" && contactType !== "phone")) {
      setApiError("Missing contact details. Please start the reset flow again.");
      return;
    }
    setApiError(null);
    setInfoMessage(null);
    try {
      await requestPasswordReset({
        ...(contactType === "email" ? { email: contact } : { phone: contact }),
      });
      setInfoMessage("A new reset code has been sent.");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Failed to resend code";
      setApiError(message ?? "Failed to resend code");
    }
  };

  if (!contact || !contactType) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.flex, { paddingTop: insets.top }]}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 48,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={() => router.replace("/(auth)/forgot-password")}>
              <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                Back to forgot password
              </Text>
            </Pressable>
            <ThemeToggle />
          </View>
          <Text className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Reset session expired
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            We could not find your contact details for this reset session. Please start the password reset process again.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.flex, { paddingTop: insets.top }]}
    >
      <LinearGradient
        colors={isDark ? ["#020B18", "#041428", "#061C36"] : ["#F0F4FF", "#E8EEFF", "#F5F7FF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowTopRight, !isDark && { backgroundColor: "rgba(59,130,246,0.10)" }]} pointerEvents="none" />
      <View style={[styles.glowBottomLeft, !isDark && { backgroundColor: "rgba(99,102,241,0.10)" }]} pointerEvents="none" />

      <ScrollView
        className="mt-36"
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
          <View>
            <Image
              source={require("../../assets/login.png")}
              style={{ width: 250, height: 170, marginBottom: 10, marginLeft: -10 }}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.headerTitle, !isDark && { color: "#0f172a" }]}>Enter reset code</Text>
          <Text style={[styles.headerSub, !isDark && { color: "rgba(71,85,105,0.85)" }]}>
            We&apos;ve sent a 6-digit code to your {contactType === "email" ? "email address" : "phone number"}.
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
          {infoMessage ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.infoBanner}>
              <Ionicons name="information-circle" size={16} color="#22c55e" />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </Animated.View>
          ) : null}

          <Text style={styles.codeLabel}>Enter 6-digit code sent to your {contactType === "email" ? "email address" : "phone number"}.</Text>

          <View style={styles.codeRow}>
            {inputs.map((ref, index) => (
              <TextInput
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                ref={ref}
                value={code[index] ?? ""}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(val) => handleChangeAtIndex(index, val)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                style={styles.codeInput}
              />
            ))}
          </View>
          {errors.code?.message ? (
            <Text style={styles.codeError}>{errors.code.message}</Text>
          ) : null}

          <Pressable className="items-center" onPress={handleResend} style={styles.resendPressable}>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="refresh" size={15} className="text-primary-600 dark:text-primary-400" />
              <Text style={styles.resendText} className="ml-[0.3rem] underline underline-offset-2">Resend code</Text>
            </View>
          </Pressable>

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
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Continue</Text>
                  <View style={styles.ctaArrow}>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>



        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 24 }}
        >
          <Text className="text-center font-semibold text-primary-600 dark:text-primary-400">
            Back to sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backBtn: {},
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
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

  header: { marginBottom: 28 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    lineHeight: 36,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(148,163,184,0.8)",
    lineHeight: 22,
    fontWeight: "400",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
    marginBottom: 20,
    marginHorizontal: -10,
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
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: "#f87171", fontSize: 13, flex: 1 },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoText: { color: "#047857", fontSize: 13, flex: 1 },

  codeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(148,163,184,0.9)",
    marginBottom: 14,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  codeInput: {
    height: 50,
    width: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    backgroundColor: "rgba(15,23,42,0.02)",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  codeError: {
    marginTop: 4,
    fontSize: 11,
    color: "#f97316",
  },
  resendPressable: {
    marginTop: 10,
  },
  resendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
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
    marginTop: 10,
  },
  ctaGradient: {
    flex: 1,
    paddingHorizontal: 24,
    borderRadius: 140,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

