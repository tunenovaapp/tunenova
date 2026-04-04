import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type PromoteStickyBanner = {
  tone: "info" | "success" | "error";
  text: string;
};

type PromoteStickyBarProps = {
  summaryTitle: string;
  summaryText: string;
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  banner?: PromoteStickyBanner | null;
  bottomInset?: number;
};

const bannerMeta = {
  info: {
    icon: "information-circle-outline" as const,
    borderColor: "#1D4ED8",
    backgroundColor: "#0E1B33",
    textColor: "#DBEAFE",
  },
  success: {
    icon: "checkmark-circle-outline" as const,
    borderColor: "#15803D",
    backgroundColor: "#0D1F16",
    textColor: "#DCFCE7",
  },
  error: {
    icon: "alert-circle-outline" as const,
    borderColor: "#BE123C",
    backgroundColor: "#2A0F18",
    textColor: "#FFE4E6",
  },
};

export function PromoteStickyBar({
  summaryTitle,
  summaryText,
  buttonLabel,
  onPress,
  disabled = false,
  pending = false,
  banner,
  bottomInset = 0,
}: PromoteStickyBarProps) {
  const meta = banner ? bannerMeta[banner.tone] : null;

  return (
    <View style={[styles.shell, { paddingBottom: bottomInset + 14 }]}>
      {banner && meta ? (
        <View
          style={[
            styles.banner,
            {
              borderColor: meta.borderColor,
              backgroundColor: meta.backgroundColor,
            },
          ]}
        >
          <Ionicons name={meta.icon} size={18} color={meta.textColor} />
          <Text style={[styles.bannerText, { color: meta.textColor }]}>
            {banner.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{summaryTitle}</Text>
        <Text style={styles.summaryText}>{summaryText}</Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        {pending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 1,
    borderTopColor: "#1C2027",
    backgroundColor: "#07090D",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  summary: {
    gap: 4,
  },
  summaryTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  summaryText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  button: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
});
