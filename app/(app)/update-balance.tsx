import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getAccount, updateAccount } from "../../services/accounts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const schema = z.object({
  balance: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Enter a valid amount",
  }),
});

type FormData = z.infer<typeof schema>;

export default function UpdateBalanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId: string; accountName?: string }>();
  const accountId = params.accountId;
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { balance: "" },
  });

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => getAccount(accountId),
    enabled: !!accountId,
  });

  useEffect(() => {
    if (account) {
      setValue("balance", String(account.balance));
    }
  }, [account, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!accountId) return;
    setApiError(null);
    try {
      await updateAccount(accountId, {
        balance: parseFloat(data.balance) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      router.back();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to update balance";
      setApiError(message ?? "Failed to update balance");
    }
  };

  if (!accountId) {
    router.back();
    return null;
  }

  if (isLoading && !account) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const accountName = params.accountName ?? account?.name ?? "Account";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-1 px-6 pt-6">
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Text className="text-emerald-600">Cancel</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-slate-800">
          Update balance
        </Text>
        <Text className="mb-6 text-slate-600">{accountName}</Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="balance"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                New balance
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.balance ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.balance.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-600 py-4 active:opacity-80 disabled:opacity-60"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Update balance
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
