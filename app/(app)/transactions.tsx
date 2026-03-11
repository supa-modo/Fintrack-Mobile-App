// ─── app/(app)/transactions.tsx ──────────────────────────────────────────────
import {
  View,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  SectionList,
} from "react-native";
import { Text } from "../../components/Text";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../../services/transactions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useMemo } from "react";
import type { Transaction } from "../../types/api";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import { CreateTransactionSheet } from "../(app)/create-transaction-sheet";

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function groupByDate(transactions: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const d = new Date(tx.transaction_date).toLocaleDateString("en-KE", {
      weekday: "long", month: "long", day: "numeric",
    });
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(tx);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const CATEGORY_ICONS: Record<string, { icon: any; bg: string; color: string }> = {
  income:   { icon: "arrow-down-circle", bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
  expense:  { icon: "arrow-up-circle",   bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  transfer: { icon: "swap-horizontal",   bg: "rgba(99,102,241,0.12)",  color: "#6366F1" },
};

const FILTERS = ["All", "Income", "Expenses", "Transfers"];

// ── Expandable FAB ────────────────────────────────────────────────────────────
function TransactionFAB({
  onExpense,
  onIncome,
  onTransfer,
  isDark,
  bottom,
}: {
  onExpense: () => void;
  onIncome: () => void;
  onTransfer: () => void;
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
    { label: "Add Expense",  icon: "arrow-up-circle-outline",   color: "#EF4444", onPress: onExpense },
    { label: "Add Income",   icon: "arrow-down-circle-outline", color: "#10B981", onPress: onIncome },
    { label: "Transfer",     icon: "swap-horizontal-outline",   color: "#8B5CF6", onPress: onTransfer },
  ];

  return (
    <View style={[styles.fabContainer, { bottom }]} pointerEvents="box-none">
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
      <Pressable onPress={toggle} style={styles.fabMain}>
        <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.fabGradient}>
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={26} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ── Transaction Item ──────────────────────────────────────────────────────────
function TransactionItem({ item, isDark, index }: { item: Transaction; isDark: boolean; index: number }) {
  const isIncome   = item.type === "income";
  const isTransfer = item.type === "transfer";
  const cat        = CATEGORY_ICONS[item.type] ?? CATEGORY_ICONS.expense;
  const accountName = item.account?.name ?? "Account";

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 40).springify()}>
      <Pressable style={({ pressed }) => [
        styles.txItem,
        isDark ? styles.txItemDark : styles.txItemLight,
        pressed && { opacity: 0.75, transform: [{ scale: 0.99 }] },
      ]}>
        <View style={[styles.txIconBg, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon} size={22} color={cat.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDescription, isDark && { color: "#E2E8F0" }]} numberOfLines={1}>
            {item.description || (isTransfer ? "Transfer" : item.type)}
          </Text>
          <View style={styles.txMeta}>
            <Text style={styles.txAccount}>{accountName}</Text>
            <View style={styles.txDot} />
            <Text style={styles.txDate}>{formatDate(item.transaction_date)}</Text>
          </View>
        </View>
        <View style={styles.txAmountCol}>
          <Text style={[
            styles.txAmount,
            isIncome ? { color: "#10B981" } : isTransfer ? isDark ? { color: "#94A3B8" } : { color: "#475569" } : { color: "#EF4444" },
          ]}>
            {isIncome ? "+" : isTransfer ? "↔" : "-"}{formatCurrency(item.amount)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [showTx, setShowTx]   = useState(false);
  const [txType, setTxType]   = useState<"income" | "expense" | "transfer">("expense");

  const openTx = (t: "income" | "expense" | "transfer") => { setTxType(t); setShowTx(true); };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions({ limit: 50, offset: 0 }),
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const filtered = useMemo(() => {
    const all = data?.transactions ?? [];
    if (activeFilter === "All") return all;
    const map: Record<string, string> = { Income: "income", Expenses: "expense", Transfers: "transfer" };
    return all.filter((tx) => tx.type === map[activeFilter]);
  }, [data, activeFilter]);

  const grouped  = useMemo(() => groupByDate(filtered), [filtered]);
  const allTx    = data?.transactions ?? [];
  const totalIn  = allTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = allTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const bg = isDark ? { backgroundColor: "#020B18" } : { backgroundColor: "#F1F5F9" };

  if (isLoading && !data) {
    return <View style={[styles.centered, bg]}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  }
  if (error) {
    return (
      <View style={[styles.centered, styles.px6, bg]}>
        <Ionicons name="cloud-offline-outline" size={48} color={isDark ? "#475569" : "#CBD5E1"} />
        <Text style={[styles.errorTitle, isDark && { color: "#CBD5E1" }]}>Failed to load transactions</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.flex, bg]}>
      {/* Sticky header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        style={[styles.headerContainer, { paddingTop: insets.top + 8 }, isDark ? styles.headerDark : styles.headerLight]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, isDark && { color: "#F1F5F9" }]}>Transactions</Text>
            <Text style={styles.headerSub}>{filtered.length} transactions</Text>
          </View>
          <Pressable
            onPress={() => openTx("expense")}
            style={[styles.searchBtn, isDark ? { backgroundColor: "rgba(255,255,255,0.07)" } : { backgroundColor: "rgba(15,23,42,0.06)" }]}
          >
            <Ionicons name="add" size={20} color={isDark ? "#94A3B8" : "#475569"} />
          </Pressable>
        </View>

        {/* Summary chips */}
        <View style={styles.summaryChips}>
          <View style={[styles.summaryChip, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
            <Ionicons name="arrow-down" size={12} color="#10B981" />
            <Text style={[styles.summaryChipText, { color: "#10B981" }]}>KES {(totalIn / 1000).toFixed(1)}K in</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
            <Ionicons name="arrow-up" size={12} color="#EF4444" />
            <Text style={[styles.summaryChipText, { color: "#EF4444" }]}>KES {(totalOut / 1000).toFixed(1)}K out</Text>
          </View>
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterPill,
                activeFilter === f ? styles.filterPillActive : isDark ? styles.filterPillInactiveDark : styles.filterPillInactiveLight,
              ]}
            >
              <Text style={[styles.filterPillText, activeFilter === f ? { color: "#fff" } : { color: "#64748B" }]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* List */}
      <SectionList
        sections={grouped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120, paddingTop: 12 }}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderText, isDark && { color: "#475569" }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => <TransactionItem item={item} isDark={isDark} index={index} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, isDark ? { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" } : { backgroundColor: "#fff" }]}>
            <Ionicons name="receipt-outline" size={40} color={isDark ? "#334155" : "#CBD5E1"} />
            <Text style={[styles.emptyTitle, isDark && { color: "#475569" }]}>No transactions yet</Text>
            <Text style={styles.emptySub}>Your activity will appear here</Text>
            <Pressable onPress={() => openTx("expense")} style={styles.emptyAddBtn}>
              <Text style={styles.emptyAddBtnText}>Add your first transaction</Text>
            </Pressable>
          </View>
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TransactionFAB
        isDark={isDark}
        bottom={insets.bottom + 88}
        onExpense={() => openTx("expense")}
        onIncome={() => openTx("income")}
        onTransfer={() => openTx("transfer")}
      />

      {/* Modal */}
      <CreateTransactionSheet visible={showTx} onClose={() => setShowTx(false)} defaultType={txType} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  px6: { paddingHorizontal: 24 },

  headerContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  headerDark:  { backgroundColor: "#020B18", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  headerLight: { backgroundColor: "#F1F5F9", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(15,23,42,0.07)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  searchBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  summaryChips: { flexDirection: "row", gap: 8, marginBottom: 14 },
  summaryChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  summaryChipText: { fontSize: 12, fontWeight: "700" },

  filterRow: { flexDirection: "row", gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterPillActive: { backgroundColor: "#3B82F6" },
  filterPillInactiveDark:  { backgroundColor: "rgba(255,255,255,0.07)" },
  filterPillInactiveLight: { backgroundColor: "rgba(15,23,42,0.07)" },
  filterPillText: { fontSize: 13, fontWeight: "600" },

  sectionHeader: { paddingVertical: 10 },
  sectionHeaderText: { fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 },

  txItem: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, marginBottom: 8, gap: 12 },
  txItemDark:  { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  txItemLight: { backgroundColor: "#FFFFFF", shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  txIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txDescription: { fontSize: 14, fontWeight: "600", color: "#0F172A", marginBottom: 4 },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  txAccount: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
  txDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#CBD5E1" },
  txDate: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
  txAmountCol: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "700", letterSpacing: -0.3 },

  emptyCard: { borderRadius: 24, padding: 40, alignItems: "center", gap: 8, marginTop: 40, borderWidth: 1, borderColor: "rgba(15,23,42,0.07)" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#64748B", marginTop: 8 },
  emptySub: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  emptyAddBtn: { marginTop: 12, backgroundColor: "#8B5CF6", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  errorTitle: { fontSize: 16, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // FAB
  fabContainer: { position: "absolute", right: 24, alignItems: "flex-end", gap: 12 },
  fabMenuItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  fabMenuLabel: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  fabMenuLabelLight: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  fabMenuLabelDark:  { backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  fabMenuLabelText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  fabSmall: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  fabMain: { borderRadius: 30, shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
});