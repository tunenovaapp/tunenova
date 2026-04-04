import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SnippetUploadCardProps = {
  snippet: DocumentPicker.DocumentPickerAsset | null;
  error?: string;
  onPick: () => void;
  onClear: () => void;
  onTrimPress: () => void;
};

const formatFileSize = (size?: number | null) => {
  if (!size || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function SnippetUploadCard({
  snippet,
  error,
  onPick,
  onClear,
  onTrimPress,
}: SnippetUploadCardProps) {
  const hasSnippet = Boolean(snippet?.name);

  return (
    <View style={[styles.card, error && styles.cardError]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="musical-notes-outline" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>
            {hasSnippet ? snippet?.name : "No snippet selected yet"}
          </Text>
          <Text style={styles.subtitle}>
            {hasSnippet
              ? `Ready to upload · ${formatFileSize(snippet?.size)}`
              : "Upload an MP3 up to 5 MB. Shorter, memorable clips usually perform best."}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onPick}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
        >
          <Text style={styles.primaryActionText}>
            {hasSnippet ? "Replace file" : "Select MP3"}
          </Text>
        </Pressable>
        {hasSnippet ? (
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryActionText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onTrimPress}
        style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
      >
        <Ionicons name="open-outline" size={14} color="#FB7185" />
        <Text style={styles.linkText}>
          Need a tighter clip? Trim it with AudioTrimmer.
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#262B36",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 14,
  },
  cardError: {
    borderColor: "#FB7185",
  },
  topRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F43F5E",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryAction: {
    borderRadius: 14,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  secondaryAction: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#313745",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#11141A",
  },
  secondaryActionText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  linkWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkText: {
    color: "#FB7185",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  pressed: {
    opacity: 0.88,
  },
  error: {
    color: "#FB7185",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
});
