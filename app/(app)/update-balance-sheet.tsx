// ─── components/sheets/UpdateBalanceSheet.tsx ────────────────────────────────

import React, { useState, useEffect } from "react";
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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BottomSheet } from "../(app)/bottom-sheet";
import { getAccount, updateAccount, getAccounts } from "../../services/accounts";

const schema = z.object({
  accountId: z.string().min(1, "Select an account"),
  balance: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Enter a valid amount",
  }),
});
type FormData = z.infer<typeof schema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pre-select a specific account */
  preselectedAccountId?: string;
}

const ACCOUNT_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

export function UpdateBalanceSheet({ visible, onClose, preselectedAccountId }: Props) {
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    enabled: visible,
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { accountId: preselectedAccountId ?? "", balance: "" },
    });

  const selectedId = watch("accountId");
  const selectedAccount = accounts.find((a) => a.id === selectedId);

  useEffect(() => {
    if (preselectedAccountId) setValue("accountId", preselectedAccountId);
  }, [preselectedAccountId]);

  useEffect(() => {
    if (selectedAccount) {
      setValue("balance", String(selectedAccount.balance));
    }
  }, [selectedAccount]);

  const handleClose = () => {
    reset({ accountId: preselectedAccountId ?? "", balance: "" });
    setApiError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await updateAccount(data.accountId, { balance: parseFloat(data.balance) || 0 });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["account", data.accountId] });
      setSuccess(true);
      setTimeout(() => handleClose(), 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.error
          : "Failed to update balance";
      setApiError(msg ?? "Failed to update balance");
    }
  };

  const inputStyle = [styles.input, isDark ? styles.inputDark : styles.inputLight];

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Update Balance"
      subtitle={selectedAccount ? selectedAccount.name : "Reconcile your account balance"}
      icon="refresh-outline"
      accentColors={["#10B981", "#059669"]}
    >
      {success ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.successContainer}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.successTitle, isDark && { color: "#F1F5F9" }]}>Balance Updated!</Text>
          <Text style={styles.successSub}>Your account balance has been reconciled.</Text>
        </Animated.View>
      ) : (
        <>
          {apiError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          {/* Account Selector */}
          {!preselectedAccountId && (
            <>
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Select Account</Text>
              <Controller
                control={control}
                name="accountId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.accountList}>
                    {accounts.map((acc, i) => {
                      const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                      const selected = value === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => onChange(acc.id)}
                          style={({ pressed }) => [
                            styles.accountRow,
                            isDark ? styles.accountRowDark : styles.accountRowLight,
                            selected && { borderColor: color, borderWidth: 1.5, backgroundColor: `${color}0D` },
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <View style={[styles.accountDot, { backgroundColor: color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.accountRowName, isDark && { color: "#E2E8F0" }]}>
                              {acc.name}
                            </Text>
                            <Text style={styles.accountRowType}>{acc.type}</Text>
                          </View>
                          <Text style={[styles.accountRowBal, isDark && { color: "#94A3B8" }]}>
                            {acc.currency} {acc.balance.toLocaleString()}
                          </Text>
                          {selected && (
                            <View style={[styles.checkCircle, { backgroundColor: color }]}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
              {errors.accountId && (
                <Text style={styles.fieldError}>{errors.accountId.message}</Text>
              )}
            </>
          )}

          {/* Current → New balance display */}
          {selectedAccount && (
            <Animated.View
              entering={FadeInDown.duration(300).springify()}
              style={[styles.balancePreview, isDark ? styles.balancePreviewDark : styles.balancePreviewLight]}
            >
              <View style={styles.balancePreviewRow}>
                <Text style={[styles.balancePreviewLabel, isDark && { color: "#64748B" }]}>
                  Current Balance
                </Text>
                <Text style={[styles.balancePreviewValue, isDark && { color: "#94A3B8" }]}>
                  {selectedAccount.currency} {selectedAccount.balance.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.balancePreviewDivider, isDark && { backgroundColor: "rgba(255,255,255,0.06)" }]} />
              <View style={styles.balancePreviewRow}>
                <Text style={[styles.balancePreviewLabel, isDark && { color: "#64748B" }]}>Account</Text>
                <Text style={[styles.balancePreviewType, { color: "#10B981" }]}>{selectedAccount.type}</Text>
              </View>
            </Animated.View>
          )}

          {/* New balance input */}
          <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>New Balance</Text>
          <Controller
            control={control}
            name="balance"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={styles.balanceInputWrapper}>
                  <Text style={[styles.currencyPrefix, isDark && { color: "#64748B" }]}>
                    {selectedAccount?.currency ?? "KES"}
                  </Text>
                  <RNTextInput
                    style={[inputStyle, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
                {errors.balance && <Text style={styles.fieldError}>{errors.balance.message}</Text>}
              </>
            )}
          />

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.submitGradient}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Update Balance</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

export default UpdateBalanceSheet;

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
  accountList: { gap: 8 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  accountRowLight: {
    backgroundColor: "#fff",
    borderColor: "rgba(15,23,42,0.07)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accountRowDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  accountDot: { width: 10, height: 10, borderRadius: 5 },
  accountRowName: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  accountRowType: { fontSize: 11, color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" },
  accountRowBal: { fontSize: 13, fontWeight: "600", color: "#475569" },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  balancePreview: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  balancePreviewLight: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.12)",
  },
  balancePreviewDark: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },
  balancePreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balancePreviewLabel: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  balancePreviewValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  balancePreviewDivider: {
    height: 1,
    backgroundColor: "rgba(15,23,42,0.07)",
    marginVertical: 10,
  },
  balancePreviewType: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  balanceInputWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderColor: "rgba(15,23,42,0.1)",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: "rgba(15,23,42,0.04)",
    textAlignVertical: "center",
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
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 4, fontWeight: "500" },
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
    shadowColor: "#10B981",
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
  successContainer: { alignItems: "center", paddingVertical: 48, gap: 14 },
  successIcon: {
    width: 80, height: 80, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  successSub: { fontSize: 14, color: "#94A3B8", fontWeight: "500" },
});