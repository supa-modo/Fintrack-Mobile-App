import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../../components/Text";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";

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

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      {/* Logo */}
      <View className="mt-20 mb-6">
        <Image
          source={require("../../assets/icon2.png")}
          style={{ width: 200, height: 60 }}
          resizeMode="contain"
        />
      </View>

      {/* Hero Text */}
      <View className="mb-6 px-6">
        <Text className="text-3xl font-extrabold text-gray-800 leading-tight">
          {SLIDES[page].title}
        </Text>

        <Text className="mt-3 text-base text-slate-500 leading-relaxed">
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
                colors={["transparent", "white"]}
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
      <View className="flex-row justify-center mt-4 mb-6 px-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-2 rounded-full ${page === i
              ? "w-6 bg-emerald-600"
              : "w-2 bg-slate-300"
              }`}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-4">
        <Pressable
          onPress={handleGetStarted}
          className="mb-8 rounded-full bg-emerald-600 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-semibold text-white">
            Get Started
          </Text>
        </Pressable></View>
    </View>
  );
}