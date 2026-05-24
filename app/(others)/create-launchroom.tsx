import { useCreateLaunchroomCampaign } from "@/api/launchroom/launchroom";
import { useBalance } from "@/api/wallet/wallet";
import { SnippetUploadCard } from "@/components/promote/snippet-upload-card";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GENRE_OPTIONS = [
  "Afrobeats",
  "Pop",
  "Hip-hop",
  "Gospel",
  "Country",
  "R&B",
];

const AUDIENCE_OPTIONS = ["Spotify", "YouTube", "Apple Music"];

export default function CreateLaunchroomScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { data: balanceData } = useBalance();

  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songLink, setSongLink] = useState("");
  const [genre, setGenre] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [snippet, setSnippet] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [artwork, setArtwork] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const { mutate: create, isPending } = useCreateLaunchroomCampaign({
    onSuccess: () => {
      Alert.alert("Success", "Launchroom campaign created!");
      router.back();
    },
    onError: (err) => {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create campaign",
      );
    },
  });

  const handlePickSnippet = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/mpeg",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSnippet(result.assets[0]);
    }
  }, []);

  const handlePickArtwork = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setArtwork({
        uri: asset.uri,
        name: asset.fileName || "artwork.jpg",
        type: asset.mimeType || "image/jpeg",
      });
    }
  }, []);

  const handleSubmit = () => {
    if (!songTitle.trim()) return Alert.alert("Missing", "Song title is required");
    if (!artistName.trim()) return Alert.alert("Missing", "Artist name is required");
    if (!songLink.trim()) return Alert.alert("Missing", "Fan link is required");
    if (!genre) return Alert.alert("Missing", "Select a genre");
    if (audience.length === 0) return Alert.alert("Missing", "Select at least one platform");
    if (!snippet) return Alert.alert("Missing", "Upload an audio snippet");
    if (!budget || Number(budget) < 1000) return Alert.alert("Missing", "Budget must be at least ₦1,000");
    if (!startDate) return Alert.alert("Missing", "Start date is required");
    if (!endDate) return Alert.alert("Missing", "End date is required");
    if (new Date(endDate) <= new Date(startDate)) return Alert.alert("Invalid", "End date must be after start date");

    create({
      songTitle: songTitle.trim(),
      artistName: artistName.trim(),
      songLink: songLink.trim(),
      genre,
      targetAudience: audience,
      budget: Number(budget),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      audioFile: {
        uri: snippet.uri,
        name: snippet.name,
        type: snippet.mimeType || "audio/mpeg",
      },
      artworkFile: artwork || undefined,
    });
  };

  const walletBalance = balanceData?.data?.wallet?.balance
    ? Number(balanceData.data.wallet.balance)
    : 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topBar, { paddingTop: top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Launch Campaign</Text>
        <Text style={styles.subtitle}>
          Create a giveaway campaign to engage fans
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Song Title */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Song Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter song title"
              placeholderTextColor="#64748B"
              value={songTitle}
              onChangeText={setSongTitle}
              maxLength={255}
            />
          </View>

          {/* Artist Name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Artist Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter artist name"
              placeholderTextColor="#64748B"
              value={artistName}
              onChangeText={setArtistName}
              maxLength={255}
            />
          </View>

          {/* Fan Link */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Fan Link / Smart Link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#64748B"
              value={songLink}
              onChangeText={setSongLink}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Genre */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Genre</Text>
            <View style={styles.chipRow}>
              {GENRE_OPTIONS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGenre(g.toLowerCase())}
                  style={[
                    styles.chip,
                    genre === g.toLowerCase() && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      genre === g.toLowerCase() && styles.chipTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Target Audience */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Target Audience</Text>
            <View style={styles.chipRow}>
              {AUDIENCE_OPTIONS.map((a) => {
                const selected = audience.includes(a.toLowerCase());
                return (
                  <Pressable
                    key={a}
                    onPress={() =>
                      setAudience((prev) =>
                        selected
                          ? prev.filter((x) => x !== a.toLowerCase())
                          : [...prev, a.toLowerCase()],
                      )
                    }
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {a}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Audio Snippet */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Audio Snippet</Text>
            <SnippetUploadCard
              snippet={snippet}
              onPick={handlePickSnippet}
              onClear={() => setSnippet(null)}
              onTrimPress={() => {}}
            />
          </View>

          {/* Artwork */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Artwork (optional)</Text>
            {artwork ? (
              <View style={styles.artworkPreview}>
                <Image
                  source={{ uri: artwork.uri }}
                  style={styles.artworkImage}
                />
                <Pressable
                  onPress={() => setArtwork(null)}
                  style={styles.artworkRemove}
                >
                  <Ionicons name="close-circle" size={22} color="#F43F5E" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handlePickArtwork} style={styles.artworkPick}>
                <Ionicons name="image-outline" size={28} color="#64748B" />
                <Text style={styles.artworkPickText}>Select Artwork</Text>
              </Pressable>
            )}
          </View>

          {/* Budget */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Giveaway Budget (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="Min ₦1,000"
              placeholderTextColor="#64748B"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Wallet balance: ₦{walletBalance.toLocaleString("en-NG")}
            </Text>
          </View>

          {/* Start Date */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 2026-06-01)"
              placeholderTextColor="#64748B"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>

          {/* End Date */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 2026-06-15)"
              placeholderTextColor="#64748B"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Submit */}
      <View style={[styles.submitBar, { paddingBottom: bottom + 12 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={isPending}
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && styles.submitBtnPressed,
            isPending && styles.submitBtnDisabled,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Launch Campaign</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050507" },
  topBar: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backLabel: { color: "#E2E8F0", fontSize: 16, fontFamily: "Nunito-SemiBold" },
  title: { color: "#FFFFFF", fontSize: 26, fontFamily: "Nunito-Bold" },
  subtitle: { color: "#94A3B8", fontSize: 14, fontFamily: "Nunito-Regular" },
  content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },
  fieldBlock: { gap: 8 },
  fieldLabel: { color: "#E2E8F0", fontSize: 14, fontFamily: "Nunito-Bold" },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
  },
  chipActive: { borderColor: "#F43F5E", backgroundColor: "#1B0F16" },
  chipText: { color: "#94A3B8", fontSize: 13, fontFamily: "Nunito-SemiBold" },
  chipTextActive: { color: "#F43F5E" },
  artworkPreview: { position: "relative", alignSelf: "flex-start" },
  artworkImage: { width: 120, height: 120, borderRadius: 14 },
  artworkRemove: { position: "absolute", top: -6, right: -6 },
  artworkPick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    borderStyle: "dashed",
    backgroundColor: "#0B0E12",
  },
  artworkPickText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#05070A",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: "#F43F5E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnPressed: { opacity: 0.85 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Nunito-Bold" },
});
