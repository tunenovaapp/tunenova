import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { useCoupons } from "@/api/user/user";
import { useBalance } from "@/api/wallet/wallet";
import CustomPicker from "@/components/CustomPicker";
import { Entypo } from "@expo/vector-icons";
import { UseQueryResult, useQueryClient } from "@tanstack/react-query";
import Modal from "react-native-modal";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CampaignResponse,
  useCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
} from "../../api/campaign/campaign";

// Cross-platform toast helper
function showToast(message: string) {
  if (Platform.OS === "android") {
    // @ts-ignore
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("Info", message);
  }
}

export default function CampaignAnalyticsScreen() {
  const { id, platform } = useLocalSearchParams<{
    id: string;
    platform: string;
  }>();
  const { data, isLoading, error } = useCampaign(id) as UseQueryResult<
    CampaignResponse,
    any
  >;

  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();
  const queryClient = useQueryClient();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { data: couponsData, isLoading: isCouponsLoading } = useCoupons();

  const campaign = data?.data;
  const listeners = campaign?.analytics?.listens ?? 0;
  const fans = campaign?.analytics?.discoveries ?? 0;

  const [isPromoteSheetVisible, setPromoteSheetVisible] = useState(false);
  const [promoteBudget, setPromoteBudget] = useState("");
  const [promotePaymentBy, setPromotePaymentBy] = useState<string | undefined>(
    undefined
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#ff003c"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: "white" }}>Error loading campaign data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {/* --------------------------- HEADER ------------------------- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 24,
          marginTop: 10,
          marginBottom: 25,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Entypo
            name="chevron-left"
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: RFValue(18),
            fontFamily: "Nunito-ExtraBold",
            color: "#fff",
          }}
        >
          Campaign Analytics
        </Text>
      </View>
      {/* -------------------- Metrics blocks ------------------------ */}
      <MetricBlock
        title="Total Listeners"
        description="No of people who listened to your song on Tunenova."
        value={listeners}
      />
      <MetricBlock
        title="Total Fans"
        description={`No of people who liked & discovered your song on ${
          platform ? platform : "the platform"
        }.`}
        value={fans}
      />
      {/* Paystack payment button if paid and pending */}
      {campaign?.isPaid && campaign?.status === "pending" && (
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#ff003c",
              marginBottom: 10,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            router.replace({
              pathname: "/(others)/virtual-account-details",
              params: {
                accountNumber: data?.data?.virtualAccountNumber || "",
                bankName: data?.data?.virtualAccountBank || "",
                accountName: data?.data?.virtualAccountName || "",
                budget: data?.data.budget,
                id: id,
              },
            });
          }}
        >
          <Text style={[styles.ctaTxt, { color: "#ff003c" }]}>
            Complete Payment
          </Text>
        </TouchableOpacity>
      )}
      {/* -------------------- CTA ---------------------------------- */}
      {data?.data.isPaid && data.data.paymentStatus === "pending" ? (
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          disabled={deleteMutation.status === "pending"}
          onPress={async () => {
            try {
              await deleteMutation.mutateAsync(id);
              router.replace("/(tabs)/analytics");
            } catch (err: any) {
              alert(err.message || "Failed to delete campaign");
            }
          }}
        >
          <Text style={styles.ctaTxt}>
            {deleteMutation.status === "pending"
              ? "Deleting..."
              : "Delete Draft"}
          </Text>
        </TouchableOpacity>
      ) : campaign?.complete ? (
        <>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => setPromoteSheetVisible(true)}
          >
            <Text style={styles.ctaTxt}>Promote Again</Text>
          </TouchableOpacity>
          <Modal
            isVisible={isPromoteSheetVisible}
            onBackdropPress={() => setPromoteSheetVisible(false)}
            onBackButtonPress={() => setPromoteSheetVisible(false)}
            style={{ justifyContent: "flex-end", margin: 0 }}
            avoidKeyboard
          >
            <View style={styles.sheetContainer}>
              <Text style={styles.sheetTitle}>Promote Campaign Again</Text>
              <Text style={styles.sheetDesc}>
                Enter a new budget and select payment method to promote your
                campaign again.
              </Text>
              <Text style={styles.sheetLabel}>Budget (₦)</Text>
              <View style={styles.sheetInputWrapper}>
                <Text style={{ color: "#fff", fontSize: 18, marginRight: 6 }}>
                  ₦
                </Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={promoteBudget}
                  onChangeText={setPromoteBudget}
                />
              </View>
              <Text style={styles.sheetLabel}>Payment By</Text>
              <CustomPicker
                options={[
                  {
                    label: isBalanceLoading
                      ? "Wallet (loading...)"
                      : `Wallet${
                          balanceData?.data?.wallet?.balance != null
                            ? ` (₦${Number(
                                balanceData.data.wallet.balance
                              ).toLocaleString("en-NG", {
                                minimumFractionDigits: 2,
                              })})`
                            : ""
                        }`,
                    value: "wallet",
                  },
                  ...(isCouponsLoading
                    ? [{ label: "Coupons (loading...)", value: "coupon" }]
                    : couponsData?.data && couponsData.data.length > 0
                    ? couponsData.data.map((coupon) => ({
                        label: `Coupon (${coupon.value}) - ₦${Number(
                          coupon.balance
                        ).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}`,
                        value: coupon.value,
                      }))
                    : [{ label: "No coupons available", value: "none" }]),
                ]}
                value={promotePaymentBy}
                onChange={(val) => {
                  if (val === "none" || val === "coupon") return;
                  setPromotePaymentBy(val);
                }}
                placeholder="Select payment method"
                modalTitle="Select payment method"
              />
              <TouchableOpacity
                style={styles.sheetConfirmBtn}
                onPress={async () => {
                  const budgetNum = Number(promoteBudget);
                  if (isNaN(budgetNum) || budgetNum < 1000) {
                    showToast("Minimum budget is ₦1000");
                    return;
                  }
                  if (
                    promotePaymentBy === "wallet" &&
                    budgetNum > (balanceData?.data?.wallet?.balance ?? 0)
                  ) {
                    showToast("Insufficient wallet balance");
                    return;
                  }
                  let couponId: string | undefined = undefined;
                  if (
                    promotePaymentBy &&
                    promotePaymentBy !== "wallet" &&
                    promotePaymentBy !== "none"
                  ) {
                    // promotePaymentBy is the coupon value (id or code)
                    const coupon = couponsData?.data?.find(
                      (c) => c.value === promotePaymentBy
                    );
                    if (coupon) couponId = coupon.id.toString();
                  }
                  duplicateMutation.mutate(
                    {
                      campaignId: id!,
                      newBudget: budgetNum,
                      couponId,
                    },
                    {
                      onSuccess: (res) => {
                        setPromoteSheetVisible(false);
                        if (res.success) {
                          showToast("Campaign duplicated and activated!");
                          // Invalidate relevant queries
                          queryClient.invalidateQueries({
                            queryKey: ["my-campaigns"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["campaigns"],
                          });
                          // Redirect to analytics page
                          router.replace("/(tabs)/analytics");
                        } else {
                          showToast(res.message);
                        }
                      },
                      onError: (err: any) => {
                        showToast(
                          err?.response?.data?.message ||
                            err.message ||
                            "Error duplicating campaign"
                        );
                      },
                    }
                  );
                }}
                disabled={
                  !promoteBudget ||
                  !promotePaymentBy ||
                  duplicateMutation.isPending
                }
              >
                <Text style={styles.sheetConfirmBtnText}>
                  {duplicateMutation.isPending ? "Processing..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </>
      ) : (
        <></>
      )}
    </SafeAreaView>
  );
}

/* ------------------- Metric block helper -------------------------- */
function MetricBlock({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: number;
}) {
  return (
    <View style={styles.metric}>
      <View style={{ flex: 1 }}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricDesc}>{description}</Text>
      </View>

      <Text style={styles.metricNumber}>{value}</Text>
    </View>
  );
}

/* ------------------- Tab helper ----------------------------------- */

/* ------------------- Styles --------------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  h1: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },

  metric: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 24,
    marginBottom: 36,
  },
  metricTitle: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Medium",
  },
  metricDesc: {
    color: "#d1d5db",
    marginTop: 6,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  metricNumber: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    marginLeft: 10,
  },

  cta: {
    backgroundColor: "#ff003c",
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 110, // keeps above tab bar
  },
  ctaTxt: { color: "#fff", fontSize: 18, fontFamily: "Nunito-Medium" },
  // Bottom sheet styles
  sheetContainer: {
    backgroundColor: "#18181b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  sheetDesc: {
    color: "#9ca3af",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    marginBottom: 18,
    textAlign: "center",
  },
  sheetLabel: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Nunito-Medium",
    marginTop: 10,
    marginBottom: 6,
  },
  sheetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#232326",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sheetInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: 48,
    fontFamily: "Nunito-Regular",
  },
  sheetConfirmBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },
  sheetConfirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
});
