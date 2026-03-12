// ─── components/sheets/CreateTransactionSheet.tsx ────────────────────────────

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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { BottomSheet } from "../(app)/bottom-sheet";
import { createTransaction, createTransfer } from "../../services/transactions";
import { getAccounts } from "../../services/accounts";
import { getCategories } from "../../services/categories";

const schema = z.object({
  type:            z.enum(["income", "expense", "transfer"]),
  account_id:      z.string().optional(),
  from_account_id: z.string().optional(),
  to_account_id:   z.string().optional(),
  amount:          z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Enter a valid positive amount",
  }),
  category_id:  z.string().optional(),
  description:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TX_TYPES = [
  { value: "expense",  label: "Expense",  icon: "arrow-up-circle",   color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  { value: "income",   label: "Income",   icon: "arrow-down-circle", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { value: "transfer", label: "Transfer", icon: "swap-horizontal",   color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
] as const;

const ACCOUNT_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: "income" | "expense" | "transfer";
}

export function CreateTransactionSheet({ visible, onClose, defaultType = "expense" }: Props) {
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts, enabled: visible });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories, enabled: visible });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories  = categories.filter((c) => c.type === "income");

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        type: defaultType, account_id: "", from_account_id: "",
        to_account_id: "", amount: "", category_id: "", description: "",
      },
    });

  const type = watch("type");
  const activeTxType = TX_TYPES.find((t) => t.value === type) ?? TX_TYPES[0];

  const handleClose = () => {
    reset({ type: defaultType, account_id: "", from_account_id: "", to_account_id: "", amount: "", category_id: "", description: "" });
    setApiError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const amount = parseFloat(data.amount);
    try {
      if (data.type === "transfer") {
        if (!data.from_account_id || !data.to_account_id) { setApiError("Select both accounts"); return; }
        if (data.from_account_id === data.to_account_id)  { setApiError("Accounts must differ"); return; }
        await createTransfer({
          from_account_id: data.from_account_id,
          to_account_id:   data.to_account_id,
          amount,
          description: data.description?.trim() || undefined,
        });
      } else {
        if (!data.account_id) { setApiError("Select an account"); return; }
        await createTransaction({
          type:        data.type,
          account_id:  data.account_id,
          amount,
          category_id: data.category_id || undefined,
          description: data.description?.trim() || undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setSuccess(true);
      setTimeout(() => handleClose(), 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.error
          : "Failed to save transaction";
      setApiError(msg ?? "Failed to save transaction");
    }
  };

  const inputStyle = [styles.input, isDark ? styles.inputDark : styles.inputLight];
  const cats = type === "expense" ? expenseCategories : incomeCategories;

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Add Transaction"
      subtitle="Record income, expense or transfer"
      icon="receipt-outline"
      accentColors={[activeTxType.color, activeTxType.color]}
    >
      {success ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.successContainer}>
          <LinearGradient colors={[activeTxType.color, activeTxType.color]} style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.successTitle, isDark && { color: "#F1F5F9" }]}>Transaction Saved!</Text>
          <Text style={styles.successSub}>Your {type} has been recorded.</Text>
        </Animated.View>
      ) : (
        <>
          {apiError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          {/* Type Selector */}
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                {TX_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => onChange(t.value)}
                    style={({ pressed }) => [
                      styles.typeBtn,
                      isDark ? styles.typeBtnDark : styles.typeBtnLight,
                      value === t.value && { backgroundColor: t.bg, borderColor: t.color, borderWidth: 1.5 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={18}
                      color={value === t.value ? t.color : isDark ? "#475569" : "#94A3B8"}
                    />
                    <Text
                      style={[
                        styles.typeBtnLabel,
                        value === t.value ? { color: t.color, fontWeight: "700" } : { color: isDark ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          {/* Amount */}
          <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Amount</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={styles.amountWrapper}>
                  <LinearGradient
                    colors={[activeTxType.color + "22", activeTxType.color + "08"]}
                    style={styles.amountPrefix}
                  >
                    <Text style={[styles.amountPrefixText, { color: activeTxType.color }]}>KES</Text>
                  </LinearGradient>
                  <RNTextInput
                    style={[inputStyle, styles.amountInput]}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
                {errors.amount && <Text style={styles.fieldError}>{errors.amount.message}</Text>}
              </>
            )}
          />

          {/* Account(s) */}
          {type === "transfer" ? (
            <Animated.View entering={FadeIn.duration(200)} key="transfer-accounts">
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>From Account</Text>
              <Controller
                control={control}
                name="from_account_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.accountChips}>
                    {accounts.map((acc, i) => {
                      const col = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => onChange(acc.id)}
                          style={[
                            styles.chip,
                            isDark ? styles.chipDark : styles.chipLight,
                            value === acc.id && { borderColor: col, borderWidth: 1.5, backgroundColor: col + "15" },
                          ]}
                        >
                          <View style={[styles.chipDot, { backgroundColor: col }]} />
                          <Text style={[styles.chipText, isDark && { color: "#CBD5E1" }, value === acc.id && { color: col }]}>
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>To Account</Text>
              <Controller
                control={control}
                name="to_account_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.accountChips}>
                    {accounts.map((acc, i) => {
                      const col = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => onChange(acc.id)}
                          style={[
                            styles.chip,
                            isDark ? styles.chipDark : styles.chipLight,
                            value === acc.id && { borderColor: col, borderWidth: 1.5, backgroundColor: col + "15" },
                          ]}
                        >
                          <View style={[styles.chipDot, { backgroundColor: col }]} />
                          <Text style={[styles.chipText, isDark && { color: "#CBD5E1" }, value === acc.id && { color: col }]}>
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} key="single-account">
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Account</Text>
              <Controller
                control={control}
                name="account_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.accountChips}>
                    {accounts.map((acc, i) => {
                      const col = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => onChange(acc.id)}
                          style={[
                            styles.chip,
                            isDark ? styles.chipDark : styles.chipLight,
                            value === acc.id && { borderColor: col, borderWidth: 1.5, backgroundColor: col + "15" },
                          ]}
                        >
                          <View style={[styles.chipDot, { backgroundColor: col }]} />
                          <Text style={[styles.chipText, isDark && { color: "#CBD5E1" }, value === acc.id && { color: col }]}>
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Animated.View>
          )}

          {/* Category (income/expense only) */}
          {type !== "transfer" && cats.length > 0 && (
            <>
              <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Category (optional)</Text>
              <Controller
                control={control}
                name="category_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.accountChips}>
                    {cats.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => onChange(value === cat.id ? "" : cat.id)}
                        style={[
                          styles.chip,
                          isDark ? styles.chipDark : styles.chipLight,
                          value === cat.id && {
                            borderColor: activeTxType.color,
                            borderWidth: 1.5,
                            backgroundColor: activeTxType.color + "15",
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, isDark && { color: "#CBD5E1" }, value === cat.id && { color: activeTxType.color }]}>
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              />
            </>
          )}

          {/* Description */}
          <Text style={[styles.label, isDark && { color: "#CBD5E1" }]}>Note (optional)</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <RNTextInput
                style={inputStyle}
                placeholder="e.g. Lunch with team, Monthly rent…"
                placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
              />
            )}
          />

          {/* Submit */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[activeTxType.color, activeTxType.color + "CC"]}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={activeTxType.icon as any} size={18} color="#fff" />
                  <Text style={styles.submitText}>Save {activeTxType.label}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

export default CreateTransactionSheet;

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
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  typeBtnLight: { backgroundColor: "#fff", borderColor: "rgba(15,23,42,0.07)" },
  typeBtnDark:  { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.07)" },
  typeBtnLabel: { fontSize: 13, fontWeight: "600" },
  amountWrapper: { flexDirection: "row", alignItems: "stretch" },
  amountPrefix: {
    paddingHorizontal: 14,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderColor: "rgba(15,23,42,0.1)",
  },
  amountPrefixText: { fontSize: 13, fontWeight: "800" },
  amountInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    fontSize: 22,
    fontWeight: "800",
  },
  accountChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipLight: { backgroundColor: "#fff", borderColor: "rgba(15,23,42,0.08)" },
  chipDark:  { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)" },
  chipDot:   { width: 7, height: 7, borderRadius: 3.5 },
  chipText:  { fontSize: 13, fontWeight: "600", color: "#475569" },
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