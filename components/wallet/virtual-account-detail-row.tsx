import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type VirtualAccountDetailRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  copied?: boolean;
  onCopy?: () => void;
};

export function VirtualAccountDetailRow({
  icon,
  label,
  value,
  copied = false,
  onCopy,
}: VirtualAccountDetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>

      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text selectable style={styles.value}>
          {value}
        </Text>
      </View>

      {onCopy ? (
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.copyButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.copyButtonText}>{copied ? "Copied" : "Copy"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Nunito-Bold",
  },
  copyButton: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: "#11141A",
    borderWidth: 1,
    borderColor: "#313745",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});
