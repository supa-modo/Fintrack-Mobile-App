import {
  View,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "../../components/Text";
import { LabeledInput } from "../../components/LabeledInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { resetPassword } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { ThemeToggle } from "../../components/ThemeToggle";

const schema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    contact?: string;
    contactType?: string;
    code?: string;
  }>();
  const contact = (params.contact ?? "").toString();
  const isEmail = params.contactType === "email";
  const code = (params.code ?? "").toString();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    if (!contact || !code) {
      setApiError("Reset session expired. Please start the reset process again.");
      return;
    }
    try {
      if (__DEV__ || process.env.EXPO_PUBLIC_LOG_RESET_CODES === "true") {
        // eslint-disable-next-line no-console
        console.log("[DEV] Reset password submit", {
          contactType: isEmail ? "email" : "phone",
          contact,
          code,
        });
      }
      await resetPassword({
        [isEmail ? "email" : "phone"]: contact,
        code,
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
      className="flex-1 bg-slate-50 dark:bg-slate-950"
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
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="self-start">
            <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              Back
            </Text>
          </Pressable>
          <ThemeToggle />
        </View>

        <Text className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
          Reset password
        </Text>
        <Text className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Enter the 6-digit code and your new password.
        </Text>

        <View className="mb-8 rounded-3xl bg-white/90 px-4 py-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/90 dark:ring-slate-800">
          {apiError ? (
            <View className="mb-4 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/40 dark:ring-1 dark:ring-red-500/50">
              <Text className="text-sm text-red-700 dark:text-red-300">
                {apiError}
              </Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="new_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="New password (min 8 characters)"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="••••••••"
                secureTextEntry
                errorText={errors.new_password?.message}
                containerClassName="mb-2"
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <LabeledInput
                label="Confirm new password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="••••••••"
                secureTextEntry
                errorText={errors.confirm_password?.message}
                containerClassName="mb-1"
              />
            )}
          />
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="rounded-2xl bg-primary-600 py-4 shadow-md shadow-primary-500/40 active:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Reset password
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="mt-6"
        >
          <Text className="text-center font-semibold text-primary-600 dark:text-primary-400">
            Back to sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
