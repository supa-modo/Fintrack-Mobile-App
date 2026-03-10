import React, { ReactNode } from "react";
import { View, TextInputProps, StyleSheet, Button, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useSharedValue,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { Text } from "./Text";
import { TextInput } from "./TextInput";
import { Link } from "expo-router";

export type LabeledInputProps = TextInputProps & {
  rightAccessoryHref?: string;
  rightAccessoryOnPress?: () => void;
  rightAccessoryText?: string;
  label?: string;
  errorText?: string | null;
  containerClassName?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  rightAccessory?: ReactNode;
};

export function LabeledInput({
  rightAccessoryHref,
  rightAccessoryOnPress,
  rightAccessoryText,
  label,
  errorText,
  containerClassName,
  labelClassName,
  inputWrapperClassName,
  inputClassName,
  rightAccessory,
  ...inputProps
}: LabeledInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const focused = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focused.value,
      [0, 1],
      isDark
        ? ["rgba(148,163,184,0.4)", "rgba(59,130,246,0.85)"]
        : ["rgba(148,163,184,0.45)", "rgba(37,99,235,0.95)"]
    ),
    backgroundColor: interpolateColor(
      focused.value,
      [0, 1],
      isDark
        ? ["rgba(15,23,42,0.9)", "rgba(15,23,42,0.98)"]
        : ["rgba(248,250,252,1)", "rgba(239,246,255,1)"]
    ),
    shadowOpacity: withTiming(focused.value * 0.3, { duration: 200 }),
  }));

  const container = `mb-4 ${containerClassName ?? ""}`.trim();
  const labelCls = `mb-1.5 pl-2 text-sm font-semibold text-slate-500 dark:text-slate-400 ${labelClassName ?? ""}`.trim();
  const inputCls = `flex-1 h-13 text-base ${isDark ? "text-white" : "text-slate-900"
    } ${inputClassName ?? ""}`.trim();
  const inputWrapperCls = `${inputWrapperClassName ?? ""}`;

  return (
    <View className={container}>
      <View className="flex-row items-center justify-between">
        {label && <Text className={labelCls}>{label}</Text>}
        {rightAccessory && <Link href={rightAccessoryHref ?? ""} asChild><Pressable onPress={rightAccessoryOnPress ?? (() => {})}><Text className="text-xs text-primary-600 underline dark:text-slate-400">{rightAccessoryText ?? ""}</Text></Pressable></Link>}
      </View>
      <Animated.View
        style={[
          styles.inputWrapper,
          animatedBorderStyle,
          errorText ? styles.inputWrapperError : null,
        ]}
        className={inputWrapperCls}
      >
        <TextInput
          {...inputProps}
          className={inputCls}
          placeholderTextColor={inputProps.placeholderTextColor ?? "rgba(148,163,184,0.4)"}
          selectionColor="#3B82F6"
          onFocus={(e) => {
            focused.value = withTiming(1, { duration: 200 });
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            focused.value = withTiming(0, { duration: 200 });
            inputProps.onBlur?.(e);
          }}
        />
        {rightAccessory && (
          <View style={styles.accessory}>{rightAccessory}</View>
        )}
      </Animated.View>

      {errorText ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 0,
  },
  inputWrapperError: {
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  accessory: {
    paddingLeft: 8,
  },
  errorRow: {
    marginTop: 6,
    paddingLeft: 4,
  },
  errorText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "500",
  },
});