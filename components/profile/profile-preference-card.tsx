import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ProfilePreferenceCardProps = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  values: string[];
  emptyLabel: string;
  onPress: () => void;
};

export function ProfilePreferenceCard({
  title,
  description,
  icon,
  values,
  emptyLabel,
  onPress,
}: ProfilePreferenceCardProps) {
  const visibleValues = values.slice(0, 3);
  const hiddenCount = values.length - visibleValues.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>

      <View style={styles.valuesWrap}>
        {visibleValues.length ? (
          <>
            {visibleValues.map((value) => (
              <View key={value} style={styles.valueChip}>
                <Text style={styles.valueChipText}>{value}</Text>
              </View>
            ))}
            {hiddenCount > 0 ? (
              <View style={styles.moreChip}>
                <Text style={styles.moreChipText}>+{hiddenCount} more</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyChip}>
            <Text style={styles.emptyChipText}>{emptyLabel}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  valuesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  valueChip: {
    borderRadius: 999,
    backgroundColor: "#12161D",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  valueChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
  },
  moreChip: {
    borderRadius: 999,
    backgroundColor: "#142032",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreChipText: {
    color: "#DBEAFE",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
  },
  emptyChip: {
    borderRadius: 999,
    backgroundColor: "#14181F",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  pressed: {
    opacity: 0.9,
  },
});
