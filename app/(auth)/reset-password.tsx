import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { resetPassword } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    contact?: string;
    contactType?: string;
  }>();
  const contact = params.contact ?? "";
  const isEmail = params.contactType === "email";
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", new_password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await resetPassword({
        [isEmail ? "email" : "phone"]: contact,
        code: data.code,
        new_password: data.new_password,
      });
      router.replace("/(auth)/login");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : "Failed to reset password";
      setApiError(message ?? "Failed to reset password");
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
          flexGrow: 1,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          paddingTop: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Text className="text-emerald-600">Back</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-slate-800">
          Reset password
        </Text>
        <Text className="mb-8 text-slate-600">
          Enter the 6-digit code and your new password.
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Code
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="000000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.code ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.code.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="new_password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                New password (min 8 characters)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.new_password ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.new_password.message}
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
              Reset password
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/login")} className="mt-6">
          <Text className="text-center text-emerald-600">Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
