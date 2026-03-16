// ─── app/(app)/account/[id].tsx ──────────────────────────────────────────────
// Account detail page — shown when an account row is tapped.
//


import React, { useState, useCallback } from "react";
import {
    View,
    ScrollView,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    FlatList,
    Alert,
    RefreshControl,
} from "react-native";
import { Text } from "../../../components/Text";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { getAccount, deleteAccount } from "../../../services/accounts";
import { getTransactions } from "../../../services/transactions";
import type { Transaction } from "../../../types/api";
import { UpdateBalanceSheet } from "../update-balance-sheet";
import { CreateTransactionSheet } from "../create-transaction-sheet";

const TYPE_CONFIG: Record<string, { colors: [string, string]; icon: string }> = {
    mobile_money: { colors: ["#10B981", "#059669"], icon: "phone-portrait-outline" },
    bank: { colors: ["#3B82F6", "#1D4ED8"], icon: "business-outline" },
    cash: { colors: ["#F59E0B", "#D97706"], icon: "cash-outline" },
    investment: { colors: ["#8B5CF6", "#6D28D9"], icon: "trending-up-outline" },
    crypto: { colors: ["#EF4444", "#DC2626"], icon: "logo-bitcoin" },
    other: { colors: ["#64748B", "#475569"], icon: "ellipsis-horizontal-outline" },
};

function formatCurrency(n: number) {
    return Math.abs(n).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-KE", {
        day: "numeric", month: "short", year: "numeric",
    });
}
function formatDateShort(iso: string) {
    return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICON: Record<string, { icon: string; color: string; bg: string }> = {
    Income: { icon: "arrow-down-circle-outline", color: "#10B981", bg: "#10B98118" },
    Transport: { icon: "car-outline", color: "#3B82F6", bg: "#3B82F618" },
    Food: { icon: "fast-food-outline", color: "#F59E0B", bg: "#F59E0B18" },
    Utility: { icon: "flash-outline", color: "#8B5CF6", bg: "#8B5CF618" },
    Entertainment: { icon: "film-outline", color: "#EF4444", bg: "#EF444418" },
    Transfer: { icon: "swap-horizontal-outline", color: "#64748B", bg: "#64748B18" },
};
const DEFAULT_CAT = { icon: "ellipsis-horizontal-circle-outline", color: "#94A3B8", bg: "#94A3B818" };

// ─────────────────────────────────────────────────────────────────────────────

export default function AccountDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const queryClient = useQueryClient();

    const [showUpdateBalance, setShowUpdateBalance] = useState(false);
    const [showAddTx, setShowAddTx] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { data: account, isLoading: accLoading, refetch: refetchAcc } =
        useQuery({ queryKey: ["account", id], queryFn: () => getAccount(id!) });

    const { data: txData, isLoading: txLoading, refetch: refetchTx } =
        useQuery({
            queryKey: ["account-transactions", id],
            queryFn: () => getTransactions({ account_id: id as string, limit: 50, offset: 0 }),
        });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchAcc(), refetchTx()]);
        setRefreshing(false);
    }, []);

    const handleDelete = () => {
        Alert.alert(
            "Delete Account",
            "This will permanently delete this account and all its transactions. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteAccount(id!);
                        queryClient.invalidateQueries({ queryKey: ["accounts"] });
                        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                        router.back();
                    },
                },
            ]
        );
    };

    if (accLoading) {
        return (
            <View style={[s.centered, isDark ? s.bgDark : s.bgLight]}>
                <ActivityIndicator size="small" color="#3B82F6" />
            </View>
        );
    }

    if (!account) return null;

    const cfg = TYPE_CONFIG[account.type] ?? TYPE_CONFIG.other;
    const transactions: Transaction[] = txData?.transactions ?? [];
    const totalCount = txData?.pagination.total ?? transactions.length;

    // Mini stats (based on transaction type)
    const income = transactions
        .filter((t) => t.type === "income")
        .reduce((a, t) => a + t.amount, 0);
    const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((a, t) => a + t.amount, 0);

    // ── Quick action definitions (3 items) ──
    const QUICK_ACTIONS = [
        {
            icon: "swap-horizontal-bold",
            label: "Add Transaction",
            color: "#3B82F6",
            onPress: () => setShowAddTx(true),
        },
        {
            icon: "update",
            label: "Edit Balance",
            color: "#10B981",
            onPress: () => setShowUpdateBalance(true),
        },
        {
            icon: "trash-can",
            label: "Delete Account",
            color: "#EF4444",
            onPress: () => handleDelete(),
        },
    ];

    return (
        <View style={[s.root, isDark ? s.bgDark : s.bgLight]}>


            <ScrollView
                contentContainerStyle={{ paddingTop: 54, paddingBottom: insets.bottom + 110 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero balance card ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={s.heroWrapper}>
                    <LinearGradient
                        colors={cfg.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.heroCard}
                    >
                        {/* Decorative circles */}
                        <View style={s.heroCircle1} />
                        <View style={s.heroCircle2} />

                        <View style={s.heroTopRow}>
                            {/* Back button + name */}
                            <View style={s.heroTop}>
                                <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
                                    <Ionicons name="chevron-back" size={20} color={isDark ? "#F1F5F9" : "#fff"} />
                                </Pressable>
                                <View>
                                    <Text style={s.heroName}>{account.name}</Text>
                                    <Text style={s.heroSince}>Since {formatDate(account.created_at)}</Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={() => setShowUpdateBalance(true)}
                                style={[s.editBalanceBtn, isDark ? s.editBalanceBtnDark : s.editBalanceBtnLight]}
                                hitSlop={8}
                            >
                                <MaterialCommunityIcons name="lead-pencil" size={14} color={isDark ? "#F1F5F9" : "#fff"} />
                                <Text style={{ color: isDark ? "#F1F5F9" : "#fff", fontSize: 12, fontWeight: "600" }}>Edit</Text>
                            </Pressable>
                        </View>
                        {/* Balance */}
                        <Text style={s.heroBalLabel}>Current Balance</Text>
                        <Text style={s.heroBalance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                            {account.currency} {formatCurrency(account.balance)}
                        </Text>

                        {/* Income / Expense mini stats */}
                        <View style={s.heroStats}>
                            <View style={s.heroStat}>
                                <View style={s.heroStatDot}>
                                    <Ionicons name="arrow-down" size={10} color="#A7F3D0" />
                                </View>
                                <View>
                                    <Text style={s.heroStatLabel}>Income</Text>
                                    <Text style={[s.heroStatVal, { color: "#A7F3D0" }]}>
                                        +{formatCurrency(income)}
                                    </Text>
                                </View>
                            </View>
                            <View style={s.heroStatDivider} />
                            <View style={s.heroStat}>
                                <View style={[s.heroStatDot, { backgroundColor: "rgba(239,68,68,0.25)" }]}>
                                    <Ionicons name="arrow-up" size={10} color="#FCA5A5" />
                                </View>
                                <View>
                                    <Text style={s.heroStatLabel}>Spent</Text>
                                    <Text style={[s.heroStatVal, { color: "#FCA5A5" }]}>
                                        -{formatCurrency(expenses)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>


                {/* ── Quick Actions (3-column) ── */}
                <Animated.View entering={FadeInDown.duration(450).delay(120)} style={s.sectionWrapper}>
                    <View style={s.quickRow}>
                        {QUICK_ACTIONS.map((action) => (
                            <Pressable
                                key={action.label}
                                onPress={action.onPress}
                                style={({ pressed }) => [
                                    s.quickCard,
                                    isDark ? s.quickCardDark : s.quickCardLight,
                                    pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                                ]}
                            >
                                {/* Icon */}
                                <View style={[s.quickIconWrap]}>
                                    <MaterialCommunityIcons name={action.icon as any} size={25} color={action.color} />
                                </View>
                                {/* Label */}
                                <Text style={[s.quickLabel, isDark && { color: "#CBD5E1" }]} numberOfLines={2}>
                                    {action.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Transaction history ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(120)} style={s.txSection}>
                    <View style={s.txHeader}>
                        <Text style={[s.txTitle, isDark && { color: "#F1F5F9" }]}>Transactions</Text>
                        <Text style={[s.txCount, isDark && { color: "#475569" }]}>
                            {totalCount} total
                        </Text>
                    </View>

                    {txLoading ? (
                        <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
                    ) : transactions.length === 0 ? (
                        <View style={[s.emptyTx, isDark ? s.cardDark : s.cardLight]}>
                            <Ionicons name="receipt-outline" size={32} color={isDark ? "#334155" : "#CBD5E1"} />
                            <Text style={[s.emptyTxText, isDark && { color: "#475569" }]}>
                                No transactions yet
                            </Text>
                        </View>
                    ) : (
                        <View style={[s.txList, isDark ? s.cardDark : s.cardLight]}>
                            {transactions.map((tx, i) => {
                                const categoryName = tx.category?.name ?? "Other";
                                const cat = CATEGORY_ICON[categoryName] ?? DEFAULT_CAT;
                                const isIncome = tx.type === "income";
                                const isExpense = tx.type === "expense";
                                const isLast = i === transactions.length - 1;
                                const signedAmount = tx.amount;
                                const amountColor =
                                    isIncome
                                        ? "#10B981"
                                        : isExpense
                                            ? isDark
                                                ? "#FCA5A5"
                                                : "#EF4444"
                                            : isDark
                                                ? "#F1F5F9"
                                                : "#0F172A";
                                return (
                                    <React.Fragment key={tx.id}>
                                        <View style={s.txRow}>
                                            {/* Category icon */}
                                            <View style={[s.txIcon, { backgroundColor: cat.bg }]}>
                                                <Ionicons name={cat.icon as any} size={17} color={cat.color} />
                                            </View>

                                            {/* Title + date */}
                                            <View style={s.txMid}>
                                                <Text style={[s.txName, isDark && { color: "#F1F5F9" }]} numberOfLines={1}>
                                                    {tx.description || categoryName || (tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer")}
                                                </Text>
                                                <Text style={s.txDate}>{formatDateShort(tx.transaction_date)}</Text>
                                            </View>

                                            {/* Amount */}
                                            <Text
                                                style={[
                                                    s.txAmount,
                                                    { color: amountColor },
                                                ]}
                                            >
                                                {isIncome ? "+" : isExpense ? "-" : ""}
                                                {account.currency} {formatCurrency(signedAmount)}
                                            </Text>
                                        </View>
                                        {!isLast && (
                                            <View
                                                style={[
                                                    s.txSep,
                                                    { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)" },
                                                ]}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <UpdateBalanceSheet
                visible={showUpdateBalance}
                onClose={() => setShowUpdateBalance(false)}
                preselectedAccountId={id as string}
            />
            <CreateTransactionSheet
                visible={showAddTx}
                onClose={() => setShowAddTx(false)}
                defaultType="expense"
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    bgDark: { backgroundColor: "#020B18" },
    bgLight: { backgroundColor: "#F1F5F9" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },

    // Top bar
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 12,
    },
    topBarDark: { backgroundColor: "#020B18" },
    topBarLight: { backgroundColor: "#F1F5F9" },
    topBarTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        letterSpacing: -0.3,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    topActionBtn: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: "center", justifyContent: "center",
    },
    topActionLight: { backgroundColor: "rgba(15,23,42,0.06)" },
    topActionDark: { backgroundColor: "rgba(255,255,255,0.09)" },

    // Hero card
    heroWrapper: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 26,
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 26,
        elevation: 14,
    },
    heroCard: {
        borderRadius: 26,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 14,
        overflow: "hidden",
        minHeight: 200,
    },
    heroCircle1: {
        position: "absolute", top: -60, right: -40,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    heroCircle2: {
        position: "absolute", bottom: -60, left: -40,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    heroTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 22,
    },
    heroAvatar: {
        width: 50, height: 50, borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    heroName: {
        fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.2,
    },
    heroSince: {
        fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "400", marginTop: 1,
    },
    heroBalLabel: {
        fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: "600",
        textAlign: "center", marginBottom: 4,
    },
    heroBalance: {
        fontSize: 34, fontWeight: "800", color: "#fff",
        letterSpacing: -1, textAlign: "center", marginBottom: 18,
    },
    heroStats: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },
    heroStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
    heroStatDot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: "rgba(16,185,129,0.25)",
        alignItems: "center", justifyContent: "center",
    },
    heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
    heroStatVal: { fontSize: 13, fontWeight: "700", color: "#fff" },
    heroStatDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.14)" },
    editBalanceBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, height: 28, borderRadius: 140, },
    editBalanceBtnLight: { backgroundColor: "rgba(255,255,255,0.15)" },
    editBalanceBtnDark: { backgroundColor: "rgba(15,23,42,0.06)" },

    // ------------------
    qBtn: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: "center",
        gap: 8,
    },
    qBtnLight: {
        backgroundColor: "#fff",
        shadowColor: "#1E3A5F",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    qBtnDark: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    qBtnIcon: {
        width: 40, height: 40, borderRadius: 13,
        alignItems: "center", justifyContent: "center",
    },
    qBtnLabel: {
        fontSize: 11, fontWeight: "600", color: "#64748B",
        textAlign: "center", lineHeight: 14,
    },

    // ── Shared section ────────────────────────────────────────────────────────
    sectionWrapper: {
        paddingHorizontal: 10,
        marginBottom: 22,
    },

    // ── Quick Actions ─────────────────────────────────────────────────────────
    quickRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    quickCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 140,
        paddingVertical: 9,
        paddingHorizontal: 16,
        marginHorizontal: 4,
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
        marginRight: 6,

    },
    quickLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#6b7289",
        textAlign: "center",
        lineHeight: 15,
    },

    // Transaction list
    txSection: { marginHorizontal: 20 },
    txHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    txTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
    txCount: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
    txList: {
        borderRadius: 20,
        overflow: "hidden",
    },
    cardDark: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
    cardLight: {
        backgroundColor: "#fff",
        shadowColor: "#1E3A5F",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    txRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    txIcon: {
        width: 40, height: 40, borderRadius: 13,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    txMid: { flex: 1, gap: 3 },
    txName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
    txDate: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
    txAmount: { fontSize: 13, fontWeight: "700", textAlign: "right" },
    txSep: { height: 1, marginHorizontal: 16 },
    emptyTx: {
        borderRadius: 20,
        padding: 40,
        alignItems: "center",
        gap: 10,
    },
    emptyTxText: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
});