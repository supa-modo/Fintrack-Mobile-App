import { View, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Text } from "../../components/Text";
import { useQuery } from "@tanstack/react-query";
import { getSummary, getSpending } from "../../services/dashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";

function formatCurrency(amount: number, currency: string = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getSummary,
  });

  const {
    data: spending,
    isLoading: spendingLoading,
    refetch: refetchSpending,
  } = useQuery({
    queryKey: ["dashboard", "spending"],
    queryFn: () => getSpending(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchSpending()]);
    setRefreshing(false);
  };

  if (summaryLoading && !summary) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (summaryError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="mb-4 text-center text-slate-700">
          Failed to load dashboard
        </Text>
        <Text
          onPress={() => refetchSummary()}
          className="text-emerald-600 font-medium"
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  const totalBalance = summary?.total_balance ?? 0;
  const accounts = summary?.accounts ?? [];
  const monthly = summary?.monthly_summary ?? {
    income: 0,
    expense: 0,
    net: 0,
  };
  const monthlyTrend = spending?.monthly_trend ?? [];

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#059669"
        />
      }
    >
      <View className="mb-6 rounded-2xl bg-emerald-600 p-6">
        <Text className="text-sm font-medium text-emerald-100">
          Total balance
        </Text>
        <Text className="mt-1 text-3xl font-bold text-white">
          {formatCurrency(totalBalance)}
        </Text>
      </View>

      <Text className="mb-3 text-lg font-semibold text-slate-800">
        Accounts
      </Text>
      {accounts.length === 0 ? (
        <View className="rounded-xl bg-white p-6">
          <Text className="text-center text-slate-500">
            No accounts yet. Add one from the Accounts tab.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {accounts.map((acc) => (
            <View
              key={acc.id}
              className="rounded-xl bg-white p-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="font-medium text-slate-800">{acc.name}</Text>
                <Text className="text-sm text-slate-500">{acc.type}</Text>
              </View>
              <Text className="font-semibold text-slate-800">
                {formatCurrency(acc.balance, acc.currency)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mb-3 mt-6 text-lg font-semibold text-slate-800">
        This month
      </Text>
      <View className="rounded-xl bg-white p-4 flex-row justify-between">
        <View className="items-center">
          <Text className="text-sm text-slate-500">Income</Text>
          <Text className="text-lg font-semibold text-emerald-600">
            {formatCurrency(monthly.income)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-sm text-slate-500">Expense</Text>
          <Text className="text-lg font-semibold text-red-600">
            {formatCurrency(monthly.expense)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-sm text-slate-500">Net</Text>
          <Text
            className={`text-lg font-semibold ${
              monthly.net >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(monthly.net)}
          </Text>
        </View>
      </View>

      {monthlyTrend.length > 0 && (
        <>
          <Text className="mb-3 mt-6 text-lg font-semibold text-slate-800">
            Spending trend
          </Text>
          <View className="rounded-xl bg-white p-4">
            {monthlyTrend.slice(-6).map((item, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <Text className="text-slate-600">
                  {new Date(item.month).toLocaleDateString("en-KE", {
                    month: "short",
                    year: "2-digit",
                  })}
                </Text>
                <Text className="font-medium text-slate-800">
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
