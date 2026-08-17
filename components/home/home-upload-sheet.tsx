import { RFValue } from "@/utils/responsiveFont";
import { formatMs } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type HomeUploadSheetProps = {
  isSubmitting: boolean;
  musicUrl: string;
  onChangeMusicUrl: (value: string) => void;
  onClose: () => void;
  onPickAudio: () => void;
  onSubmit: () => void;
  onTrimAudio?: () => void;
  pickedAudioMimeType?: string | null;
  pickedAudioName?: string | null;
  pickedAudioDurationMs?: number | null;
  visible: boolean;
};

export function HomeUploadSheet({
  isSubmitting,
  musicUrl,
  onChangeMusicUrl,
  onClose,
  onPickAudio,
  onSubmit,
  onTrimAudio,
  pickedAudioMimeType,
  pickedAudioName,
  pickedAudioDurationMs,
  visible,
}: HomeUploadSheetProps) {
  const fileMeta = pickedAudioName
    ? [pickedAudioDurationMs ? formatMs(pickedAudioDurationMs) : null, pickedAudioMimeType]
        .filter(Boolean)
        .join(" · ") || "MP3 snippet, up to 5MB"
    : "MP3 snippet, up to 30s";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          style={styles.sheet}
          onPress={() => {}}
        >
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>Add a track</Text>
            <Text style={styles.subtitle}>
              Upload a snippet and attach the streaming link listeners should
              discover.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.fileButton,
              isSubmitting && styles.disabledSurface,
            ]}
            onPress={onPickAudio}
            disabled={isSubmitting}
          >
            <View style={styles.fileButtonIcon}>
              <Ionicons
                name="musical-notes-outline"
                size={18}
                color="#fff"
              />
            </View>

            <View style={styles.fileButtonTextWrap}>
              <Text
                numberOfLines={1}
                style={styles.fileButtonTitle}
              >
                {pickedAudioName || "Choose music file"}
              </Text>

              <Text style={styles.fileButtonMeta}>{fileMeta}</Text>
            </View>
          </TouchableOpacity>

          {pickedAudioName && onTrimAudio ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.trimLink}
              onPress={onTrimAudio}
              disabled={isSubmitting}
            >
              <Ionicons name="cut-outline" size={14} color="#E10032" />
              <Text style={styles.trimLinkText}>Trim this clip</Text>
            </TouchableOpacity>
          ) : null}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Streaming link</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste Spotify, Apple Music, or public URL"
                placeholderTextColor="#7D7E88"
                value={musicUrl}
                onChangeText={onChangeMusicUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                editable={!isSubmitting}
                selectionColor="#ff003c"
              />
            </View>
          </KeyboardAvoidingView>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.actionButton,
                styles.primaryButton,
                isSubmitting && styles.disabledSurface,
              ]}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111114",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 18,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#3A3A43",
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(22),
  },
  subtitle: {
    color: "#A5A6B0",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
    lineHeight: RFValue(20),
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#17171B",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  disabledSurface: {
    opacity: 0.6,
  },
  trimLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -6,
  },
  trimLinkText: {
    color: "#E10032",
    fontSize: RFValue(12),
    fontFamily: "Nunito-Regular",
  },
  fileButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E10032",
    alignItems: "center",
    justifyContent: "center",
  },
  fileButtonTextWrap: {
    flex: 1,
    gap: 4,
  },
  fileButtonTitle: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
  fileButtonMeta: {
    color: "#92939E",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
  inputWrap: {
    gap: 8,
  },
  inputLabel: {
    color: "#B4B5BE",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#17171B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#E10032",
  },
  secondaryButton: {
    backgroundColor: "#F4F4F6",
  },
  primaryButtonText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
  secondaryButtonText: {
    color: "#000",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
});
