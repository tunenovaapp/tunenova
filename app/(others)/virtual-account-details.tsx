import { useVirtualAccount } from "@/api/wallet/wallet";
import { VirtualAccountDetailRow } from "@/components/wallet/virtual-account-detail-row";
import { VirtualAccountHero } from "@/components/wallet/virtual-account-hero";
import { VirtualAccountState } from "@/components/wallet/virtual-account-state";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CopiedField = "accountNumber" | "bankName" | "accountName" | null;

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function InstructionStep({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function VirtualAccountDetailsScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const params = useLocalSearchParams<{
    accountNumber?: string | string[];
    bankName?: string | string[];
    accountName?: string | string[];
    budget?: string | string[];
    id?: string | string[];
  }>();

  const routeAccountNumber = normalizeParam(params.accountNumber);
  const routeBankName = normalizeParam(params.bankName);
  const routeAccountName = normalizeParam(params.accountName);
  const routeBudget = normalizeParam(params.budget);
  const routeCampaignId = normalizeParam(params.id);

  const { data, isLoading, isError, refetch } = useVirtualAccount();

  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const mode: "campaign" | "wallet" = routeBudget || routeCampaignId
    ? "campaign"
    : "wallet";

  const details = useMemo(
    () => ({
      accountNumber: routeAccountNumber || data?.data?.accountNumber || "",
      bankName: routeBankName || data?.data?.bankName || "",
      accountName: routeAccountName || data?.data?.accountName || "",
    }),
    [
      data?.data?.accountName,
      data?.data?.accountNumber,
      data?.data?.bankName,
      routeAccountName,
      routeAccountNumber,
      routeBankName,
    ],
  );

  const hasResolvedDetails = Boolean(
    details.accountNumber && details.bankName && details.accountName,
  );

  const parsedBudget = routeBudget ? Number(routeBudget) : NaN;
  const budgetLabel =
    routeBudget && !Number.isNaN(parsedBudget)
      ? formatCurrency(parsedBudget)
      : routeBudget || null;

  const instructions = mode === "campaign"
    ? [
        {
          title: "Copy the account number",
          body: "Use the main action to copy the account number before leaving the app.",
        },
        {
          title: "Transfer the campaign amount",
          body: budgetLabel
            ? `Send exactly ${budgetLabel} to reduce payment confusion and speed up reconciliation.`
            : "Transfer the expected campaign amount into this account.",
        },
        {
          title: "Return after payment",
          body: "Once you have made the transfer, head back to your campaign and continue from there.",
        },
      ]
    : [
        {
          title: "Copy the account number",
          body: "This is the quickest way to move the bank details into your banking app.",
        },
        {
          title: "Make the transfer",
          body: "Use the bank name and account name below to confirm you are funding the right Tunenova account.",
        },
        {
          title: "Come back to your wallet",
          body: "After the transfer, return to the wallet screen and refresh if you need to confirm the balance update.",
        },
      ];

  const pageTitle = mode === "campaign" ? "Fund Campaign" : "Virtual Account";
  const footerButtonLabel =
    mode === "campaign" ? "I've made the transfer" : "Back to wallet";

  const handleCopy = async (field: Exclude<CopiedField, null>, label: string, value: string) => {
    if (!value) {
      return;
    }

    await Clipboard.setStringAsync(value);
    setCopiedField(field);

    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied`);
    }

    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1400);
  };

  const handleFooterAction = () => {
    if (mode === "campaign") {
      if (routeCampaignId) {
        router.replace({
          pathname: "/(others)/campaignId",
          params: { id: routeCampaignId },
        });
        return;
      }

      router.replace("/(tabs)/promote");
      return;
    }

    router.replace("/(tabs)/wallet");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: pageTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#05070A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontFamily: "Nunito-Bold", fontSize: 18 },
          contentStyle: { backgroundColor: "#05070A" },
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + 32 },
        ]}
      >
        {isLoading && !hasResolvedDetails ? (
          <VirtualAccountState kind="loading" />
        ) : !hasResolvedDetails ? (
          <VirtualAccountState
            kind={isError ? "error" : "empty"}
            title={
              isError
                ? "Could not load payment details"
                : "No virtual account details yet"
            }
            description={
              isError
                ? "Your payment details are temporarily unavailable. Refresh and try again."
                : "We could not find a virtual account for this flow right now."
            }
            actionLabel={isError ? "Try again" : "Back to wallet"}
            onAction={isError ? () => refetch() : handleFooterAction}
          />
        ) : (
          <>
            <VirtualAccountHero
              mode={mode}
              accountNumber={details.accountNumber}
              copied={copiedField === "accountNumber"}
              budgetLabel={budgetLabel}
              onCopy={() =>
                handleCopy("accountNumber", "Account number", details.accountNumber)
              }
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment details</Text>
              <Text style={styles.sectionBody}>
                Confirm the destination details before you make the transfer.
              </Text>

              <View style={styles.detailStack}>
                <VirtualAccountDetailRow
                  icon="business-outline"
                  label="Bank"
                  value={details.bankName}
                  copied={copiedField === "bankName"}
                  onCopy={() => handleCopy("bankName", "Bank name", details.bankName)}
                />
                <VirtualAccountDetailRow
                  icon="person-circle-outline"
                  label="Account name"
                  value={details.accountName}
                  copied={copiedField === "accountName"}
                  onCopy={() =>
                    handleCopy("accountName", "Account name", details.accountName)
                  }
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to fund</Text>
              <Text style={styles.sectionBody}>
                Follow these quick steps so the transfer is easy to complete and
                easy to verify afterwards.
              </Text>

              <View style={styles.stepsCard}>
                {instructions.map((item, index) => (
                  <InstructionStep
                    key={item.title}
                    index={index + 1}
                    title={item.title}
                    body={item.body}
                  />
                ))}
              </View>
            </View>

            <View style={styles.footerCard}>
              <View style={styles.footerCopy}>
                <Text style={styles.footerTitle}>
                  {mode === "campaign"
                    ? "Made the transfer already?"
                    : "Finished copying the details?"}
                </Text>
                <Text style={styles.footerBody}>
                  {mode === "campaign"
                    ? "Return to your campaign flow after payment so you can continue tracking it."
                    : "Head back to the wallet once you are done with the bank transfer."}
                </Text>
              </View>

              <Pressable
                onPress={handleFooterAction}
                style={({ pressed }) => [
                  styles.footerButton,
                  isCompact && styles.footerButtonCompact,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.footerButtonText}>{footerButtonLabel}</Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={18}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    backgroundColor: "#05070A",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "Nunito-Bold",
  },
  sectionBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  detailStack: {
    gap: 12,
  },
  stepsCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  stepCopy: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  stepBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  footerCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#232833",
    backgroundColor: "#0D0B10",
    padding: 18,
    gap: 14,
  },
  footerCopy: {
    gap: 4,
  },
  footerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  footerBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  footerButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerButtonCompact: {
    paddingHorizontal: 12,
  },
  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});
