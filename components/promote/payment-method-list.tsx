import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type PaymentOption = {
  label: string;
  value: string;
  detail: string;
  helper?: string;
};

type PaymentMethodListProps = {
  options: PaymentOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  note?: string | null;
  emptyState?: string | null;
};

export function PaymentMethodList({
  options,
  value,
  onChange,
  error,
  note,
  emptyState,
}: PaymentMethodListProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.list}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionCopy}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDetail, selected && styles.optionDetailSelected]}>
                  {option.detail}
                </Text>
                {option.helper ? (
                  <Text
                    style={[
                      styles.optionHelper,
                      selected && styles.optionHelperSelected,
                    ]}
                  >
                    {option.helper}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.checkWrap, selected && styles.checkWrapSelected]}>
                {selected ? (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {emptyState ? <Text style={styles.emptyText}>{emptyState}</Text> : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 10,
  },
  list: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#252A35",
    backgroundColor: "#0B0D11",
    padding: 16,
  },
  optionSelected: {
    borderColor: "#F43F5E",
    backgroundColor: "#1B0F16",
  },
  pressed: {
    opacity: 0.88,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  optionDetail: {
    color: "#E2E8F0",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  optionDetailSelected: {
    color: "#FFFFFF",
  },
  optionHelper: {
    color: "#94A3B8",
    lineHeight: 18,
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  optionHelperSelected: {
    color: "#E2E8F0",
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#313745",
    backgroundColor: "#11141A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrapSelected: {
    borderColor: "#F43F5E",
    backgroundColor: "#F43F5E",
  },
  emptyText: {
    color: "#94A3B8",
    lineHeight: 18,
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  note: {
    color: "#FBBF24",
    lineHeight: 19,
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  error: {
    color: "#FB7185",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
});
