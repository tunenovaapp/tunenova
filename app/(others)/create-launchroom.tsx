import { useCreateLaunchroomCampaign } from "@/api/launchroom/launchroom";
import { useBalance } from "@/api/wallet/wallet";
import { SnippetUploadCard } from "@/components/promote/snippet-upload-card";
import { TrimSnippetModal } from "@/components/promote/trim-snippet-modal";
import {
  MAX_SNIPPET_BYTES,
  MAX_SNIPPET_MS,
  describeSnippetProblem,
  getMp3DurationMs,
} from "@/utils/audioTrim";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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


export default function CreateLaunchroomScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { data: balanceData } = useBalance();

  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songLink, setSongLink] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [snippet, setSnippet] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [snippetDurationMs, setSnippetDurationMs] = useState<number | null>(null);
  const [snippetError, setSnippetError] = useState<string | undefined>(undefined);
  const [trimVisible, setTrimVisible] = useState(false);
  const [trimRequired, setTrimRequired] = useState(false);
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
    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    setSnippet(file);
    setSnippetDurationMs(null);
    setSnippetError(undefined);

    if ((file.size ?? 0) > MAX_SNIPPET_BYTES) {
      setSnippetError("Max size is 5 MB");
      return;
    }

    try {
      const duration = await getMp3DurationMs(file.uri);
      setSnippetDurationMs(duration);

      // Over the cap: the file cannot be submitted as-is, so go straight to
      // the trimmer instead of failing at submit time.
      if (duration > MAX_SNIPPET_MS) {
        setTrimRequired(true);
        setTrimVisible(true);
      }
    } catch {
      setSnippet(null);
      setSnippetError("Could not read that audio file. Please pick a valid MP3.");
    }
  }, []);

  const handleClearSnippet = useCallback(() => {
    setSnippet(null);
    setSnippetDurationMs(null);
    setSnippetError(undefined);
  }, []);

  const handleTrimConfirm = useCallback(
    (trimmed: DocumentPicker.DocumentPickerAsset) => {
      setTrimVisible(false);
      setTrimRequired(false);
      setSnippet(trimmed);
      setSnippetError(undefined);

      getMp3DurationMs(trimmed.uri)
        .then(setSnippetDurationMs)
        .catch(() => setSnippetDurationMs(null));
    },
    [],
  );

  const handleTrimCancel = useCallback(() => {
    if (trimRequired) {
      handleClearSnippet();
    }
    setTrimVisible(false);
    setTrimRequired(false);
  }, [handleClearSnippet, trimRequired]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const onStartDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowStartPicker(false);
      if (selected) setStartDate(selected);
    },
    [],
  );

  const onEndDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowEndPicker(false);
      if (selected) setEndDate(selected);
    },
    [],
  );

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
    if (!snippet) return Alert.alert("Missing", "Upload an audio snippet");
    if (snippetDurationMs == null)
      return Alert.alert("Snippet", "Still checking clip length. Try again in a moment.");

    const snippetProblem = describeSnippetProblem({
      sizeBytes: snippet.size,
      durationMs: snippetDurationMs,
    });
    if (snippetProblem) return Alert.alert("Snippet", snippetProblem);

    if (!budget || Number(budget) < 1000) return Alert.alert("Missing", "Budget must be at least ₦1,000");
    if (!startDate) return Alert.alert("Missing", "Start date is required");
    if (!endDate) return Alert.alert("Missing", "End date is required");
    if (endDate <= startDate) return Alert.alert("Invalid", "End date must be after start date");

    create({
      songTitle: songTitle.trim(),
      artistName: artistName.trim(),
      songLink: songLink.trim(),
      budget: Number(budget),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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

          {/* Audio Snippet */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Audio Snippet</Text>
            <SnippetUploadCard
              snippet={snippet}
              error={snippetError}
              durationMs={snippetDurationMs}
              onPick={handlePickSnippet}
              onClear={handleClearSnippet}
              onTrim={() => {
                setTrimRequired(false);
                setTrimVisible(true);
              }}
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
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
              <Text
                style={[
                  styles.dateButtonText,
                  !startDate && styles.dateButtonPlaceholder,
                ]}
              >
                {startDate ? formatDate(startDate) : "Select start date & time"}
              </Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={onStartDateChange}
                themeVariant="dark"
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>End Date</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
              <Text
                style={[
                  styles.dateButtonText,
                  !endDate && styles.dateButtonPlaceholder,
                ]}
              >
                {endDate ? formatDate(endDate) : "Select end date & time"}
              </Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || startDate || new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={startDate || new Date()}
                onChange={onEndDateChange}
                themeVariant="dark"
              />
            )}
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

      <TrimSnippetModal
        visible={trimVisible}
        asset={snippet}
        required={trimRequired}
        onCancel={handleTrimCancel}
        onConfirm={handleTrimConfirm}
      />
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
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  dateButtonPlaceholder: {
    color: "#64748B",
  },
});
