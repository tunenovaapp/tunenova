import { useProfile } from "@/api/auth/auth";
import { useStats } from "@/api/user/user";
import {
  useAddBankAccount,
  useBalance,
  useBankAccounts,
  useVerifyAccount,
  useWithdraw,
  useWithdrawalTransactions,
} from "@/api/wallet/wallet";
import * as Clipboard from "expo-clipboard";
import { RFValue } from "react-native-responsive-fontsize";

import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Animated as RNAnimated,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Animated, {
  FadeInUp,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import CustomPicker from "../../components/CustomPicker";

const { width } = Dimensions.get("window");

// Simple skeleton shimmer component
function Skeleton({ style }: { style?: any }) {
  const shimmerAnim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300], // Adjust for width of skeleton
  });

  return (
    <RNAnimated.View
      style={[
        { backgroundColor: "#222", borderRadius: 8, overflow: "hidden" },
        style,
      ]}
    >
      <RNAnimated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 100,
            backgroundColor: "#333",
            opacity: 0.3,
            transform: [{ translateX }],
            borderRadius: 8,
          },
        ]}
      />
    </RNAnimated.View>
  );
}

// -------------------------------------------------------------------
//  WalletScreen
// -------------------------------------------------------------------
export { Skeleton };
export default function WalletScreen({ navigation }: any) {
  // Reanimated value makes the balance slide/scale in
  const cardAnim = useSharedValue(0);
  const [isSheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    cardAnim.value = withDelay(150, withTiming(1, { duration: 450 }));
  }, []);

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance();
  // Optional "count-up" animation for the balance text
  const balanceSv = useSharedValue(0);
  useEffect(() => {
    let target = 0;
    if (
      !isBalanceLoading &&
      !isBalanceError &&
      balanceData?.data.wallet.balance != null
    ) {
      target = balanceData.data.wallet.balance;
    }
    balanceSv.value = withDelay(300, withTiming(target, { duration: 800 }));
  }, [isBalanceLoading, isBalanceError, balanceData]);

  // Fetch withdrawal transactions
  const { data, isLoading, isError, refetch } = useWithdrawalTransactions({
    page: 1,
    limit: 20,
  });
  const txHistory = data?.data.transactions || [];

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useStats();

  const { data: profileData } = useProfile();
  const referralCode = profileData?.data?.referralCode || "";
  const [copied, setCopied] = React.useState(false);

  const handleCopyReferral = React.useCallback(() => {
    if (referralCode) {
      Clipboard.setStringAsync(referralCode);
      setCopied(true);
      ToastAndroid.show("Referral code copied", 1500);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [referralCode]);

  // -----------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={isLoading ? Array(3).fill({}) : txHistory}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyExtractor={(item, idx) => item.id || `skeleton-${idx}`}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            {isBalanceLoading ? (
              <Skeleton
                style={{
                  height: 120,
                  width: width - 40,
                  alignSelf: "center",
                  marginTop: 16,
                  marginBottom: 16,
                }}
              />
            ) : (
              <View style={[styles.balanceCard]}>
                <Image
                  source={require("../../assets/images/Frame 33540.png")}
                  style={{
                    height: 72,
                    width: 72,
                    position: "absolute",
                    top: 0,
                    right: 0,
                  }}
                />
                <Text style={styles.balanceLabel}>Total balance</Text>
                <Text style={[styles.balance]}>
                  ₦{Number(balanceData?.data.wallet.balance).toFixed(2)}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.withdrawBtn}
                  onPress={() => setSheetVisible(true)}
                >
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Metrics strip */}
            {isStatsLoading ? (
              <View style={[styles.metricStrip, { flexDirection: "row" }]}>
                <Skeleton
                  style={{ flex: 1, height: 48, marginHorizontal: 8 }}
                />
                <Skeleton
                  style={{ flex: 1, height: 48, marginHorizontal: 8 }}
                />
                <Skeleton
                  style={{ flex: 1, height: 48, marginHorizontal: 8 }}
                />
              </View>
            ) : (
              <View style={styles.metricStrip}>
                <Metric
                  icon="musical-notes"
                  label="LISTENS"
                  value={isStatsError ? 0 : stats?.listens ?? 0}
                />
                <View style={styles.vLine} />
                <Metric
                  icon="radar"
                  label="DISCOVERED"
                  family="MaterialCommunityIcons"
                  value={isStatsError ? 0 : stats?.discoveries ?? 0}
                />
                <View style={styles.vLine} />
                <Metric
                  icon="users"
                  family="FontAwesome5"
                  label="REFERRALS"
                  value={isStatsError ? 0 : stats?.referrals ?? 0}
                />
              </View>
            )}

            {/* Invite friends card */}
            {isLoading ? (
              <Skeleton
                style={{
                  height: 70,
                  marginHorizontal: 12,
                  borderRadius: 14,
                  marginVertical: 24,
                }}
              />
            ) : (
              <View style={styles.inviteCard}>
                <Text style={styles.inviteText}>
                  Invite your friends &amp; earn{"\n"}cash when they join.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.inviteBtn}
                  onPress={handleCopyReferral}
                >
                  <Text style={styles.inviteBtnTxt}>
                    {copied ? "Copied!" : "Invite friends"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Transaction history heading */}
            <Text style={styles.txHeading}>Transaction History</Text>
          </>
        }
        renderItem={({ item, index }) =>
          isLoading ? (
            <Skeleton
              style={{
                height: 60,
                marginHorizontal: 16,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />
          ) : (
            <Animated.View
              entering={FadeInUp.delay(70 * index)}
              style={styles.txRow}
            >
              <Text style={styles.txType}>{item.type}</Text>
              <Text style={styles.txAmount}>
                ₦{item.amount.toLocaleString("en-NG")}
              </Text>
              <Text
                style={[
                  styles.txStatus,
                  item.status === "SUCCESSFUL"
                    ? { color: "#34d399" }
                    : { color: "#fb923c" },
                ]}
              >
                {item.status}
              </Text>
            </Animated.View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.txSeparator} />}
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Nunito-Regular" }}>
                No withdrawal transactions found.
              </Text>
            </View>
          ) : null
        }
      />
      <WithdrawSheet
        isVisible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

// -------------------------------------------------------------------
//  Metric helper component
// -------------------------------------------------------------------
function Metric({
  icon,
  family = "Ionicons",
  label,
  value,
}: {
  icon: string;
  family?: "Ionicons" | "FontAwesome5" | "MaterialCommunityIcons";
  label: string;
  value: number;
}) {
  const IconCmp =
    family === "Ionicons"
      ? Ionicons
      : family === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : FontAwesome5;
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <IconCmp
        name={icon as any}
        size={18}
        color="#fff"
      />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

// -------------------------------------------------------------------
//  Withdrawal Bottom Sheet
// -------------------------------------------------------------------

const withdrawalSchema = yup.object().shape({
  amount: yup
    .string()
    .required("Amount is required")
    .matches(/^[0-9.]+$/, "Please enter a valid amount")
    .test(
      "min-amount",
      "Minimum withdrawal is ₦100",
      (value) => !value || Number(value) >= 100
    ),
});

// Separate schema for bank account verification
const bankAccountSchema = yup.object().shape({
  bankCode: yup.string().required("Please select a bank"),
  accountNumber: yup
    .string()
    .required("Account number is required")
    .matches(/^[0-9]{10}$/, "Account number must be 10 digits"),
});

// Schema for withdrawal amount only
const withdrawalAmountSchema = yup.object().shape({
  amount: yup
    .string()
    .required("Amount is required")
    .matches(/^[0-9.]+$/, "Please enter a valid amount")
    .test(
      "min-amount",
      "Minimum withdrawal is ₦100",
      (value) => !value || Number(value) >= 100
    ),
});

const NIGERIAN_BANKS = [
  { label: "Access Bank", value: "044" },
  { label: "Citibank", value: "023" },
  { label: "Ecobank", value: "050" },
  { label: "Fidelity Bank", value: "070" },
  { label: "First Bank", value: "011" },
  { label: "FCMB", value: "214" },
  { label: "GTBank", value: "058" },
  { label: "Keystone Bank", value: "082" },
  { label: "Kuda Bank", value: "50211" },
  { label: "Opay", value: "999992" },
  { label: "Palmpay", value: "999991" },
  { label: "Polaris Bank", value: "076" },
  { label: "Providus Bank", value: "101" },
  { label: "Stanbic IBTC Bank", value: "221" },
  { label: "Standard Chartered Bank", value: "068" },
  { label: "Sterling Bank", value: "232" },
  { label: "UBA", value: "033" },
  { label: "Union Bank", value: "032" },
  { label: "Unity Bank", value: "215" },
  { label: "Wema Bank", value: "035" },
  { label: "Zenith Bank", value: "057" },
];

function WithdrawSheet({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"list" | "add" | "verify" | "amount">(
    "list"
  );
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [verifiedDetails, setVerifiedDetails] = useState<any>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(withdrawalSchema),
    mode: "onChange",
  });

  // Separate form for bank account verification
  const {
    control: bankControl,
    handleSubmit: handleBankSubmit,
    formState: { errors: bankErrors, isValid: isBankValid },
    reset: resetBank,
  } = useForm({
    resolver: yupResolver(bankAccountSchema),
    mode: "onChange",
  });

  // Separate form for withdrawal amount
  const {
    control: amountControl,
    handleSubmit: handleAmountSubmit,
    formState: { errors: amountErrors, isValid: isAmountValid },
    reset: resetAmount,
  } = useForm({
    resolver: yupResolver(withdrawalAmountSchema),
    mode: "onChange",
  });

  const { mutate, isPending, isError } = useWithdraw();
  const [message, setMessage] = useState("");
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const {
    data: bankAccountsData,
    isLoading: areAccountsLoading,
    refetch: refetchBankAccounts,
  } = useBankAccounts();
  const { mutate: verifyAccount, isPending: isVerifying } = useVerifyAccount();
  const { mutate: addBankAccount, isPending: isAdding } = useAddBankAccount();

  const handleAccountSelect = (account: any) => {
    setSelectedAccount(account);
    setStep("amount");
  };

  const handleVerify = (data: any) => {
    console.log("Verifying account:", data);
    console.log("Form data received:", {
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
    });
    setMessage("");
    const bank = NIGERIAN_BANKS.find((b) => b.value === data.bankCode);
    if (!bank) {
      setMessage("Please select a valid bank.");
      return;
    }

    if (!data.accountNumber) {
      setMessage("Please enter your account number");
      return;
    }

    console.log("Calling verifyAccount API...");
    verifyAccount(
      { bankCode: data.bankCode, accountNumber: data.accountNumber },
      {
        onSuccess: ({ data: verifiedData }) => {
          console.log("Account verification successful:", verifiedData);
          setVerifiedDetails({ ...verifiedData, bankName: bank.label });
          setStep("verify");
        },
        onError: (err: any) => {
          console.log("Account verification failed:", err);
          setMessage(
            err?.response?.data?.message || "Could not verify account."
          );
        },
      }
    );
  };

  const handleAddAccount = () => {
    if (!verifiedDetails) return;
    setMessage("");
    const bank = NIGERIAN_BANKS.find(
      (b) => b.value === verifiedDetails.bankCode
    );
    addBankAccount(
      { ...verifiedDetails, bankName: bank?.label || "" },
      {
        onSuccess: () => {
          ToastAndroid.show("Account added!", 1500);
          refetchBankAccounts();
          setStep("list");
          setVerifiedDetails(null);
        },
        onError: (err: any) => {
          setMessage(err?.response?.data?.message || "Could not save account.");
        },
      }
    );
  };

  const onSubmit = (data: any) => {
    console.log("Withdrawal submission:", data);
    if (!selectedAccount) {
      console.log("No selected account");
      return;
    }
    setMessage("");
    console.log("Submitting withdrawal with:", {
      amount: Number(data.amount),
      bankAccountId: selectedAccount.id,
    });
    mutate(
      {
        amount: Number(data.amount),
        bankAccountId: selectedAccount.id,
      },
      {
        onSuccess: () => {
          console.log("Withdrawal successful");
          setMessage("Withdrawal successful!");
          ToastAndroid.show("Withdrawal request submitted!", 2000);
          setTimeout(() => {
            onClose();
            setMessage("");
            reset();
          }, 1500);
        },
        onError: (err: any) => {
          console.log("Withdrawal failed:", err);
          setMessage("Withdrawal failed, try again later");
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    resetBank();
    resetAmount();
    setMessage("");
    setStep("list");
    setVerifiedDetails(null);
    setSelectedAccount(null);
    onClose();
  };

  const handleBack = () => {
    setMessage("");
    if (step === "amount") {
      setSelectedAccount(null);
      setStep("list");
    } else if (step === "verify") {
      setVerifiedDetails(null);
      setStep("add");
    } else if (step === "add") {
      setStep("list");
    }
  };

  const renderContent = () => {
    if (step === "add") {
      return (
        <>
          {/* Form for adding a new account */}
          <Controller
            control={bankControl}
            name="bankCode"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank</Text>
                <CustomPicker
                  onChange={onChange}
                  options={NIGERIAN_BANKS}
                  placeholder="Select a bank"
                  value={value}
                  modalTitle="Choose a Bank"
                />
                {bankErrors.bankCode && (
                  <Text style={styles.errorText}>
                    {bankErrors.bankCode.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={bankControl}
            name="accountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit account number"
                  keyboardType="numeric"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value != null ? String(value) : ""}
                />
                {bankErrors.accountNumber && (
                  <Text style={styles.errorText}>
                    {bankErrors.accountNumber.message}
                  </Text>
                )}
              </View>
            )}
          />
          <TouchableOpacity
            style={[styles.submitBtn, !isBankValid && { opacity: 0.6 }]}
            onPress={() => {
              console.log("Verify button pressed");
              console.log("Form validity:", isBankValid);
              console.log("Bank errors:", bankErrors);
              handleBankSubmit(handleVerify)();
            }}
            disabled={isVerifying || !isBankValid}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Verify Account</Text>
            )}
          </TouchableOpacity>
          {message && <Text style={styles.inlineErrorText}>{message}</Text>}
        </>
      );
    }

    if (step === "verify") {
      return (
        <View style={{ alignItems: "center" }}>
          <Text style={styles.inputLabel}>Account Name</Text>
          <Text style={styles.verifiedName}>
            {verifiedDetails?.accountName}
          </Text>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAddAccount}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Save and Continue</Text>
            )}
          </TouchableOpacity>
          {message && <Text style={styles.inlineErrorText}>{message}</Text>}
        </View>
      );
    }

    // Default step: 'list'
    return (
      <>
        {areAccountsLoading ? (
          <ActivityIndicator
            color="#fff"
            style={{ marginVertical: 20 }}
          />
        ) : bankAccountsData && bankAccountsData.data.length > 0 ? (
          bankAccountsData?.data.map((account) => (
            <TouchableOpacity
              key={account.accountNumber}
              style={styles.accountItem}
              onPress={() => handleAccountSelect(account)}
            >
              <FontAwesome5
                name="university"
                size={24}
                color="#fff"
              />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.accountName}>{account.bankName}</Text>
                <Text style={styles.accountNumber}>
                  {account.accountNumber}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No saved accounts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add an account to get started
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.addAccountBtn}
          onPress={() => setStep("add")}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#fff"
          />
          <Text style={styles.addAccountBtnText}>Add new bank account</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderAmountStep = () => {
    if (!selectedAccount) return null;
    return (
      <>
        <View style={styles.accountItem}>
          <FontAwesome5
            name="university"
            size={24}
            color="#fff"
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.accountName}>{selectedAccount.bankName}</Text>
            <Text style={styles.accountNumber}>
              {selectedAccount.accountNumber}
            </Text>
          </View>
        </View>
        {/* Show current balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceRowLabel}>Current Balance</Text>
          {isBalanceLoading ? (
            <ActivityIndicator
              color="#fff"
              size="small"
              style={{ marginLeft: 8 }}
            />
          ) : (
            <Text style={styles.balanceRowAmount}>
              ₦
              {balanceData?.data?.wallet?.balance?.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              }) ?? "0.00"}
            </Text>
          )}
        </View>
        <Controller
          control={amountControl}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5000"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value != null ? String(value) : ""}
              />
              {amountErrors.amount && (
                <Text style={styles.errorText}>
                  {amountErrors.amount.message}
                </Text>
              )}
            </View>
          )}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "#27272a",
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              marginRight: 12,
              marginTop: 2,
            }}
          >
            <Entypo
              name="info-with-circle"
              size={20}
              color="#ef4444"
            />
          </View>
          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={{
                color: "#ef4444",
                fontFamily: "Nunito-Bold",
                fontSize: RFValue(14),
                marginBottom: 4,
              }}
            >
              Withdrawal Fees
            </Text>
            <Text
              style={{
                color: "#9ca3af",
                fontFamily: "Nunito-Regular",
                fontSize: RFValue(12),
                lineHeight: RFValue(18),
              }}
            >
              • N10 for amounts below ₦5,000{"\n"}• N25 for amounts ₦5,000 -
              ₦50,000{"\n"}• N50 for amounts above ₦50,000
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !isAmountValid && { opacity: 0.6 }]}
          onPress={() => {
            console.log("Withdrawal button pressed");
            console.log("Amount form validity:", isAmountValid);
            console.log("Amount errors:", amountErrors);
            handleAmountSubmit(onSubmit)();
          }}
          disabled={!isAmountValid || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Withdrawal</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      style={styles.sheetModal}
      avoidKeyboard
    >
      <View style={styles.sheetContainer}>
        <View style={styles.sheetGrabber} />
        <View style={styles.sheetHeader}>
          {step !== "list" ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.sheetNavButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.sheetNavButton} />
          )}
          <Text style={styles.sheetTitle}>
            {step === "list" && "Select Account"}
            {step === "add" && "Add New Account"}
            {step === "verify" && "Verify Account"}
            {step === "amount" && "Enter Amount"}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.sheetCloseButton}
          >
            <Ionicons
              name="close"
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sheetContent}>
          {step === "amount" ? renderAmountStep() : renderContent()}
          {message && step === "amount" && (
            <Text
              style={{
                color: isError ? "#f43f5e" : "#22c55e",
                textAlign: "center",
                marginTop: 15,
                fontFamily: "Nunito-Regular",
              }}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*                               Styles                               */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  /* -------- Balance card -------- */
  balanceCard: {
    width: width - 40,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fff",
    padding: 24,
    marginTop: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1C1D1E",
  },
  balanceDecor: {
    position: "absolute",
    right: 16,
    top: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  bar: {
    width: 10,
    borderRadius: 4,
    backgroundColor: "#ff003c",
  },
  balanceLabel: {
    color: "#d1d5db",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Regular",
  },
  balance: {
    fontSize: RFValue(32),
    fontFamily: "Nunito-Medium",
    color: "#fff",
    marginTop: 4,
    marginBottom: 10,
  },
  withdrawBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#ff003c",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  withdrawText: {
    color: "#fff",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Medium",
  },

  /* -------- Metric strip -------- */
  metricStrip: {
    marginTop: 28,
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
  },
  vLine: {
    width: 1,
    backgroundColor: "#27272a",
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: RFValue(11),
    marginTop: 4,
    fontFamily: "Nunito-Regular",
  },
  metricValue: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    marginTop: 2,
    fontSize: RFValue(16),
  },

  /* -------- Invite friends card - */
  inviteCard: {
    backgroundColor: "#fff",
    marginVertical: 20,
    marginHorizontal: 12,
    padding: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteText: {
    color: "#000",
    fontSize: RFValue(12),
    fontFamily: "Montserrat-Medium",
    flex: 1,
  },
  inviteBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteBtnTxt: { color: "#fff", fontWeight: "600" },

  /* -------- Transaction list ---- */
  txHeading: {
    color: "#d1d5db",
    fontSize: RFValue(20),
    fontFamily: "Nunito-Medium",
    marginLeft: 16,
    marginBottom: 16,
  },
  txRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  txType: { color: "#fff", marginBottom: 4 },
  txAmount: {
    color: "#fff",
    fontSize: RFValue(20),
    fontFamily: "Nunito-Medium",
    marginBottom: 4,
  },
  txStatus: {
    position: "absolute",
    right: 16,
    top: 24,
    fontFamily: "Nunito-Medium",
  },
  txSeparator: { height: 1, backgroundColor: "#27272a" },

  // New styles for the react-native-modal sheet
  sheetModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheetContainer: {
    backgroundColor: "#1C1D1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
  },
  sheetGrabber: {
    width: 40,
    height: 5,
    backgroundColor: "#444",
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sheetTitle: {
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
    color: "#fff",
  },
  sheetBalance: {
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "right",
  },
  sheetNavButton: {
    padding: 5,
    width: 34, // to balance the flexbox layout
  },
  sheetCloseButton: {
    padding: 5,
  },
  sheetContent: {
    paddingTop: 20,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#27272a",
    borderRadius: 8,
    marginBottom: 12,
  },
  accountName: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    fontSize: RFValue(14),
  },
  accountNumber: {
    color: "#9ca3af",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
  addAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 8,
  },
  addAccountBtnText: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    fontSize: RFValue(14),
    marginLeft: 8,
  },
  verifiedName: {
    fontSize: RFValue(22),
    fontFamily: "Nunito-Bold",
    color: "#fff",
    marginVertical: 16,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: "#d1d5db",
    fontSize: RFValue(12),
    fontFamily: "Nunito-Regular",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#27272a",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: RFValue(14),
  },
  errorText: {
    color: "#f43f5e",
    fontSize: RFValue(11),
    marginTop: 5,
  },
  submitBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    fontSize: RFValue(16),
  },
  emptyStateSubtext: {
    color: "#9ca3af",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
    marginTop: 4,
  },
  inlineErrorText: {
    color: "#f43f5e",
    textAlign: "center",
    marginTop: 15,
    fontFamily: "Nunito-Regular",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  balanceRowLabel: {
    color: "#9ca3af",
    fontSize: RFValue(12),
    fontFamily: "Nunito-Regular",
    marginRight: 8,
  },
  balanceRowAmount: {
    color: "#fff",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Bold",
  },
});
