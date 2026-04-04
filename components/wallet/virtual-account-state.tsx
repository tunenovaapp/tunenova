import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type VirtualAccountStateProps =
  | { kind: "loading" }
  | {
      kind: "empty" | "error";
      title: string;
      description: string;
      actionLabel: string;
      onAction: () => void;
    };

export function VirtualAccountState(props: VirtualAccountStateProps) {
  if (props.kind === "loading") {
    return (
      <View style={styles.container}>
        <WalletSkeleton style={{ height: 320, borderRadius: 30 }} />
        <WalletSkeleton style={{ height: 82, borderRadius: 22 }} />
        <WalletSkeleton style={{ height: 82, borderRadius: 22 }} />
        <WalletSkeleton style={{ height: 120, borderRadius: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.emptyCard}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={props.kind === "error" ? "alert-circle-outline" : "card-outline"}
          size={22}
          color="#FFFFFF"
        />
      </View>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.description}>{props.description}</Text>
      <Pressable
        onPress={props.onAction}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{props.actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 26,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 19,
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: "Nunito-Regular",
  },
  button: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});
