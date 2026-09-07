import { yupResolver } from "@hookform/resolvers/yup";
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as yup from "yup";

import {
  useAddBankAccount,
  useBalance,
  useBankAccounts,
  useVerifyAccount,
  useWithdraw,
} from "@/api/wallet/wallet";
import CustomPicker from "@/components/CustomPicker";
import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type WithdrawStep = "list" | "add" | "verify" | "amount";

type SavedBankAccount = {
  id: string | number;
  bankName: string | null;
  accountNumber: string | null;
  accountName?: string | null;
  isDefault?: boolean;
};

type VerifiedAccountDetails = {
  accountName: string;
  accountNumber: string;
  bankId: string;
  bankCode: string;
  bankName: string;
};

type SheetBanner = {
  tone: "error" | "success" | "info";
  text: string;
};

type BankFormShape = {
  bankCode: string;
  accountNumber: string;
};

type AmountFormShape = {
  amount: string;
};

const bankAccountSchema = yup.object({
  bankCode: yup.string().required("Please select a bank"),
  accountNumber: yup
    .string()
    .required("Account number is required")
    .matches(/^[0-9]{10}$/, "Account number must be 10 digits"),
});

const withdrawalAmountSchema = yup.object({
  amount: yup
    .string()
    .required("Amount is required")
    .matches(/^[0-9.]+$/, "Please enter a valid amount")
    .test("min-amount", "Minimum withdrawal is \u20A61", (value) => {
      if (!value) return false;
      return Number(value) >= 1;
    }),
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

const STEP_META: { key: WithdrawStep; label: string }[] = [
  { key: "list", label: "Account" },
  { key: "add", label: "Add" },
  { key: "verify", label: "Verify" },
  { key: "amount", label: "Amount" },
];

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const bannerMeta = {
  info: {
    icon: "information-circle-outline" as const,
    backgroundColor: "#0E1B33",
    borderColor: "#1D4ED8",
    textColor: "#DBEAFE",
  },
  success: {
    icon: "checkmark-circle-outline" as const,
    backgroundColor: "#0D1F16",
    borderColor: "#166534",
    textColor: "#DCFCE7",
  },
  error: {
    icon: "alert-circle-outline" as const,
    backgroundColor: "#2A0F18",
    borderColor: "#BE123C",
    textColor: "#FFE4E6",
  },
};

export function WithdrawSheet({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const [step, setStep] = useState<WithdrawStep>("list");
  const [selectedAccount, setSelectedAccount] = useState<SavedBankAccount | null>(null);
  const [verifiedDetails, setVerifiedDetails] = useState<VerifiedAccountDetails | null>(null);
  const [banner, setBanner] = useState<SheetBanner | null>(null);

  const {
    control: bankControl,
    handleSubmit: handleBankSubmit,
    formState: { errors: bankErrors, isValid: isBankValid },
    reset: resetBankForm,
  } = useForm<BankFormShape>({
    resolver: yupResolver(bankAccountSchema),
    mode: "onChange",
    defaultValues: {
      bankCode: "",
      accountNumber: "",
    },
  });

  const {
    control: amountControl,
    handleSubmit: handleAmountSubmit,
    formState: { errors: amountErrors, isValid: isAmountValid },
    reset: resetAmountForm,
  } = useForm<AmountFormShape>({
    resolver: yupResolver(withdrawalAmountSchema),
    mode: "onChange",
    defaultValues: {
      amount: "",
    },
  });

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const {
    data: bankAccountsData,
    isLoading: areAccountsLoading,
    refetch: refetchBankAccounts,
  } = useBankAccounts();
  const { mutate: verifyAccount, isPending: isVerifying } = useVerifyAccount();
  const { mutate: addBankAccount, isPending: isAdding } = useAddBankAccount();
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdraw();

  const savedAccounts = useMemo(
    () => ((bankAccountsData?.data ?? []) as SavedBankAccount[]),
    [bankAccountsData?.data],
  );
  const currentBalance = balanceData?.data?.wallet?.balance ?? 0;
  const isBusy = isVerifying || isAdding || isWithdrawing;
  const currentStepIndex = STEP_META.findIndex((item) => item.key === step);

  const resetSheetState = () => {
    resetBankForm();
    resetAmountForm();
    setBanner(null);
    setStep("list");
    setSelectedAccount(null);
    setVerifiedDetails(null);
  };

  const guardedClose = () => {
    if (isBusy) {
      return;
    }
    resetSheetState();
    onClose();
  };

  const handleBack = () => {
    if (isBusy) {
      return;
    }

    setBanner(null);

    if (step === "amount") {
      setSelectedAccount(null);
      resetAmountForm();
      setStep("list");
      return;
    }

    if (step === "verify") {
      setVerifiedDetails(null);
      setStep("add");
      return;
    }

    if (step === "add") {
      setStep("list");
    }
  };

  const handleSelectAccount = (account: SavedBankAccount) => {
    setBanner(null);
    setSelectedAccount(account);
    resetAmountForm();
    setStep("amount");
  };

  const handleVerifyAccount = (data: BankFormShape) => {
    setBanner(null);
    const bank = NIGERIAN_BANKS.find((item) => item.value === data.bankCode);

    if (!bank) {
      setBanner({
        tone: "error",
        text: "Please select a valid bank before you continue.",
      });
      return;
    }

    verifyAccount(
      { bankCode: data.bankCode, accountNumber: data.accountNumber },
      {
        onSuccess: ({ data: verifiedData }) => {
          setVerifiedDetails({ ...verifiedData, bankName: bank.label });
          setStep("verify");
        },
        onError: (error: any) => {
          setBanner({
            tone: "error",
            text: error?.response?.data?.message || "Could not verify account.",
          });
        },
      },
    );
  };

  const handleSaveAccount = () => {
    if (!verifiedDetails) {
      return;
    }

    setBanner(null);

    addBankAccount(verifiedDetails, {
      onSuccess: () => {
        if (Platform.OS === "android") {
          ToastAndroid.show("Account added", ToastAndroid.SHORT);
        }
        refetchBankAccounts();
        setBanner({
          tone: "success",
          text: "Bank account added. You can select it for withdrawal now.",
        });
        setVerifiedDetails(null);
        resetBankForm();
        setStep("list");
      },
      onError: (error: any) => {
        setBanner({
          tone: "error",
          text: error?.response?.data?.message || "Could not save account.",
        });
      },
    });
  };

  const handleWithdraw = (data: AmountFormShape) => {
    if (!selectedAccount) {
      return;
    }

    const amount = Number(data.amount);
    setBanner(null);

    if (amount > currentBalance) {
      setBanner({
        tone: "error",
        text: "Withdrawal amount exceeds your available balance.",
      });
      return;
    }

    withdraw(
      {
        amount,
        bankAccountId: selectedAccount.id,
      },
      {
        onSuccess: () => {
          if (Platform.OS === "android") {
            ToastAndroid.show("Withdrawal request submitted", ToastAndroid.SHORT);
          }
          setBanner({
            tone: "success",
            text: "Withdrawal request submitted successfully.",
          });
          setTimeout(() => {
            resetSheetState();
            onClose();
          }, 900);
        },
        onError: (error: any) => {
          setBanner({
            tone: "error",
            text:
              error?.response?.data?.message ||
              "Withdrawal failed. Please try again later.",
          });
        },
      },
    );
  };

  const renderBanner = () => {
    if (!banner) {
      return null;
    }

    const meta = bannerMeta[banner.tone];

    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: meta.backgroundColor,
            borderColor: meta.borderColor,
          },
        ]}
      >
        <Ionicons name={meta.icon} size={18} color={meta.textColor} />
        <Text style={[styles.bannerText, { color: meta.textColor }]}>
          {banner.text}
        </Text>
      </View>
    );
  };

  const renderSavedAccounts = () => {
    if (areAccountsLoading) {
      return (
        <View style={styles.sectionStack}>
          <WalletSkeleton style={{ height: 84 }} />
          <WalletSkeleton style={{ height: 84 }} />
          <WalletSkeleton style={{ height: 54 }} />
        </View>
      );
    }

    if (!savedAccounts.length) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
          <Text style={styles.emptyTitle}>No saved bank accounts yet</Text>
          <Text style={styles.emptyText}>
            Add a withdrawal account once, then reuse it anytime you cash out.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionStack}>
        {savedAccounts.map((account) => (
          <Pressable
            key={String(account.id ?? account.accountNumber)}
            onPress={() => handleSelectAccount(account)}
            style={({ pressed }) => [
              styles.accountCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.accountIconWrap}>
              <FontAwesome5 name="university" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.accountCopy}>
              <View style={styles.accountTopRow}>
                <Text style={styles.accountTitle}>{account.bankName || "Bank account"}</Text>
                {account.isDefault ? (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>Default</Text>
                  </View>
                ) : null}
              </View>
              <Text selectable style={styles.accountNumberText}>
                {account.accountNumber}
              </Text>
              {account.accountName ? (
                <Text style={styles.accountMeta}>{account.accountName}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderAddAccountStep = () => (
    <View style={styles.sectionStack}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bank</Text>
        <Controller
          control={bankControl}
          name="bankCode"
          render={({ field: { onChange, value } }) => (
            <>
              <CustomPicker
                onChange={(nextValue) => {
                  setBanner(null);
                  onChange(nextValue);
                }}
                options={NIGERIAN_BANKS}
                placeholder="Select a bank"
                value={value}
                modalTitle="Choose a bank"
              />
              {bankErrors.bankCode ? (
                <Text style={styles.errorText}>{bankErrors.bankCode.message}</Text>
              ) : null}
            </>
          )}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Account number</Text>
        <Controller
          control={bankControl}
          name="accountNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, bankErrors.accountNumber && styles.inputError]}
                placeholder="10-digit account number"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={10}
                onBlur={onBlur}
                onChangeText={(text) => {
                  setBanner(null);
                  onChange(text.replace(/\D/g, ""));
                }}
                value={value}
              />
              {bankErrors.accountNumber ? (
                <Text style={styles.errorText}>
                  {bankErrors.accountNumber.message}
                </Text>
              ) : null}
            </>
          )}
        />
      </View>

      <Pressable
        onPress={() => handleBankSubmit(handleVerifyAccount)()}
        disabled={isVerifying || !isBankValid}
        style={({ pressed }) => [
          styles.primaryButton,
          (isVerifying || !isBankValid) && styles.buttonDisabled,
          pressed && !isVerifying && isBankValid && styles.pressed,
        ]}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Verify account</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.sectionStack}>
      <View style={styles.verifiedCard}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#22C55E" />
        <Text style={styles.verifiedTitle}>Account verified</Text>
        <Text style={styles.verifiedName}>{verifiedDetails?.accountName}</Text>
        <Text selectable style={styles.verifiedMeta}>
          {verifiedDetails?.bankName} · {verifiedDetails?.accountNumber}
        </Text>
      </View>

      <Pressable
        onPress={handleSaveAccount}
        disabled={isAdding}
        style={({ pressed }) => [
          styles.primaryButton,
          isAdding && styles.buttonDisabled,
          pressed && !isAdding && styles.pressed,
        ]}
      >
        {isAdding ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Save and continue</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderAmountStep = () => {
    if (!selectedAccount) {
      return null;
    }

    return (
      <View style={styles.sectionStack}>
        <View style={styles.accountCard}>
          <View style={styles.accountIconWrap}>
            <FontAwesome5 name="university" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>{selectedAccount.bankName}</Text>
            <Text selectable style={styles.accountNumberText}>
              {selectedAccount.accountNumber}
            </Text>
          </View>
        </View>

        <View style={styles.balanceChip}>
          <Text style={styles.balanceChipLabel}>Current balance</Text>
          {isBalanceLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text selectable style={styles.balanceChipValue}>
              {formatCurrency(currentBalance)}
            </Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <Controller
            control={amountControl}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[styles.input, amountErrors.amount && styles.inputError]}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    setBanner(null);
                    onChange(text.replace(/[^\d.]/g, ""));
                  }}
                  value={value}
                />
                {amountErrors.amount ? (
                  <Text style={styles.errorText}>{amountErrors.amount.message}</Text>
                ) : null}
              </>
            )}
          />
        </View>

        <View style={styles.feeCard}>
          <Entypo name="info-with-circle" size={18} color="#F87171" />
          <View style={styles.feeCopy}>
            <Text style={styles.feeTitle}>Withdrawal fees</Text>
            <Text style={styles.feeText}>
              \u2022 \u20A610 below \u20A65,000{"\n"}
              \u2022 \u20A625 from \u20A65,000 to \u20A650,000{"\n"}
              \u2022 \u20A650 above \u20A650,000
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleAmountSubmit(handleWithdraw)()}
          disabled={!isAmountValid || isWithdrawing}
          style={({ pressed }) => [
            styles.primaryButton,
            (!isAmountValid || isWithdrawing) && styles.buttonDisabled,
            pressed && isAmountValid && !isWithdrawing && styles.pressed,
          ]}
        >
          {isWithdrawing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Submit withdrawal</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={guardedClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={guardedClose} />
        <View style={styles.sheetContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={[styles.sheet, { paddingBottom: bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              disabled={step === "list" || isBusy}
              style={({ pressed }) => [
                styles.headerButton,
                (step === "list" || isBusy) && styles.headerButtonDisabled,
                pressed && step !== "list" && !isBusy && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Withdraw funds</Text>
              <Text style={styles.headerSubtitle}>
                {step === "list" && "Choose where your payout should go."}
                {step === "add" && "Add a bank account for future withdrawals."}
                {step === "verify" && "Confirm the verified bank details."}
                {step === "amount" && "Enter the amount you want to withdraw."}
              </Text>
            </View>

            <Pressable
              onPress={guardedClose}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.headerButton,
                isBusy && styles.headerButtonDisabled,
                pressed && !isBusy && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.stepRow}>
            {STEP_META.map((item, index) => {
              const active = index === currentStepIndex;
              const complete = index < currentStepIndex;
              return (
                <View
                  key={item.key}
                  style={[
                    styles.stepPill,
                    active && styles.stepPillActive,
                    complete && styles.stepPillComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepPillText,
                      (active || complete) && styles.stepPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {renderBanner()}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {step === "list" ? renderSavedAccounts() : null}
            {step === "add" ? renderAddAccountStep() : null}
            {step === "verify" ? renderVerifyStep() : null}
            {step === "amount" ? renderAmountStep() : null}

            {step === "list" ? (
              <Pressable
                onPress={() => {
                  setBanner(null);
                  setStep("add");
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add-circle-outline" size={18} color="#E2E8F0" />
                <Text style={styles.secondaryButtonText}>Add new bank account</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
    </View>
  </Modal>
);
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0A0C10",
    borderTopWidth: 1,
    borderTopColor: "#1C2027",
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#313745",
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#11141A",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonDisabled: {
    opacity: 0.45,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Nunito-Bold",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
    marginBottom: 6,
  },
  stepPill: {
    borderRadius: 999,
    backgroundColor: "#11141A",
    borderWidth: 1,
    borderColor: "#232833",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepPillActive: {
    backgroundColor: "#1B0F16",
    borderColor: "#F43F5E",
  },
  stepPillComplete: {
    backgroundColor: "#0D1F16",
    borderColor: "#166534",
  },
  stepPillText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  stepPillTextActive: {
    color: "#FFFFFF",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  scrollContent: {
    paddingTop: 14,
    gap: 14,
  },
  sectionStack: {
    gap: 12,
  },
  emptyCard: {
    alignItems: "center",
    gap: 8,
    borderRadius: 22,
    backgroundColor: "#0B0E12",
    borderWidth: 1,
    borderColor: "#1E222A",
    padding: 22,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: "Nunito-Regular",
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "#0B0E12",
    borderWidth: 1,
    borderColor: "#1E222A",
    padding: 16,
  },
  accountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: {
    flex: 1,
    gap: 4,
  },
  accountTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  accountNumberText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  accountMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  defaultPill: {
    borderRadius: 999,
    backgroundColor: "#0D1F16",
    borderWidth: 1,
    borderColor: "#166534",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultPillText: {
    color: "#DCFCE7",
    fontSize: 10,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: "#F8FAFC",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#0B0E12",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  inputError: {
    borderColor: "#FB7185",
  },
  errorText: {
    color: "#FB7185",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  verifiedCard: {
    alignItems: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#0B0E12",
    borderWidth: 1,
    borderColor: "#1E222A",
    padding: 24,
  },
  verifiedTitle: {
    color: "#DCFCE7",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  verifiedName: {
    color: "#FFFFFF",
    fontSize: 22,
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  verifiedMeta: {
    color: "#CBD5E1",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Nunito-Regular",
  },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "#11141A",
    borderWidth: 1,
    borderColor: "#232833",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  balanceChipLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  balanceChipValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  feeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#1A1215",
    borderWidth: 1,
    borderColor: "#4C1525",
    padding: 16,
  },
  feeCopy: {
    flex: 1,
    gap: 4,
  },
  feeTitle: {
    color: "#FCA5A5",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  feeText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#313745",
    backgroundColor: "#11141A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
});
