import {
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  createTransfer,
} from "../../services/transactions";
import { getAccounts } from "../../services/accounts";
import { getCategories } from "../../services/categories";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const schema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().uuid().optional(),
  from_account_id: z.string().uuid().optional(),
  to_account_id: z.string().uuid().optional(),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Enter a valid positive amount",
  }),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      account_id: "",
      from_account_id: "",
      to_account_id: "",
      amount: "",
      category_id: "",
      description: "",
    },
  });

  const type = watch("type");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const amount = parseFloat(data.amount);
    if (type === "transfer") {
      if (!data.from_account_id || !data.to_account_id) {
        setApiError("Select from and to accounts");
        return;
      }
      if (data.from_account_id === data.to_account_id) {
        setApiError("From and to accounts must be different");
        return;
      }
      try {
        await createTransfer({
          from_account_id: data.from_account_id,
          to_account_id: data.to_account_id,
          amount,
          description: data.description?.trim() || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        router.back();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Failed to create transfer";
        setApiError(message ?? "Failed to create transfer");
      }
    } else {
      if (!data.account_id) {
        setApiError("Select an account");
        return;
      }
      try {
        await createTransaction({
          type,
          account_id: data.account_id,
          amount,
          category_id: data.category_id || undefined,
          description: data.description?.trim() || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        router.back();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Failed to create transaction";
        setApiError(message ?? "Failed to create transaction");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Text className="text-emerald-600">Cancel</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-slate-800">
          Add transaction
        </Text>
        <Text className="mb-6 text-slate-600">
          Record income, expense, or transfer.
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-700">
                Type
              </Text>
              <View className="flex-row gap-2">
                {(["income", "expense", "transfer"] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => onChange(t)}
                    className={`flex-1 rounded-lg py-3 ${
                      value === t ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-center font-medium capitalize ${
                        value === t ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        {type === "transfer" ? (
          <>
            <Controller
              control={control}
              name="from_account_id"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-slate-700">
                    From account
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <Pressable
                        key={acc.id}
                        onPress={() => onChange(acc.id)}
                        className={`rounded-lg px-3 py-2 ${
                          value === acc.id ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      >
                        <Text
                          className={
                            value === acc.id
                              ? "text-white font-medium"
                              : "text-slate-700"
                          }
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="to_account_id"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-slate-700">
                    To account
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <Pressable
                        key={acc.id}
                        onPress={() => onChange(acc.id)}
                        className={`rounded-lg px-3 py-2 ${
                          value === acc.id ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      >
                        <Text
                          className={
                            value === acc.id
                              ? "text-white font-medium"
                              : "text-slate-700"
                          }
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="account_id"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-slate-700">
                    Account
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <Pressable
                        key={acc.id}
                        onPress={() => onChange(acc.id)}
                        className={`rounded-lg px-3 py-2 ${
                          value === acc.id ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      >
                        <Text
                          className={
                            value === acc.id
                              ? "text-white font-medium"
                              : "text-slate-700"
                          }
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="category_id"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-slate-700">
                    Category (optional)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(type === "expense"
                      ? expenseCategories
                      : incomeCategories
                    ).map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => onChange(cat.id)}
                        className={`rounded-lg px-3 py-2 ${
                          value === cat.id ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      >
                        <Text
                          className={
                            value === cat.id
                              ? "text-white font-medium"
                              : "text-slate-700"
                          }
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />
          </>
        )}

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Amount
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.amount ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Description (optional)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="e.g. Lunch, Salary"
                placeholderTextColor="#94a3b8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
              />
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
              Save
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
