import { PaymentMethodList, PaymentOption } from "@/components/promote/payment-method-list";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Modal from "react-native-modal";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type CampaignSheetBanner = {
  tone: "info" | "success" | "error";
  text: string;
};

type PromoteAgainSheetProps = {
  visible: boolean;
  onClose: () => void;
  budget: string;
  onBudgetChange: (value: string) => void;
  paymentBy?: string;
  onPaymentChange: (value: string) => void;
  paymentOptions: PaymentOption[];
  paymentNote?: string | null;
  paymentEmptyState?: string | null;
  budgetError?: string | null;
  paymentError?: string | null;
  banner?: CampaignSheetBanner | null;
  walletShortfallLabel?: string | null;
  onTopUp?: (() => void) | null;
  onConfirm: () => void;
  pending?: boolean;
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

export function PromoteAgainSheet({
  visible,
  onClose,
  budget,
  onBudgetChange,
  paymentBy,
  onPaymentChange,
  paymentOptions,
  paymentNote,
  paymentEmptyState,
  budgetError,
  paymentError,
  banner,
  walletShortfallLabel,
  onTopUp,
  onConfirm,
  pending = false,
}: PromoteAgainSheetProps) {
  const meta = banner ? bannerMeta[banner.tone] : null;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={pending ? undefined : onClose}
      onBackButtonPress={pending ? undefined : onClose}
      style={styles.modal}
      avoidKeyboard
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <View style={styles.badge}>
                <Ionicons name="repeat-outline" size={15} color="#FFFFFF" />
                <Text style={styles.badgeText}>Promote again</Text>
              </View>
              <Text style={styles.title}>Launch another push for this song</Text>
              <Text style={styles.description}>
                Choose a fresh budget and payment source before the duplicate
                campaign is created.
              </Text>
            </View>

            {!pending ? (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
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
                <Text selectable style={[styles.bannerText, { color: meta.textColor }]}>
                  {banner.text}
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget</Text>
              <Text style={styles.sectionDescription}>
                Minimum duplicate budget is ₦1,000.
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  budgetError && styles.inputWrapError,
                ]}
              >
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  value={budget}
                  onChangeText={onBudgetChange}
                  keyboardType="numeric"
                  placeholder="Enter budget"
                  placeholderTextColor="#64748B"
                  selectionColor="#F43F5E"
                  style={styles.input}
                />
              </View>

              {budgetError ? (
                <Text selectable style={styles.errorText}>
                  {budgetError}
                </Text>
              ) : null}
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="sparkles-outline" size={18} color="#FDE68A" />
              <Text style={styles.infoCardText}>
                Wallet payments confirm fastest. Campaign balances apply first
                when you choose one.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment source</Text>
              <Text style={styles.sectionDescription}>
                Pick the balance that should fund this duplicate campaign.
              </Text>

              <PaymentMethodList
                options={paymentOptions}
                value={paymentBy}
                onChange={onPaymentChange}
                error={paymentError || undefined}
                note={paymentNote}
                emptyState={paymentEmptyState}
              />
            </View>

            {walletShortfallLabel ? (
              <View style={styles.warningCard}>
                <View style={styles.warningCopy}>
                  <Text style={styles.warningTitle}>Wallet funding needed</Text>
                  <Text selectable style={styles.warningText}>
                    {walletShortfallLabel}
                  </Text>
                </View>

                {onTopUp ? (
                  <Pressable
                    onPress={onTopUp}
                    style={({ pressed }) => [
                      styles.topUpButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.topUpButtonText}>Fund wallet</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onConfirm}
            disabled={pending}
            style={({ pressed }) => [
              styles.confirmButton,
              pending && styles.confirmButtonDisabled,
              pressed && !pending && styles.pressed,
            ]}
          >
            {pending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <Text style={styles.confirmButtonText}>
              {pending ? "Processing..." : "Promote again"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#090B10",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#1E222A",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#313745",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#1F0E16",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#141922",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 16,
    paddingBottom: 4,
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
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  sectionDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#252A35",
    backgroundColor: "#0B0D11",
    paddingHorizontal: 16,
  },
  inputWrapError: {
    borderColor: "#FB7185",
  },
  currency: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 58,
    fontFamily: "Nunito-Regular",
  },
  errorText: {
    color: "#FB7185",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5B3B0A",
    backgroundColor: "#1C140A",
    padding: 14,
  },
  infoCardText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  warningCard: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A16207",
    backgroundColor: "#1E160C",
    padding: 14,
  },
  warningCopy: {
    gap: 4,
  },
  warningTitle: {
    color: "#FDE68A",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  warningText: {
    color: "#F8E8B0",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  topUpButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 14,
  },
  topUpButtonText: {
    color: "#0F172A",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.8,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});
