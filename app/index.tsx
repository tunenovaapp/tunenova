import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const ONBOARD_KEY = "onboarding_complete";
const ACCESS_KEY = "access_token";

// ⬇️  Configure each onboarding step here
const slides = [
  {
    image: require("../assets/images/onboarding-1.png"),
    title: "Listen",
    subtitle: "to snippets of new music",
  },
  {
    image: require("../assets/images/onboarding-2.png"),
    title: "Discover",
    subtitle: "the artist behind the music",
  },
  {
    image: require("../assets/images/onboarding-3.png"),
    title: "Earn",
    subtitle: "when you listen & discover",
  },
] as const;

type Slide = (typeof slides)[number];

// Only call hooks a fixed number of times, not in a loop
function useSlideAnimatedStyles(progress: any) {
  const rImage0 = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [-1, 0, 1],
      [width, 0, -width]
    );
    const opacity = interpolate(progress.value, [-0.3, 0, 0.3], [0, 1, 0]);
    return { transform: [{ translateX }], opacity };
  });
  const rImage1 = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1, 2],
      [width, 0, -width]
    );
    const opacity = interpolate(progress.value, [0.7, 1, 1.3], [0, 1, 0]);
    return { transform: [{ translateX }], opacity };
  });
  const rImage2 = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [1, 2, 3],
      [width, 0, -width]
    );
    const opacity = interpolate(progress.value, [1.7, 2, 2.3], [0, 1, 0]);
    return { transform: [{ translateX }], opacity };
  });
  const rText0 = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [-1, 0, 1], [40, 0, -40]);
    const opacity = interpolate(progress.value, [-0.3, 0, 0.3], [0, 1, 0]);
    return { transform: [{ translateY }], opacity };
  });
  const rText1 = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1, 2], [40, 0, -40]);
    const opacity = interpolate(progress.value, [0.7, 1, 1.3], [0, 1, 0]);
    return { transform: [{ translateY }], opacity };
  });
  const rText2 = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [1, 2, 3], [40, 0, -40]);
    const opacity = interpolate(progress.value, [1.7, 2, 2.3], [0, 1, 0]);
    return { transform: [{ translateY }], opacity };
  });
  return {
    rImages: [rImage0, rImage1, rImage2],
    rTexts: [rText0, rText1, rText2],
  };
}

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [checking, setChecking] = useState(true);
  const progress = useSharedValue(0);

  // On mount, check onboarding and auth state
  useEffect(() => {
    (async () => {
      const onboarded = await AsyncStorage.getItem(ONBOARD_KEY);
      if (onboarded) {
        // Check for token
        const token = await SecureStore.getItemAsync(ACCESS_KEY);
        if (token) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/register");
        }
      } else {
        setChecking(false);
      }
    })();
  }, []);

  const { rImages, rTexts } = useSlideAnimatedStyles(progress);

  const handleNext = async () => {
    if (index < slides.length - 1) {
      const next = index + 1;
      setIndex(next);
      progress.value = withTiming(next, { duration: 450 });
    } else {
      // Mark onboarding as complete
      await AsyncStorage.setItem(ONBOARD_KEY, "true");
      router.replace("/(auth)/register");
    }
  };

  if (checking) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Stacked slides -------------------------------------------------- */}
      {slides.map((slide: Slide, i: number) => (
        <View
          key={i}
          style={[StyleSheet.absoluteFill, { justifyContent: "center" }]}
          pointerEvents="none"
        >
          <Animated.Image
            source={slide.image}
            resizeMode="contain"
            style={[styles.image, rImages[i]]}
          />

          <Animated.View style={[styles.textWrapper, rTexts[i]]}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </Animated.View>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleNext}
        activeOpacity={0.9}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {index === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles – minimal, *feel free to swap for nativewind/Tailwind if preferred*
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width * 0.8,
    height: height * 0.8,
    alignSelf: "center",
    marginBottom: 100,
  },
  textWrapper: {
    position: "absolute",
    bottom: 130,
    left: 24,
    right: 24,
  },
  title: {
    fontSize: RFValue(30),
    color: "#fff",
    textAlign: "right",
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    fontSize: RFValue(16),
    color: "#d1d5db",
    textAlign: "right",
    fontFamily: "Nunito-Regular",
  },
  button: {
    position: "absolute",
    bottom: 50,
    right: 24,
    backgroundColor: "#ff003c",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 24,
    shadowColor: "#ff003c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: RFValue(15),
    fontFamily: "Nunito-Bold",
    color: "#fff",
  },
});
