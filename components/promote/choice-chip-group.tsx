import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ChoiceOption = {
  label: string;
  value: string;
  description?: string;
};

type ChoiceChipGroupProps = {
  options: ChoiceOption[];
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  variant?: "pill" | "card";
};

export function ChoiceChipGroup({
  options,
  value,
  onChange,
  error,
  variant = "pill",
}: ChoiceChipGroupProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.base,
                variant === "pill" ? styles.pill : styles.card,
                variant === "card" && styles.cardWidth,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.label, selected && styles.selectedLabel]}>
                {option.label}
              </Text>
              {option.description ? (
                <Text
                  style={[
                    styles.description,
                    selected && styles.selectedDescription,
                  ]}
                >
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 10,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  base: {
    borderWidth: 1,
    borderColor: "#232833",
    backgroundColor: "#0B0D11",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
  },
  cardWidth: {
    minWidth: 148,
    flexGrow: 1,
  },
  selected: {
    borderColor: "#F43F5E",
    backgroundColor: "#1B0F16",
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
  description: {
    color: "#94A3B8",
    lineHeight: 18,
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  selectedDescription: {
    color: "#E2E8F0",
  },
  error: {
    color: "#FB7185",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
});
