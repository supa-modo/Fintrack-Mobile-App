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
import { login as loginApi } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

const schema = z.object({
  email_or_phone: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
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
    defaultValues: { email_or_phone: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await loginApi({
        email_or_phone: data.email_or_phone.trim(),
        password: data.password,
      });
      await setTokens(res.accessToken, res.refreshToken, res.user);
      router.replace("/(app)");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Login failed";
      setApiError(message ?? "Login failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white font-google"
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
          Welcome back
        </Text>
        <Text className="mb-8 text-slate-600">
          Sign in to continue to FinTrack
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email_or_phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Email or phone
              </Text>
              <TextInput
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
                placeholder="john@example.com or +254712345678"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.email_or_phone ? (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.email_or_phone.message}
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
                Password
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

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="mb-6">
            <Text className="text-emerald-600">Forgot password?</Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="rounded-full bg-emerald-600 py-4 active:opacity-80 disabled:opacity-60"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Sign In to your account
            </Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-slate-600">Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="font-semibold text-emerald-600">Sign up</Text>
            </Pressable>
          </Link>
        </View>

        <Link href="/(onboarding)" asChild>
            <Pressable>
              <Text className="font-semibold text-emerald-600">Go to onboarding</Text>
            </Pressable>
          </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
