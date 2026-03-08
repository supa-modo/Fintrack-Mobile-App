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
import { useQueryClient } from "@tanstack/react-query";
import { createAccount } from "../../services/accounts";
import type { AccountType } from "../../types/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
];

const schema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum([
    "bank",
    "mobile_money",
    "cash",
    "investment",
    "crypto",
    "other",
  ]),
  currency: z.string().length(3, "Currency must be 3 characters"),
  balance: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Enter a valid amount",
  }),
});

type FormData = z.infer<typeof schema>;

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "mobile_money",
      currency: "KES",
      balance: "0",
    },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await createAccount({
        name: data.name.trim(),
        type: data.type,
        currency: data.currency.trim(),
        balance: parseFloat(data.balance) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to create account";
      setApiError(message ?? "Failed to create account");
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
          Add account
        </Text>
        <Text className="mb-6 text-slate-600">
          Add a bank, mobile money, or other account.
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Account name
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="e.g. M-Pesa, KCB"
                placeholderTextColor="#94a3b8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.name ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ACCOUNT_TYPES.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    className={`rounded-lg px-4 py-2 ${
                      value === opt.value ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <Text
                      className={
                        value === opt.value ? "text-white font-medium" : "text-slate-700"
                      }
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="currency"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Currency
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="KES"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                maxLength={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.currency ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.currency.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="balance"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Initial balance (optional)
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
              Create account
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
