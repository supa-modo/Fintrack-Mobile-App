// ─── app/(app)/accounts.tsx ──────────────────────────────────────────────────
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { Text } from "../../components/Text";
import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../../services/dashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import { CreateAccountSheet }    from "../(app)/create-account-sheet";
import { UpdateBalanceSheet }    from "../(app)/update-balance-sheet";
import { CreateTransactionSheet } from "../(app)/create-transaction-sheet";

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const ACCOUNT_THEMES: { colors: [string, string]; icon: string }[] = [
  { colors: ["#3B82F6", "#1D4ED8"], icon: "phone-portrait-outline" },
  { colors: ["#10B981", "#059669"], icon: "card-outline" },
  { colors: ["#8B5CF6", "#6D28D9"], icon: "business-outline" },
  { colors: ["#F59E0B", "#D97706"], icon: "cash-outline" },
  { colors: ["#EF4444", "#DC2626"], icon: "trending-up-outline" },
];

// Expandable FAB menu
function FABMenu({
  onAddAccount,
  onUpdateBalance,
  onAddTransaction,
  isDark,
  bottom,
}: {
  onAddAccount: () => void;
  onUpdateBalance: () => void;
  onAddTransaction: () => void;
  isDark: boolean;
  bottom: number;
}) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggle = () => {
    setOpen((v) => !v);
    rotation.value = withSpring(open ? 0 : 1, { damping: 14 });
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 45}deg` }],
  }));

  const ITEMS = [
    { label: "Add Account",     icon: "wallet-outline",  color: "#3B82F6", onPress: onAddAccount },
    { label: "Update Balance",  icon: "refresh-outline", color: "#10B981", onPress: onUpdateBalance },
    { label: "Add Transaction", icon: "receipt-outline", color: "#8B5CF6", onPress: onAddTransaction },
  ];

  return (
    <View style={[styles.fabContainer, { bottom }]} pointerEvents="box-none">
      {/* Menu items */}
      {open && ITEMS.map((item, i) => (
        <Animated.View
          key={item.label}
          entering={FadeInDown.delay(i * 60).springify()}
          style={styles.fabMenuItem}
        >
          <View style={[styles.fabMenuLabel, isDark ? styles.fabMenuLabelDark : styles.fabMenuLabelLight]}>
            <Text style={[styles.fabMenuLabelText, isDark && { color: "#E2E8F0" }]}>{item.label}</Text>
          </View>
          <Pressable
            onPress={() => { setOpen(false); item.onPress(); }}
            style={[styles.fabSmall, { backgroundColor: item.color }]}
          >
            <Ionicons name={item.icon as any} size={18} color="#fff" />
          </Pressable>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <Pressable onPress={toggle} style={styles.fabMain}>
        <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.fabGradient}>
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={26} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [showAddAccount,        setShowAddAccount]        = useState(false);
  const [showUpdateBalance,     setShowUpdateBalance]     = useState(false);
  const [showAddTransaction,    setShowAddTransaction]    = useState(false);
  const [preselectedAccountId,  setPreselectedAccountId] = useState<string | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getSummary,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <View style={[styles.centered, isDark ? styles.bgDark : styles.bgLight]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const accounts     = data?.accounts ?? [];
  const totalBalance = data?.total_balance ?? 0;

  return (
    <View style={[styles.flex, isDark ? styles.bgDark : styles.bgLight]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, isDark && { color: "#F1F5F9" }]}>Accounts</Text>
            <Text style={styles.headerSub}>{accounts.length} linked accounts</Text>
          </View>
          <Pressable
            onPress={() => setShowAddAccount(true)}
            style={[
              styles.addBtn,
              isDark ? { backgroundColor: "rgba(59,130,246,0.2)" } : { backgroundColor: "rgba(59,130,246,0.1)" },
            ]}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </Animated.View>

        {/* Net Worth Banner */}
        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} style={styles.px6}>
          <LinearGradient
            colors={isDark ? ["#0F172A", "#1E293B"] : ["#EFF6FF", "#DBEAFE"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
              styles.netWorthBanner,
              isDark ? { borderColor: "rgba(255,255,255,0.07)" } : { borderColor: "rgba(59,130,246,0.15)" },
            ]}
          >
            <View>
              <Text style={[styles.netWorthLabel, isDark && { color: "#64748B" }]}>Total Net Worth</Text>
              <Text style={[styles.netWorthAmount, isDark ? { color: "#F1F5F9" } : { color: "#0F172A" }]}>
                {formatCurrency(totalBalance)}
              </Text>
            </View>
            <View style={[styles.netWorthIcon, isDark ? { backgroundColor: "rgba(59,130,246,0.15)" } : { backgroundColor: "rgba(59,130,246,0.1)" }]}>
              <Ionicons name="trending-up" size={22} color="#3B82F6" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Account Cards */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={[styles.px6, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Your Accounts</Text>

          {accounts.length === 0 ? (
            <Pressable
              onPress={() => setShowAddAccount(true)}
              style={[styles.emptyCard, isDark ? styles.emptyCardDark : styles.emptyCardLight]}
            >
              <View style={styles.emptyIconBg}>
                <Ionicons name="wallet-outline" size={32} color="#3B82F6" />
              </View>
              <Text style={[styles.emptyTitle, isDark && { color: "#CBD5E1" }]}>No accounts linked yet</Text>
              <Text style={styles.emptySub}>Add your M-Pesa, bank or cash accounts to get started</Text>
              <View style={styles.emptyBtn}>
                <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.emptyBtnGradient}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.emptyBtnText}>Add Account</Text>
                </LinearGradient>
              </View>
            </Pressable>
          ) : (
            <View style={styles.accountsList}>
              {accounts.map((acc, i) => {
                const theme = ACCOUNT_THEMES[i % ACCOUNT_THEMES.length];
                const isPositive = acc.balance >= 0;
                return (
                  <Pressable
                    key={acc.id}
                    onLongPress={() => {
                      setPreselectedAccountId(acc.id);
                      setShowUpdateBalance(true);
                    }}
                    style={({ pressed }) => [
                      styles.accountCard,
                      isDark ? styles.accountCardDark : styles.accountCardLight,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <LinearGradient colors={theme.colors} style={styles.accountCardAccent} />
                    <View style={[styles.accountIconBg, { backgroundColor: `${theme.colors[0]}20` }]}>
                      <Ionicons name={theme.icon as any} size={20} color={theme.colors[0]} />
                    </View>
                    <View style={styles.accountCardInfo}>
                      <Text style={[styles.accountCardName, isDark && { color: "#E2E8F0" }]}>{acc.name}</Text>
                      <View style={styles.accountCardMeta}>
                        <View style={[styles.accountTypePill, { backgroundColor: `${theme.colors[0]}18` }]}>
                          <Text style={[styles.accountTypeText, { color: theme.colors[0] }]}>{acc.type}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.accountBalanceCol}>
                      <Text style={[styles.accountBalance, isDark ? { color: "#F1F5F9" } : { color: "#0F172A" }]}>
                        {formatCurrency(acc.balance, acc.currency)}
                      </Text>
                      <View style={styles.accountBalanceTrend}>
                        <Ionicons name={isPositive ? "trending-up" : "trending-down"} size={12} color={isPositive ? "#10B981" : "#EF4444"} />
                        <Text style={[styles.accountBalanceTrendText, { color: isPositive ? "#10B981" : "#EF4444" }]}>
                          {isPositive ? "Active" : "Overdraft"}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={isDark ? "#334155" : "#CBD5E1"} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={[styles.px6, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: "add-circle-outline",    label: "Add Account",     color: "#3B82F6", onPress: () => setShowAddAccount(true) },
              { icon: "swap-horizontal-outline",label: "Transfer",        color: "#8B5CF6", onPress: () => setShowAddTransaction(true) },
              { icon: "refresh-outline",        label: "Update Balance",  color: "#10B981", onPress: () => setShowUpdateBalance(true) },
              { icon: "download-outline",       label: "Export",          color: "#F59E0B", onPress: () => {} },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickAction,
                  isDark ? styles.quickActionDark : styles.quickActionLight,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, isDark && { color: "#CBD5E1" }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <FABMenu
        isDark={isDark}
        bottom={insets.bottom + 88}
        onAddAccount={() => setShowAddAccount(true)}
        onUpdateBalance={() => setShowUpdateBalance(true)}
        onAddTransaction={() => setShowAddTransaction(true)}
      />

      {/* Modals */}
      <CreateAccountSheet     visible={showAddAccount}     onClose={() => setShowAddAccount(false)} />
      <UpdateBalanceSheet
        visible={showUpdateBalance}
        onClose={() => { setShowUpdateBalance(false); setPreselectedAccountId(undefined); }}
        preselectedAccountId={preselectedAccountId}
      />
      <CreateTransactionSheet visible={showAddTransaction} onClose={() => setShowAddTransaction(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bgDark:   { backgroundColor: "#020B18" },
  bgLight:  { backgroundColor: "#F1F5F9" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  px6: { paddingHorizontal: 24 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  addBtnText: { color: "#3B82F6", fontWeight: "700", fontSize: 14 },

  netWorthBanner: { borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1 },
  netWorthLabel: { fontSize: 12, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  netWorthAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  netWorthIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },

  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3, marginBottom: 14 },

  accountsList: { gap: 10 },
  accountCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, paddingLeft: 18, gap: 12, overflow: "hidden" },
  accountCardDark:  { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  accountCardLight: { backgroundColor: "#FFFFFF", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  accountCardAccent: { position: "absolute", left: 0, top: 10, bottom: 10, width: 4, borderRadius: 2 },
  accountIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  accountCardInfo: { flex: 1 },
  accountCardName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 5 },
  accountCardMeta: { flexDirection: "row", alignItems: "center" },
  accountTypePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  accountTypeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  accountBalanceCol: { alignItems: "flex-end", gap: 4 },
  accountBalance: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  accountBalanceTrend: { flexDirection: "row", alignItems: "center", gap: 3 },
  accountBalanceTrendText: { fontSize: 11, fontWeight: "600" },

  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickAction: { width: "47%", borderRadius: 18, padding: 18, alignItems: "center", gap: 10 },
  quickActionDark:  { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  quickActionLight: { backgroundColor: "#FFFFFF", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 13, fontWeight: "600", color: "#0F172A" },

  emptyCard: { borderRadius: 24, padding: 32, alignItems: "center", gap: 8 },
  emptyCardDark:  { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  emptyCardLight: { backgroundColor: "#FFFFFF", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(59,130,246,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#94A3B8", fontWeight: "500", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  emptyBtn: { borderRadius: 14, overflow: "hidden" },
  emptyBtnGradient: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // FAB
  fabContainer: { position: "absolute", right: 24, alignItems: "flex-end", gap: 12 },
  fabMenuItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  fabMenuLabel: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  fabMenuLabelLight: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  fabMenuLabelDark:  { backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  fabMenuLabelText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  fabSmall: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  fabMain: {
    borderRadius: 30,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
});