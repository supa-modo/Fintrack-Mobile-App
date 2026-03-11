// ─── components/sheets/CreateAccountSheet.tsx ────────────────────────────────
// Bottom-sheet version of the "Add Account" flow.
// Drop-in replacement for the old full-screen page.

import React, { useState } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput as RNTextInput,
} from "react-native";
import { Text } from "../../components/Text";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BottomSheet } from "../(app)/bottom-sheet";
import { createAccount } from "../../services/accounts";
import type { AccountType } from "../../types/api";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string; color: string }[] = [
  { value: "mobile_money", label: "Mobile Money", icon: "phone-portrait-outline", color: "#10B981" },
  { value: "bank",         label: "Bank",         icon: "business-outline",       color: "#3B82F6" },
  { value: "cash",         label: "Cash",         icon: "cash-outline",           color: "#F59E0B" },
  { value: "investment",   label: "Investment",   icon: "trending-up-outline",    color: "#8B5CF6" },
  { value: "crypto",       label: "Crypto",       icon: "logo-bitcoin",           color: "#EF4444" },
  { value: "other",        label: "Other",        icon: "ellipsis-horizontal-outline", color: "#64748B" },
];

const schema = z.object({
  name:     z.string().min(1, "Account name is required"),
  type:     z.enum(["bank", "mobile_money", "cash", "investment", "crypto", "other"]),
  currency: z.string().length(3, "Must be 3 characters"),
  balance:  z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Enter a valid amount",
  }),
});
type FormData = z.infer<typeof schema>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CreateAccountSheet({ visible, onClose }: Props) {
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { name: "", type: "mobile_money", currency: "KES", balance: "0" },
    });

  const handleClose = () => {
    reset();
    setApiError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await createAccount({
        name: data.name.trim(),
        type: data.type,
        currency: data.currency.trim(),
        balance: parseFloat(data.balance) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSuccess(true);
      setTimeout(() => handleClose(), 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.error
          : "Failed to create account";
      setApiError(msg ?? "Failed to create account");
    }
  };

  const inputStyle = [
    styles.input,
    isDark ? styles.inputDark : styles.inputLight,
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="New Account"
      subtitle="Link a bank, mobile or cash wallet"
      icon="wallet-outline"
      accentColors={["#3B82F6", "#1D4ED8"]}
    >
      {success ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.successContainer}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.successTitle, isDark && { color: "#F1F5F9" }]}>Account Created!</Text>
          <Text style={styles.successSub}>Your account has been added successfully.</Text>
        </Animated.View>
      ) : (
        <>
          {apiError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          {/* Account Type Selector */}
          <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Account Type</Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={({ pressed }) => [
                      styles.typeCard,
                      isDark ? styles.typeCardDark : styles.typeCardLight,
                      value === opt.value && {
                        borderColor: opt.color,
                        borderWidth: 1.5,
                        backgroundColor: `${opt.color}12`,
                      },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: `${opt.color}18` }]}>
                      <Ionicons name={opt.icon as any} size={18} color={opt.color} />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        isDark && { color: "#CBD5E1" },
                        value === opt.value && { color: opt.color, fontWeight: "700" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          {/* Name */}
          <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Account Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <RNTextInput
                  style={inputStyle}
                  placeholder="e.g. M-Pesa, KCB Savings"
                  placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.name && <Text style={styles.fieldError}>{errors.name.message}</Text>}
              </>
            )}
          />

          {/* Currency + Balance row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Currency</Text>
              <Controller
                control={control}
                name="currency"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <RNTextInput
                      style={inputStyle}
                      placeholder="KES"
                      placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                      autoCapitalize="characters"
                      maxLength={3}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.currency && <Text style={styles.fieldError}>{errors.currency.message}</Text>}
                  </>
                )}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Initial Balance</Text>
              <Controller
                control={control}
                name="balance"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <RNTextInput
                      style={inputStyle}
                      placeholder="0.00"
                      placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                      keyboardType="decimal-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.balance && <Text style={styles.fieldError}>{errors.balance.message}</Text>}
                  </>
                )}
              />
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.submitGradient}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Create Account</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  typeCard: {
    width: "30.5%",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  typeCardLight: {
    backgroundColor: "#fff",
    borderColor: "rgba(15,23,42,0.07)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  typeCardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  inputLight: {
    backgroundColor: "#fff",
    borderColor: "rgba(15,23,42,0.1)",
    color: "#0F172A",
  },
  inputDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "#F1F5F9",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  fieldError: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: { color: "#EF4444", fontSize: 13, fontWeight: "600", flex: 1 },
  submitBtn: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  successContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 14,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  successSub: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
});