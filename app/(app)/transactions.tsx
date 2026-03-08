import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Text } from "../../components/Text";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../../services/transactions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import type { Transaction } from "../../types/api";

function formatCurrency(amount: number, currency: string = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionItem({ item }: { item: Transaction }) {
  const isIncome = item.type === "income";
  const isTransfer = item.type === "transfer";
  const accountName = item.account?.name ?? "Account";

  return (
    <View className="rounded-xl bg-white p-4 mb-2 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="font-medium text-slate-800" numberOfLines={1}>
          {item.description || (isTransfer ? "Transfer" : item.type)}
        </Text>
        <Text className="text-sm text-slate-500">
          {accountName} · {formatDate(item.transaction_date)}
        </Text>
      </View>
      <Text
        className={`font-semibold ${
          isIncome ? "text-emerald-600" : isTransfer ? "text-slate-700" : "text-red-600"
        }`}
      >
        {isIncome ? "+" : isTransfer ? "" : "-"}
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions({ limit: 50, offset: 0 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="mb-4 text-center text-slate-700">
          Failed to load transactions
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-emerald-600 font-medium">Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  const transactions = data?.transactions ?? [];

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
          />
        }
        ListEmptyComponent={
          <View className="rounded-xl bg-white p-8">
            <Text className="text-center text-slate-500">
              No transactions yet. Add one from the Dashboard or here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
