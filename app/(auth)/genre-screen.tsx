import { useProfile } from "@/api/auth/auth";
import { useUpdateGenres } from "@/api/user/user";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * ----------------------------------------------------------------------------
 *  GenresScreen – choose favourite music genres
 * ----------------------------------------------------------------------------
 *  •   Full‑bleed image cards; dark overlay + white title.
 *  •   Tap toggles a scale‑in tick badge at top‑right.
 *  •   Skip link (top‑right) & Done button (bottom, enabled when ≥1).
 *  •   Hides status‑bar background behind a translucent progress bar.
 * ----------------------------------------------------------------------------
 */

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 160;

// Replace with your own royalty‑free images or local assets
const GENRES = [
  { id: "pop", title: "Pop", img: require("../../assets/images/pop.jpg") },
  {
    id: "afrobeats",
    title: "Afrobeats",
    img: require("../../assets/images/afrobeats.jpg"),
  },
  {
    id: "gospel",
    title: "Gospel",
    img: require("../../assets/images/gospel.jpg"),
  },
  {
    id: "hiphop",
    title: "Hip‑hop",
    img: require("../../assets/images/hiphop.jpg"),
  },
  { id: "rnb", title: "R&B", img: require("../../assets/images/pop.jpg") },
  {
    id: "country",
    title: "Country",
    img: require("../../assets/images/afrobeats.jpg"),
  },
] as const;

type Genre = (typeof GENRES)[number];

export default function GenresScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { mutate, isPending, isSuccess, isError } = useUpdateGenres();
  const { data: profileData } = useProfile();
  const { param } = useLocalSearchParams();

  useEffect(() => {
    if (profileData?.data?.selectedGenres) {
      setSelected(profileData.data.selectedGenres);
    }
  }, [profileData]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleDone = () => {
    setMessage(null);
    mutate(
      { genres: selected },
      {
        onSuccess: () => {
          setMessage("Genres updated! Redirecting...");
          setTimeout(() => {
            if (param === "back") {
              return router.back();
            }
            router.replace("/(tabs)/home");
          }, 1000);
        },
        onError: (err: any) => {
          setMessage(
            err?.response?.data?.error ||
              "Failed to update genres. Please try again."
          );
        },
      }
    );
  };

  const renderItem = ({ item }: { item: Genre }) => {
    const active = selected.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggle(item.id)}
        style={styles.cardWrapper}
      >
        <ImageBackground
          source={item.img}
          style={styles.cardImage}
          resizeMode="cover"
          imageStyle={{ borderRadius: 16 }}
        >
          {/* Dark overlay for readability */}
          <View
            style={[
              styles.overlay,
              active ? { opacity: 0.2 } : { opacity: 0.6 },
            ]}
          />

          <Text style={styles.cardTitle}>{item.title}</Text>

          {/* Tick badge */}
          <Animated.View
            style={[
              styles.badge,
              active && {
                backgroundColor: "#ff003c",
              },
            ]}
          >
            {active && (
              <>
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#fff"
                />
              </>
            )}
          </Animated.View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar – final step (4/4) */}
      {param !== "back" && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: width }]} />
        </View>
      )}

      {/* Skip link */}
      {param !== "back" && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            if (param === "back") {
              return router.back();
            }
            router.replace("/(tabs)/home");
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {param !== "back" && (
        <Text style={styles.heading}>Choose your favorite{"\n"}genres</Text>
      )}

      {param === "back" && (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Entypo
              name="chevron-small-left"
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: RFValue(18),
              fontFamily: "Nunito-ExtraBold",
              color: "#fff",
            }}
          >
            Favourite Genres
          </Text>
        </View>
      )}

      <FlatList
        data={GENRES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      <TouchableOpacity
        style={[styles.button, selected.length ? null : { opacity: 0.4 }]}
        disabled={!selected.length || isPending}
        activeOpacity={0.9}
        onPress={handleDone}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Done</Text>
        )}
      </TouchableOpacity>

      {message && (
        <Text
          style={{
            color: isSuccess ? "#22c55e" : "#f43f5e",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {message}
        </Text>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#1f2937",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#ff003c",
  },
  skipBtn: {
    zIndex: 10,
    marginLeft: "auto",
    marginRight: 15,
    marginTop: 10,
  },
  skipText: {
    color: "#ff0066",
    fontSize: 16,
  },
  heading: {
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 32,
    lineHeight: 36,
    fontFamily: "Montserrat-Medium",
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4b5563",
    marginHorizontal: 24,
  },
  cardImage: {
    width: "100%",
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 24,
    zIndex: 5,
    fontFamily: "Nunito-Bold",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  button: {
    marginHorizontal: 24,
    backgroundColor: "#ff003c",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff003c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
});
