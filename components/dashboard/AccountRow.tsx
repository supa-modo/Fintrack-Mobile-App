// ─── components/dashboard/AccountRow.tsx ─────────────────────────────────────
// Vertical account list row with logo placeholder, balance, type badge.

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "../Text";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Colour palette per account type
const TYPE_CONFIG: Record<
  string,
  { colors: [string, string]; icon: string; label: string }
> = {
  mobile_money: { colors: ["#10B981", "#059669"], icon: "phone-portrait-outline", label: "Mobile" },
  bank:         { colors: ["#3B82F6", "#1D4ED8"], icon: "business-outline",       label: "Bank"   },
  cash:         { colors: ["#F59E0B", "#D97706"], icon: "cash-outline",            label: "Cash"   },
  investment:   { colors: ["#8B5CF6", "#6D28D9"], icon: "trending-up-outline",    label: "Invest" },
  crypto:       { colors: ["#EF4444", "#DC2626"], icon: "logo-bitcoin",            label: "Crypto" },
  other:        { colors: ["#64748B", "#475569"], icon: "ellipsis-horizontal-outline", label: "Other" },
};

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

export function AccountRow({
  account,
  index,
  isDark,
  isLast,
  onPress,
}: {
  account: { id: string; name: string; type: string; balance: number; currency?: string };
  index: number;
  isDark: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const cfg = TYPE_CONFIG[account.type] ?? TYPE_CONFIG.other;

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          rowStyles.row,
          pressed && { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)" },
        ]}
      >
        {/* ── Left: icon avatar ── */}
        <LinearGradient
          colors={cfg.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={rowStyles.avatar}
        >
          <Ionicons name={cfg.icon as any} size={18} color="#fff" />
        </LinearGradient>

        {/* ── Middle: name + type badge ── */}
        <View style={rowStyles.mid}>
          <Text
            style={[rowStyles.accName, isDark && { color: "#F1F5F9" }]}
            numberOfLines={1}
          >
            {account.name}
          </Text>
          <View style={[rowStyles.typeBadge, { backgroundColor: `${cfg.colors[0]}18` }]}>
            <Text style={[rowStyles.typeText, { color: cfg.colors[0] }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* ── Right: balance + chevron ── */}
        <View style={rowStyles.right}>
          <Text style={[rowStyles.balance, isDark && { color: "#F1F5F9" }]} numberOfLines={1}>
            {account.currency ?? "KES"} {formatCurrency(account.balance)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isDark ? "#334155" : "#CBD5E1"}
            style={{ marginTop: 1 }}
          />
        </View>
      </Pressable>

      {/* Separator */}
      {!isLast && (
        <View
          style={[
            rowStyles.sep,
            { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)" },
          ]}
        />
      )}
    </>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mid: {
    flex: 1,
    gap: 5,
  },
  accName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.1,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
    maxWidth: 140,
  },
  balance: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
  },
  sep: {
    height: 1,
    marginHorizontal: 16,
  },
});

// ─── New styles to ADD to your dashboard StyleSheet ──────────────────────────
// (merge these into the existing styles object in index.tsx)
export const extraDashboardStyles = StyleSheet.create({
  accountsList: {
    borderRadius: 60,
    overflow: "hidden",
  },
  trendSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 12,
  },
});