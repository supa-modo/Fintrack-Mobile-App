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
import { requestPasswordReset } from "../../services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const schema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email?.trim() || data.phone?.trim(), {
    message: "Provide email or phone",
    path: ["email"],
  });

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", phone: "" },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const email = data.email?.trim();
    const phone = data.phone?.trim();
    if (!email && !phone) {
      setApiError("Provide email or phone");
      return;
    }
    try {
      await requestPasswordReset({ email: email || undefined, phone: phone || undefined });
      setSuccess(true);
      setTimeout(() => {
        router.push({
          pathname: "/(auth)/reset-password",
          params: {
            contact: email || phone || "",
            contactType: email ? "email" : "phone",
          },
        });
      }, 800);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : "Failed to send code";
      setApiError(message ?? "Failed to send code");
    }
  };

  if (success) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Text className="text-center text-slate-800">
          Check your email or phone for the reset code.
        </Text>
        <ActivityIndicator className="mt-4" size="small" color="#059669" />
      </View>
    );
  }

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
          Forgot password?
        </Text>
        <Text className="mb-8 text-slate-600">
          Enter your email or phone to receive a reset code.
        </Text>

        {apiError ? (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-red-700">{apiError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Email
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
            </View>
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-slate-700">
                Phone
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
              {(errors.email as { message?: string } | undefined)?.message ? (
                <Text className="mt-1 text-sm text-red-600">
                  Provide at least email or phone
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
              Send reset code
            </Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-6">
            <Text className="text-center text-emerald-600">Back to sign in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
