// ─── app/(app)/index.tsx — Dashboard with Quick Actions ─────────────────────
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Text } from "../../components/Text";
import { useQuery } from "@tanstack/react-query";
import { getSummary, getSpending } from "../../services/dashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import { CreateAccountSheet }     from "../(app)/create-account-sheet";
import { CreateTransactionSheet } from "../(app)/create-transaction-sheet";
import { UpdateBalanceSheet }     from "../(app)/update-balance-sheet";

const { width } = Dimensions.get("window");

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}
function formatCompact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(0);
}

const ACCOUNT_COLORS: [string, string][] = [
  ["#3B82F6", "#1D4ED8"],
  ["#10B981", "#059669"],
  ["#8B5CF6", "#6D28D9"],
  ["#F59E0B", "#D97706"],
  ["#EF4444", "#DC2626"],
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Modal state ──
  const [showAddAccount,     setShowAddAccount]     = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showUpdateBalance,  setShowUpdateBalance]  = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<"income" | "expense" | "transfer">("expense");

  const openTx = (type: "income" | "expense" | "transfer" = "expense") => {
    setTxDefaultType(type);
    setShowAddTransaction(true);
  };

  const {
    data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary,
  } = useQuery({ queryKey: ["dashboard", "summary"], queryFn: getSummary });

  const {
    data: spending, refetch: refetchSpending,
  } = useQuery({ queryKey: ["dashboard", "spending"], queryFn: () => getSpending() });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchSpending()]);
    setRefreshing(false);
  };

  if (summaryLoading && !summary) {
    return (
      <View style={[styles.centered, isDark ? styles.bgDark : styles.bgLight]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (summaryError) {
    return (
      <View style={[styles.centered, styles.px6, isDark ? styles.bgDark : styles.bgLight]}>
        <Ionicons name="cloud-offline-outline" size={48} color={isDark ? "#475569" : "#CBD5E1"} />
        <Text style={[styles.errorTitle, isDark && { color: "#CBD5E1" }]}>Unable to load dashboard</Text>
        <Pressable onPress={() => refetchSummary()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const totalBalance  = summary?.total_balance ?? 0;
  const accounts      = summary?.accounts ?? [];
  const monthly       = summary?.monthly_summary ?? { income: 0, expense: 0, net: 0 };
  const monthlyTrend  = spending?.monthly_trend ?? [];
  const spendingProgress = monthly.income > 0 ? Math.min(monthly.expense / monthly.income, 1) : 0;

  const QUICK_ACTIONS = [
    {
      icon: "add-circle-outline" as const,
      label: "Add Account",
      sublabel: "Link a new account",
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.1)",
      onPress: () => setShowAddAccount(true),
    },
    {
      icon: "arrow-up-circle-outline" as const,
      label: "Add Expense",
      sublabel: "Record a payment",
      color: "#EF4444",
      bg: "rgba(239,68,68,0.1)",
      onPress: () => openTx("expense"),
    },
    {
      icon: "arrow-down-circle-outline" as const,
      label: "Add Income",
      sublabel: "Log earnings",
      color: "#10B981",
      bg: "rgba(16,185,129,0.1)",
      onPress: () => openTx("income"),
    },
    {
      icon: "refresh-circle-outline" as const,
      label: "Update Balance",
      sublabel: "Reconcile account",
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.1)",
      onPress: () => setShowUpdateBalance(true),
    },
  ];

  return (
    <>
      <ScrollView
        style={isDark ? styles.bgDark : styles.bgLight}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDark && { color: "#94A3B8" }]}>Good morning 👋</Text>
            <Text style={[styles.headerTitle, isDark && { color: "#F1F5F9" }]}>Your Finances</Text>
          </View>
          <Pressable
            style={[
              styles.notifBtn,
              isDark ? { backgroundColor: "rgba(255,255,255,0.07)" } : { backgroundColor: "rgba(15,23,42,0.06)" },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={isDark ? "#94A3B8" : "#475569"} />
            <View style={styles.notifDot} />
          </Pressable>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} style={styles.cardWrapper}>
          <LinearGradient
            colors={["#1E40AF", "#3B82F6", "#60A5FA"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.cardCircle1} />
            <View style={styles.cardCircle2} />
            <View style={styles.cardCircleSm} />
            <View style={styles.cardTop}>
              <View style={styles.chip}>
                <LinearGradient colors={["#FBBF24", "#F59E0B"]} style={styles.chipGradient} />
              </View>
              <View style={styles.cardBrandRow}>
                <View style={styles.cardBrandDot1} />
                <View style={styles.cardBrandDot2} />
              </View>
            </View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardMetaLabel}>Accounts</Text>
                <Text style={styles.cardMetaValue}>{accounts.length}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View>
                <Text style={styles.cardMetaLabel}>Net This Month</Text>
                <Text style={[styles.cardMetaValue, { color: monthly.net >= 0 ? "#A7F3D0" : "#FCA5A5" }]}>
                  {monthly.net >= 0 ? "+" : ""}{formatCurrency(monthly.net)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── QUICK ACTIONS ── */}
        <Animated.View entering={FadeInDown.duration(600).delay(150).springify()} style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  isDark ? styles.quickCardDark : styles.quickCardLight,
                  pressed && { opacity: 0.78, transform: [{ scale: 0.96 }] },
                ]}
              >
                <LinearGradient colors={[action.color + "25", action.color + "08"]} style={styles.quickIconBg}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </LinearGradient>
                <Text style={[styles.quickCardLabel, isDark && { color: "#E2E8F0" }]}>{action.label}</Text>
                <Text style={styles.quickCardSub}>{action.sublabel}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* This Month */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>This Month</Text>
          <View style={styles.statsRow}>
            {[
              { label: "Income",   value: monthly.income,  color: "#10B981", icon: "arrow-down" as const },
              { label: "Expenses", value: monthly.expense, color: "#EF4444", icon: "arrow-up"   as const },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, isDark ? styles.statCardDark : styles.statCardLight]}>
                <View style={[styles.statIconBg, { backgroundColor: s.color + "1A" }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statLabel, isDark && { color: "#94A3B8" }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>KES {formatCompact(s.value)}</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statBarFill, { width: "100%", backgroundColor: s.color }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Progress */}
          <View style={[styles.progressCard, isDark ? styles.statCardDark : styles.statCardLight]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, isDark && { color: "#E2E8F0" }]}>Spending vs Income</Text>
              <Text
                style={[
                  styles.progressPercent,
                  { color: spendingProgress > 0.8 ? "#EF4444" : spendingProgress > 0.5 ? "#F59E0B" : "#10B981" },
                ]}
              >
                {Math.round(spendingProgress * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={spendingProgress > 0.8 ? ["#EF4444","#DC2626"] : spendingProgress > 0.5 ? ["#F59E0B","#D97706"] : ["#10B981","#059669"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${spendingProgress * 100}%` as any }]}
              />
            </View>
            <Text style={[styles.progressSub, isDark && { color: "#64748B" }]}>
              {spendingProgress < 0.5 ? "Great spending discipline 🎉" : spendingProgress < 0.8 ? "Watch your spending 👀" : "Over budget this month ⚠️"}
            </Text>
          </View>
        </Animated.View>

        {/* Accounts Preview */}
        <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Accounts</Text>
            <Pressable style={styles.seeAllBtn} onPress={() => setShowAddAccount(true)}>
              <Ionicons name="add" size={14} color="#3B82F6" />
              <Text style={styles.seeAllText}>Add new</Text>
            </Pressable>
          </View>
          {accounts.length === 0 ? (
            <Pressable
              onPress={() => setShowAddAccount(true)}
              style={[styles.emptyCard, isDark ? styles.statCardDark : styles.statCardLight]}
            >
              <Ionicons name="wallet-outline" size={32} color={isDark ? "#475569" : "#CBD5E1"} />
              <Text style={[styles.emptyText, isDark && { color: "#64748B" }]}>Tap to add your first account</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {accounts.map((acc, i) => (
                <LinearGradient key={acc.id} colors={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.accountPill}>
                  <View style={styles.accountPillTop}>
                    <View style={styles.accountIconCircle}>
                      <Ionicons name="card-outline" size={14} color="#fff" />
                    </View>
                    <Text style={styles.accountType}>{acc.type}</Text>
                  </View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountBalance}>{formatCurrency(acc.balance, acc.currency)}</Text>
                </LinearGradient>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Spending Trend */}
        {monthlyTrend.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Spending Trend</Text>
            <View style={[styles.trendCard, isDark ? styles.statCardDark : styles.statCardLight]}>
              {(() => {
                const last6 = monthlyTrend.slice(-6);
                const maxVal = Math.max(...last6.map((i) => i.total), 1);
                return last6.map((item, i) => (
                  <View key={i} style={styles.trendRow}>
                    <Text style={[styles.trendMonth, isDark && { color: "#94A3B8" }]}>
                      {new Date(item.month).toLocaleDateString("en-KE", { month: "short" })}
                    </Text>
                    <View style={styles.trendBarTrack}>
                      <LinearGradient
                        colors={["#3B82F6", "#1D4ED8"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.trendBarFill, { width: `${(item.total / maxVal) * 100}%` as any }]}
                      />
                    </View>
                    <Text style={[styles.trendAmount, isDark && { color: "#CBD5E1" }]}>{formatCompact(item.total)}</Text>
                  </View>
                ));
              })()}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <CreateAccountSheet     visible={showAddAccount}     onClose={() => setShowAddAccount(false)} />
      <CreateTransactionSheet visible={showAddTransaction} onClose={() => setShowAddTransaction(false)} defaultType={txDefaultType} />
      <UpdateBalanceSheet     visible={showUpdateBalance}  onClose={() => setShowUpdateBalance(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bgDark:  { backgroundColor: "#020B18" },
  bgLight: { backgroundColor: "#F1F5F9" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  px6: { paddingHorizontal: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 13, color: "#64748B", fontWeight: "500", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#020B18" },
  cardWrapper: { marginHorizontal: 24, marginBottom: 28, borderRadius: 24, shadowColor: "#1D4ED8", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 16 },
  balanceCard: { borderRadius: 24, padding: 24, overflow: "hidden", minHeight: 200 },
  cardCircle1: { position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.08)" },
  cardCircle2: { position: "absolute", bottom: -80, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)" },
  cardCircleSm: { position: "absolute", top: 40, right: 80, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  chip: { width: 38, height: 28, borderRadius: 6, overflow: "hidden" },
  chipGradient: { flex: 1, opacity: 0.9 },
  cardBrandRow: { flexDirection: "row", alignItems: "center" },
  cardBrandDot1: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.5)" },
  cardBrandDot2: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", marginLeft: -10 },
  balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  balanceAmount: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1, marginBottom: 28 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 16 },
  cardMetaLabel: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  cardMetaValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  cardDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Quick Actions
  sectionWrapper: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3, marginBottom: 14 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 14 },
  seeAllText: { fontSize: 13, color: "#3B82F6", fontWeight: "600" },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: {
    width: "47%",
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  quickCardLight: {
    backgroundColor: "#fff",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  quickCardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickCardLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  quickCardSub: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 20, padding: 18 },
  statCardDark:  { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statCardLight: { backgroundColor: "#FFFFFF", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  statIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginBottom: 10 },
  statBar: { height: 3, borderRadius: 2, backgroundColor: "rgba(148,163,184,0.2)", overflow: "hidden" },
  statBarFill: { height: 3, borderRadius: 2 },
  progressCard: { borderRadius: 20, padding: 18 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  progressPercent: { fontSize: 16, fontWeight: "800" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(148,163,184,0.2)", overflow: "hidden", marginBottom: 10 },
  progressFill: { height: 8, borderRadius: 4 },
  progressSub: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
  accountPill: { borderRadius: 20, padding: 18, width: 170, overflow: "hidden" },
  accountPillTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  accountIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  accountType: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  accountName: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  accountBalance: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  trendCard: { borderRadius: 20, padding: 20, gap: 12 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trendMonth: { fontSize: 12, fontWeight: "600", color: "#64748B", width: 32 },
  trendBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(148,163,184,0.2)", overflow: "hidden" },
  trendBarFill: { height: 6, borderRadius: 3 },
  trendAmount: { fontSize: 12, fontWeight: "700", color: "#0F172A", width: 44, textAlign: "right" },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, color: "#94A3B8", fontWeight: "500" },
  errorTitle: { fontSize: 16, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});