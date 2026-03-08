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
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { register as registerApi } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

const schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.email?.trim() || data.phone?.trim(), {
    message: "Provide at least email or phone",
    path: ["email"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const payload: Parameters<typeof registerApi>[0] = {
      full_name: data.full_name.trim(),
      password: data.password,
    };
    if (data.email?.trim()) payload.email = data.email.trim();
    if (data.phone?.trim()) payload.phone = data.phone.trim();
    if (!payload.email && !payload.phone) {
      setApiError("Provide at least email or phone");
      return;
    }
    try {
      const res = await registerApi(payload);
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : "Registration failed";
      setApiError(message ?? "Registration failed");
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
        <Text className="mb-1 text-3xl font-bold text-slate-800">
          Create account
        </Text>
        <Text className="mb-8 text-slate-600">
          Sign up to start tracking your finances
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Full name
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="John Doe"
                placeholderTextColor="#94a3b8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.full_name ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.full_name.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Email (optional if phone provided)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="john@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
              />
              {errors.email ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Phone (optional if email provided)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="+254712345678"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
              />
              {errors.phone ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Password (min 8 characters)
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
              {errors.password ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.password.message}
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

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-slate-600">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="font-semibold text-emerald-600">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
