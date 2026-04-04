import { useProfile } from "@/api/auth/auth";
import { useUpdatePlatforms } from "@/api/user/user";
import { RFValue } from "@/utils/responsiveFont";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform as RNPlatform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PLATFORMS = [
  {
    id: "spotify",
    name: "Spotify",
    renderIcon: () => (
      <Entypo
        name="spotify"
        size={28}
        color="#1DB954"
      />
    ),
  },
  {
    id: "youtube",
    name: "Youtube",
    renderIcon: () => (
      <Ionicons
        name="logo-youtube"
        size={28}
        color="#FF0000"
      />
    ),
  },
  {
    id: "apple",
    name: "Apple Music",
    renderIcon: () => (
      <Ionicons
        name="musical-notes"
        size={28}
        color="#FA2C55"
      />
    ),
  },
  {
    id: "boomplay",
    name: "Boomplay",
    renderIcon: () => (
      <MaterialCommunityIcons
        name="music-circle"
        size={28}
        color="#0F9EF4"
      />
    ),
  },
  {
    id: "audiomack",
    name: "Audiomack",
    renderIcon: () => (
      <FontAwesome5
        name="soundcloud"
        size={28}
        color="#FF9500"
      />
    ),
  },
  {
    id: "tidal",
    name: "TIDAL",
    renderIcon: () => (
      <MaterialCommunityIcons
        name="music"
        size={26}
        color="#fff"
      />
    ),
  },
  {
    id: "deezer",
    name: "Deezer",
    renderIcon: () => (
      <FontAwesome5
        name="deezer"
        size={26}
        color="#F46800"
      />
    ),
  },
] as const;

type MusicPlatform = (typeof PLATFORMS)[number];

const PLATFORM_APP_IDS = {
  spotify: {
    android: "com.spotify.music",
    ios: "spotify://",
  },
  youtube: {
    android: "com.google.android.youtube",
    ios: "youtube://",
  },
  apple: {
    android: "com.apple.android.music",
    ios: "music://",
  },
  boomplay: {
    android: "com.transsnet.music",
    ios: "boomplaymusic://",
  },
  audiomack: {
    android: "com.audiomack",
    ios: "audiomack://",
  },
  tidal: {
    android: "com.aspiro.tidal",
    ios: "tidal://",
  },
  deezer: {
    android: "deezer.android.app",
    ios: "deezer://",
  },
};

type PlatformId = keyof typeof PLATFORM_APP_IDS;

export default function MusicPlatformScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { mutate, isPending, isSuccess, isError } = useUpdatePlatforms();
  const { data: profileData } = useProfile();
  const { param } = useLocalSearchParams();

  useEffect(() => {
    if (profileData?.data?.selectedPlatforms) {
      setSelected(profileData.data.selectedPlatforms);
    }
  }, [profileData]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleProceed = () => {
    setMessage(null);
    mutate(
      { platforms: selected },
      {
        onSuccess: () => {
          setMessage("Platforms updated! Redirecting...");
          setTimeout(() => {
            if (param === "back") {
              return router.back();
            }
            router.replace("/(auth)/genre-screen");
          }, 1000);
        },
        onError: (err: any) => {
          setMessage(
            err?.response?.data?.error ||
              "Failed to update platforms. Please try again."
          );
        },
      }
    );
  };

  useEffect(() => {
    async function checkInstalledPlatforms() {
      const found: string[] = [];
      for (const p of Object.keys(PLATFORM_APP_IDS)) {
        const platform = p as PlatformId;
        try {
          if (RNPlatform.OS === "android") {
            // TODO: Add an Android-specific installed-app check if this auto-detect
            // flow needs to work on Android too.
            // const pkg = PLATFORM_APP_IDS[platform].android;
            // const isInstalled = await someAndroidCheck(pkg);
            // if (isInstalled) found.push(platform);
          } else if (RNPlatform.OS === "ios") {
            const url = PLATFORM_APP_IDS[platform].ios;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) found.push(platform);
          }
        } catch (e) {
        }
      }
      setSelected((prev) => Array.from(new Set([...prev, ...found])));
    }
    checkInstalledPlatforms();
  }, []);

  // Render list item --------------------------------------------------------
  const renderItem = ({ item }: { item: MusicPlatform }) => {
    const active = selected.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, active && { borderColor: "#ff003c" }]}
        activeOpacity={0.8}
        onPress={() => toggle(item.id)}
      >
        {/* Icon + Name */}
        <View style={styles.leftRow}>
          {item.renderIcon()}
          <Text style={styles.name}>{item.name}</Text>
        </View>

        {/* Badge */}
        <View
          style={[
            styles.badgeWrapper,
            active && { backgroundColor: "#ff003c" },
          ]}
        >
          {active && (
            <Ionicons
              name="checkmark"
              size={16}
              color="#fff"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar – 3/4 */}
      {param !== "back" && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: width * 0.75 }]} />
        </View>
      )}

      {param !== "back" && (
        <>
          <Text style={styles.heading}>Select Music Platform(s)</Text>
          <Text style={styles.subHeading}>
            Which of these platforms do you use?
          </Text>
          <Text style={styles.smallHint}>Select all that apply --</Text>
        </>
      )}

      {param === "back" && (
        <View
          style={{
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
            Music Platforms
          </Text>
        </View>
      )}

      <FlatList
        data={PLATFORMS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Proceed */}
      <TouchableOpacity
        style={[styles.button, selected.length ? null : { opacity: 0.5 }]}
        disabled={!selected.length || isPending}
        activeOpacity={0.9}
        onPress={handleProceed}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Proceed</Text>
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
    paddingHorizontal: 24,
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
  heading: {
    marginTop: 48,
    fontSize: 26,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  subHeading: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Nunito-Regular",
  },
  smallHint: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 32,
    fontFamily: "Nunito-Regular",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#4b5563",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
    backgroundColor: "#111827",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: "#fff",
    fontSize: 17,
    marginLeft: 20,
    fontFamily: "Nunito-Regular",
  },
  badgeWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#ff003c",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
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
