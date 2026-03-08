import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Text } from "../../components/Text";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getAccounts, deleteAccount } from "../../services/accounts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import type { Account } from "../../types/api";

function formatCurrency(amount: number, currency: string = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function AccountItem({
  item,
  onUpdateBalance,
  onDelete,
}: {
  item: Account;
  onUpdateBalance: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  return (
    <Pressable
      onLongPress={() => {
        Alert.alert(item.name, "Update balance or delete account?", [
          { text: "Cancel", style: "cancel" },
          { text: "Update balance", onPress: () => onUpdateBalance(item) },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item),
          },
        ]);
      }}
      className="rounded-xl bg-white p-4 mb-2 flex-row items-center justify-between"
    >
      <View>
        <Text className="font-medium text-slate-800">{item.name}</Text>
        <Text className="text-sm text-slate-500">{item.type}</Text>
      </View>
      <Text className="font-semibold text-slate-800">
        {formatCurrency(item.balance, item.currency)}
      </Text>
    </Pressable>
  );
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (account: Account) => {
    Alert.alert(
      "Delete account",
      `Delete "${account.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              queryClient.invalidateQueries({ queryKey: ["accounts"] });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            } catch {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const handleUpdateBalance = (account: Account) => {
    router.push({
      pathname: "/(app)/update-balance",
      params: { accountId: account.id, accountName: account.name },
    });
  };

  if (isLoading && !accounts.length) {
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
          Failed to load accounts
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-emerald-600 font-medium">Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AccountItem
            item={item}
            onUpdateBalance={handleUpdateBalance}
            onDelete={handleDelete}
          />
        )}
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
              No accounts yet. Tap "Add account" to create one.
            </Text>
          </View>
        }
      />
      <Pressable
        onPress={() => router.push("/(app)/create-account")}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-emerald-600 items-center justify-center shadow-lg"
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>
    </View>
  );
}
