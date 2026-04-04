import React from "react";
import { StyleSheet, Text, View } from "react-native";

type PromoteSectionProps = {
  title: string;
  description?: string;
  highlight?: boolean;
  children: React.ReactNode;
};

export function PromoteSection({
  title,
  description,
  highlight = false,
  children,
}: PromoteSectionProps) {
  return (
    <View style={[styles.card, highlight && styles.highlightCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#101115",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1D2026",
    padding: 20,
    gap: 16,
  },
  highlightCard: {
    backgroundColor: "#141015",
    borderColor: "#3B1824",
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 19,
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  content: {
    gap: 14,
  },
});
