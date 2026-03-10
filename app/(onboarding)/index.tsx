import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../../components/Text";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "nativewind";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 400;

const SLIDES = [
  {
    title: "See All Your\nMoney In One Place",
    description:
      "Track M-Pesa, bank accounts, cash and investments balances from a single dashboard.",
    image: require("../../assets/images/hero1.png"),
  },
  {
    title: "Understand What\nYour Money Goes To",
    description:
      "Categorize your expenses and visualize spending trends effortlessly.",
    image: require("../../assets/images/hero3.png"),
  },
  {
    title: "Take Control\nOf Your Finances",
    description:
      "Stay organized and make smarter informed financial decisions every day.",
    image: require("../../assets/images/hero1.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [page, setPage] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const buttonShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-950"
      style={{ paddingTop: insets.top }}
    >

      
      {/* Logo + Theme Toggle */}
      <View className="mt-20 mb-2 flex-row items-center justify-between pl-4 pr-4">
        <Image
          source={require("../../assets/icon2.png")}
          style={{ width: 180, height: 80 }}
          resizeMode="contain"
        />
        <View style={styles.topBarRight}>
          <Pressable onPress={handleGetStarted} style={styles.skipBtn}>
            <Text
              style={[
                styles.skipText,
                !isDark && { color: "rgba(71,85,105,0.7)" },
              ]}
            >
              Skip
            </Text>
          </Pressable>

          <ThemeToggle />
        </View>
      </View>

      {/* Hero Text */}
      <View className="mb-6 pl-6 pr-2">
        <Text className="text-3xl tracking-wide text-gray-800 dark:text-slate-50 leading-tight" style={{ fontWeight: 900 }}>
          {SLIDES[page].title}
        </Text>

        <Text className="mt-3 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          {SLIDES[page].description}
        </Text>
      </View>

      {/* Swipeable Images */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setPage((prev) => (index !== prev ? index : prev));
        }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setPage(index);
        }}
        className="flex-1"
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width }}>
            <View style={{ width, height: HERO_HEIGHT }}>
              <Image
                source={slide.image}
                style={{ width, height: HERO_HEIGHT }}
                resizeMode="contain"
              />
              <LinearGradient
                colors={
                  isDark
                    ? ["transparent", "#020617"]
                    : ["transparent", "white"]
                }
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: HERO_HEIGHT * 0.6,
                }}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination */}
      <View className="flex-row justify-center mt-4 mb-12 px-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-2 rounded-full ${page === i
              ? "w-6 bg-primary-600"
              : "w-2 bg-slate-300"
              }`}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-4">
        <Pressable
          onPress={handleGetStarted}
          style={buttonShadow}
          className="mb-8 flex flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-4 active:opacity-90 active:scale-[0.98] transition-transform"
        >
          <Text className="text-center text-base font-semibold text-white">
            Get Started
          </Text>
          <View style={styles.nextBtnArrow}>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({


  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(148,163,184,0.12)",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(148,163,184,0.8)",
    letterSpacing: 0.2,
  },
  nextBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
});