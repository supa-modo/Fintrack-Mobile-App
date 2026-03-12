// ─── app/(app)/index.tsx — Dashboard ─────────────────────────────────────────
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
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import { CreateAccountSheet } from "../(app)/create-account-sheet";
import { CreateTransactionSheet } from "../(app)/create-transaction-sheet";
import { UpdateBalanceSheet } from "../(app)/update-balance-sheet";

const { width } = Dimensions.get("window");

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}
function formatCompact(amount: number) {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
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

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
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
          <View style={styles.retryBtnIcon}>
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          </View>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const totalBalance = summary?.total_balance ?? 0;
  const accounts = summary?.accounts ?? [];
  const monthly = summary?.monthly_summary ?? { income: 0, expense: 0, net: 0 };
  const monthlyTrend = spending?.monthly_trend ?? [];
  const spendingProgress = monthly.income > 0 ? Math.min(monthly.expense / monthly.income, 1) : 0;

  // ── Quick action definitions (3 items) ──
  const QUICK_ACTIONS = [
    {
      icon: "wallet" as const,
      label: "Add Account",
      color: "#3B82F6",
      onPress: () => setShowAddAccount(true),
    },
    {
      icon: "swap-horizontal-bold" as const,
      label: "New Transaction",
      color: "#8B5CF6",
      onPress: () => openTx("expense"),
    },
    {
      icon: "update" as const,
      label: "Update Balance",
      color: "#10B981",
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
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDark && { color: "#64748B" }]}>Good morning 👋</Text>
            <Text style={[styles.headerTitle, isDark && { color: "#F1F5F9" }]}>Your Finances</Text>
          </View>

          {/* Right icon cluster */}
          <View style={styles.headerRight}>
            {/* Log out */}
            <Pressable
              style={[
                styles.headerIconBtn,
                isDark ? styles.headerIconBtnDark : styles.headerIconBtnLight,
              ]}
            >
              <FontAwesome name="sign-out" size={20} color={isDark ? "#94A3B8" : "#475569"} />
            </Pressable>

            {/* Notifications */}
            <Pressable
              style={[
                styles.headerIconBtn,
                isDark ? styles.headerIconBtnDark : styles.headerIconBtnLight,
              ]}
            >
              <Ionicons name="notifications-outline" size={19} color={isDark ? "#94A3B8" : "#475569"} />
              <View style={[styles.notifDot, isDark && { borderColor: "#020B18" }]} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Balance Card ── */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.cardWrapper}>
          <LinearGradient
            colors={["#1E3FAE", "#2563EB", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Decorative circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circleSm} />

            {/* ── Card top row: chip  +  account count ── */}
            <View style={styles.cardTopRow}>

              <View style={styles.cardBrandRow}>
                <View style={[styles.cardBrandDot1, { backgroundColor: "rgb(220 38 38)" }]} />
                <View style={[styles.cardBrandDot2, { backgroundColor: "rgb(250 204 21 / 0.8)" }]} className="bg-yellow-400/80" />
              </View>

              {/* Account count badge */}
              <View style={styles.accountBadge}>
                <Ionicons name="card-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.accountBadgeText}>
                  {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
                </Text>
              </View>
            </View>

            {/* Balance label + amount */}
            <Text style={styles.balanceLabel}>Total Account Balances</Text>
            <View style={styles.balanceAmountRow}>
              <Text style={styles.balanceCurrency}>KES&nbsp;</Text>
              <Text
                style={styles.balanceAmountText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                allowFontScaling
              >
                {formatCurrency(totalBalance)}
              </Text>
            </View>

            {/* ── Card bottom: NET + Income + Expenses ── */}
            <View style={styles.cardBottomRow}>
              {/* Net */}
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>Net this Month</Text>
                <Text
                  style={[
                    styles.cardStatValue,
                    { color: monthly.net >= 0 ? "#A7F3D0" : "#FCA5A5" },
                  ]}
                >
                  {monthly.net >= 0 ? "+" : ""}
                  {formatCurrency(monthly.net)}
                </Text>
              </View>

              <View style={styles.cardStatDivider} />

              {/* Income */}
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>Income</Text>
                <View style={styles.cardStatInlineRow}>
                  <View style={[styles.arrowCircle, { backgroundColor: "rgba(16,185,129,0.25)" }]}>
                    <Ionicons name="arrow-down" size={10} color="#A7F3D0" />
                  </View>
                  <Text style={[styles.cardStatValue, { color: "#A7F3D0" }]}>
                    {formatCompact(monthly.income)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardStatDivider} />

              {/* Expenses */}
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>Expenses</Text>
                <View style={styles.cardStatInlineRow}>
                  <View style={[styles.arrowCircle, { backgroundColor: "rgba(239,68,68,0.25)" }]}>
                    <Ionicons name="arrow-up" size={10} color="#FCA5A5" />
                  </View>
                  <Text style={[styles.cardStatValue, { color: "#FCA5A5" }]}>
                    {formatCompact(monthly.expense)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Quick Actions (3-column) ── */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)} style={styles.sectionWrapper}>
         <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  isDark ? styles.quickCardDark : styles.quickCardLight,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                ]}
              >
                {/* Icon */}
                <View style={[styles.quickIconWrap]}>
                  <MaterialCommunityIcons name={action.icon} size={30} color={action.color} />
                </View>
                {/* Label */}
                <Text style={[styles.quickLabel, isDark && { color: "#CBD5E1" }]} numberOfLines={2}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── Spending progress ── */}
        <Animated.View entering={FadeInDown.duration(450).delay(160)} style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>This Month</Text>
          <View style={[styles.progressCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, isDark && { color: "#E2E8F0" }]}>
                Spending vs Income
              </Text>
              <Text
                style={[
                  styles.progressPercent,
                  {
                    color:
                      spendingProgress > 0.8
                        ? "#EF4444"
                        : spendingProgress > 0.5
                          ? "#F59E0B"
                          : "#10B981",
                  },
                ]}
              >
                {Math.round(spendingProgress * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={
                  spendingProgress > 0.8
                    ? ["#EF4444", "#DC2626"]
                    : spendingProgress > 0.5
                      ? ["#F59E0B", "#D97706"]
                      : ["#10B981", "#059669"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${Math.max(spendingProgress * 100, 2)}%` as any },
                ]}
              />
            </View>
            <Text style={[styles.progressHint, isDark && { color: "#475569" }]}>
              {spendingProgress < 0.5
                ? "Great discipline this month 🎉"
                : spendingProgress < 0.8
                  ? "Watch your spending 👀"
                  : "Over budget this month ⚠️"}
            </Text>
          </View>
        </Animated.View>

        {/* ── Accounts preview ── */}
        <Animated.View entering={FadeInDown.duration(450).delay(200)} style={styles.sectionWrapper}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Accounts</Text>
            <Pressable onPress={() => setShowAddAccount(true)} style={styles.seeAllBtn}>
              <Ionicons name="add" size={13} color="#3B82F6" />
              <Text style={styles.seeAllText}>Add</Text>
            </Pressable>
          </View>

          {accounts.length === 0 ? (
            <Pressable
              onPress={() => setShowAddAccount(true)}
              style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}
            >
              <Ionicons name="wallet-outline" size={30} color={isDark ? "#334155" : "#CBD5E1"} />
              <Text style={[styles.emptyText, isDark && { color: "#475569" }]}>
                Tap to add your first account
              </Text>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {accounts.map((acc, i) => (
                <LinearGradient
                  key={acc.id}
                  colors={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accountPill}
                >
                  <View style={styles.accountPillTop}>
                    <View style={styles.accountIconCircle}>
                      <Ionicons name="card-outline" size={13} color="#fff" />
                    </View>
                    <Text style={styles.accountType}>{acc.type}</Text>
                  </View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(acc.balance)}
                  </Text>
                </LinearGradient>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Spending trend ── */}
        {monthlyTrend.length > 0 && (
          <Animated.View entering={FadeInDown.duration(450).delay(240)} style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, isDark && { color: "#F1F5F9" }]}>Spending Trend</Text>
            <View style={[styles.trendCard, isDark ? styles.cardDark : styles.cardLight]}>
              {(() => {
                const last6 = monthlyTrend.slice(-6);
                const maxVal = Math.max(...last6.map((i) => i.total), 1);
                return last6.map((item, i) => (
                  <View key={i} style={styles.trendRow}>
                    <Text style={[styles.trendMonth, isDark && { color: "#64748B" }]}>
                      {new Date(item.month).toLocaleDateString("en-KE", { month: "short" })}
                    </Text>
                    <View style={styles.trendBarTrack}>
                      <LinearGradient
                        colors={["#3B82F6", "#1D4ED8"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.trendBarFill,
                          { width: `${(item.total / maxVal) * 100}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={[styles.trendAmt, isDark && { color: "#CBD5E1" }]}>
                      {formatCompact(item.total)}
                    </Text>
                  </View>
                ));
              })()}
            </View>
          </Animated.View>
        )}
      </ScrollView >

      {/* ── Modals ── */}
      < CreateAccountSheet
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)
        }
      />
      < CreateTransactionSheet
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        defaultType={txDefaultType}
      />
      <UpdateBalanceSheet
        visible={showUpdateBalance}
        onClose={() => setShowUpdateBalance(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bgDark: { backgroundColor: "#020B18" },
  bgLight: { backgroundColor: "#F1F5F9" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  px6: { paddingHorizontal: 24 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  greeting: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerIconBtnLight: { backgroundColor: "rgba(15,23,42,0.06)" },
  headerIconBtnDark: { backgroundColor: "rgba(255,255,255,0.07)" },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },

  // ── Balance Card ──────────────────────────────────────────────────────────
  cardWrapper: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 14,
  },
  balanceCard: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginHorizontal: -4,
    overflow: "hidden",
    minHeight: 190,
  },

  // Decorative bg circles
  circle1: { position: "absolute", top: -70, right: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(255,255,255,0.07)" },
  circle2: { position: "absolute", bottom: -70, left: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.05)" },
  circleSm: { position: "absolute", top: 30, right: 80, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" },

  // Chip
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },


  cardBrandRow: { flexDirection: "row", alignItems: "center" },
  cardBrandDot1: { width: 28, height: 28, borderRadius: 14 },
  cardBrandDot2: { width: 28, height: 28, borderRadius: 14, marginLeft: -13 },

  // Account badge (top-right of card)
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  accountBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.2,
  },

  // Balance text
  balanceLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    paddingLeft: 4,
    marginBottom: 5,
    textAlign: "center",
  },
  balanceAmountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceCurrency: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
    marginRight: 2,
  },
  balanceAmountText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    textAlign: "center",
    includeFontPadding: false,
  },

  // Bottom stat row
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 0,
  },
  cardStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  cardStatLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  cardStatValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.1,
  },
  cardStatInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 4,
  },

  // ── Shared section ────────────────────────────────────────────────────────
  sectionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 12,
  },
  seeAllText: { fontSize: 13, color: "#3B82F6", fontWeight: "600" },

  // Shared card surfaces
  cardDark: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    gap: 10,
  },
  quickCardLight: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  quickCardDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 15,
  },

  // ── Progress card ─────────────────────────────────────────────────────────
  progressCard: {
    borderRadius: 18,
    padding: 18,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  progressPercent: { fontSize: 15, fontWeight: "800" },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(148,163,184,0.2)",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: 7, borderRadius: 4 },
  progressHint: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },

  // ── Account pills ─────────────────────────────────────────────────────────
  accountPill: {
    borderRadius: 18,
    padding: 16,
    width: 160,
    overflow: "hidden",
  },
  accountPillTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 14,
  },
  accountIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountType: { fontSize: 10, color: "rgba(255,255,255,0.72)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  accountName: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 5 },
  accountBalance: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.82)" },

  // ── Trend ─────────────────────────────────────────────────────────────────
  trendCard: { borderRadius: 18, padding: 18, gap: 11 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trendMonth: { fontSize: 11, fontWeight: "600", color: "#64748B", width: 30 },
  trendBarTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(148,163,184,0.2)", overflow: "hidden" },
  trendBarFill: { height: 5, borderRadius: 3 },
  trendAmt: { fontSize: 11, fontWeight: "700", color: "#0F172A", width: 42, textAlign: "right" },

  // ── Empty / Error ─────────────────────────────────────────────────────────
  emptyCard: {
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  errorTitle: { fontSize: 15, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 22, paddingVertical: 8, borderRadius: 140, flexDirection: "row", alignItems: "center", gap: 6 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  retryBtnIcon: { width: 15, height: 15, alignItems: "center", justifyContent: "center" },
});