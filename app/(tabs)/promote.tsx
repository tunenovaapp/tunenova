import { yupResolver } from "@hookform/resolvers/yup";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import * as yup from "yup";

import { useCreateCampaign } from "@/api/campaign/campaign";
import { useCoupons } from "@/api/user/user";
import { useBalance } from "@/api/wallet/wallet";
import CustomPicker from "@/components/CustomPicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FormShape = {
  songTitle: string;
  songLink: string;
  genre: string;
  snippet: DocumentPicker.DocumentPickerAsset;
  audience: string[];
  budget?: string;
  paymentBy?: string;
};

const getValidationSchema = yup.lazy(() =>
  yup.object({
    songTitle: yup.string().required("Title is required"),
    songLink: yup
      .string()
      .url("Must be a valid URL")
      .required("Song link is required"),
    genre: yup.string().required("Select a genre"),
    snippet: yup
      .mixed<DocumentPicker.DocumentPickerAsset>()
      .test("required", "Snippet is required", (file) => file && !!file.name)
      .test(
        "size",
        "Max size is 5 MB",
        (file) => !file || (file.size ?? 0) <= 5 * 1024 * 1024
      ),
    audience: yup
      .array()
      .of(yup.string().defined())
      .min(1, "Select at least one audience type")
      .required("Select at least one audience type"),
    budget: yup
      .string()
      .optional()
      .matches(/^[\d]+(\.\d{1,2})?$/, "Enter a valid number")
      .test("min", "Minimum amount is 0 for free, ₦1000 for paid", (value) => {
        if (!value) return true;
        const num = parseFloat(value);
        if (!num || num === 0) return true;
        return !isNaN(num) && num >= 1000;
      }),
    paymentBy: yup.string().when("budget", {
      is: (val: string) => !val || Number(val) === 0,
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.required("Select a payment method"),
    }),
  })
);

export default function CreatePaidCampaignScreen() {
  const { bottom, top } = useSafeAreaInsets();
  const [message, setMessage] = React.useState<string | null>(null);
  const [showTopUpButton, setShowTopUpButton] = useState(false);
  const { mutate, isPending, isSuccess, isError, error } = useCreateCampaign();
  const router = useRouter();
  const [isPaymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { data: couponsData, isLoading: isCouponsLoading } = useCoupons();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid, errors, touchedFields },
  } = useForm<FormShape>({
    resolver: yupResolver(getValidationSchema) as any,
    mode: "onChange",
    defaultValues: {
      songTitle: "",
      songLink: "",
      genre: "",
      snippet: {} as DocumentPicker.DocumentPickerAsset,
      audience: [],
      budget: "0",
      paymentBy: undefined,
    },
  });

  // Determine campaign type based on budget
  const budgetValue = watch("budget");
  const isFreeCampaign = !budgetValue || Number(budgetValue) === 0;

  // Custom main form validity (now includes audience)
  const { songTitle, songLink, genre, snippet, audience } = watch();
  const isMainFormValid =
    !!songTitle &&
    !!songLink &&
    !!genre &&
    !!snippet?.name &&
    !errors.songTitle &&
    !errors.songLink &&
    !errors.genre &&
    !errors.snippet &&
    !errors.budget &&
    !errors.audience;

  /* --------------------------------------------------------------- */
  /*  Animated Pay-Now button                                        */
  /* --------------------------------------------------------------- */
  const enabled = useSharedValue(0);
  enabled.value = withTiming(isValid ? 1 : 0.4, {
    duration: 250,
    easing: Easing.ease,
  });

  const handlePickSnippet = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "audio/mpeg",
      copyToCacheDirectory: false,
    });
    if (res.assets && res.assets[0]) {
      setValue("snippet", res.assets[0], { shouldValidate: true });
    }
  }, [setValue]);

  /* --------------------------------------------------------------- */
  /*  Submit                                                         */
  /* --------------------------------------------------------------- */
  const onSubmit = (data: any) => {
    // This function now only handles the mutation
    // Determine couponId if paymentBy is a coupon
    let couponId: string | undefined = undefined;
    if (
      data.paymentBy &&
      data.paymentBy !== "wallet" &&
      data.paymentBy !== "none"
    ) {
      const coupon = couponsData?.data?.find((c) => c.value === data.paymentBy);
      if (coupon) couponId = coupon.id.toString();
    }
    // Map form data to API payload
    const payload = {
      songTitle: data.songTitle,
      genre: data.genre,
      targetAudience: data.audience,
      audioFile: {
        uri: data.snippet.uri,
        name: data.snippet.name,
        type: data.snippet.mimeType || "audio/mpeg",
      },
      songLink: data.songLink,
      isPaid: !isFreeCampaign,
      budget: !isFreeCampaign && data.budget ? Number(data.budget) : undefined,
      paymentBy: data.paymentBy,
      ...(couponId ? { couponId } : {}),
    };

    // Show uploading message
    setMessage("Uploading campaign... This may take a few moments.");

    mutate(payload, {
      onSuccess: async (res) => {
        setMessage("Campaign created successfully!");
        setTimeout(async () => {
          if (res.data.virtualAccount?.accountNumber) {
            console.log(res.data);
            router.replace({
              pathname: "/(others)/virtual-account-details",
              params: {
                accountNumber: res.data.virtualAccount?.accountNumber || "",
                bankName: res.data.virtualAccount?.bankName || "",
                accountName: res.data.virtualAccount?.accountName || "",
                budget: data.budget,
                id: res.data.campaign.id,
              },
            });
          } else {
            reset();
            router.replace("/(tabs)/analytics");
          }
        }, 1000);
      },
      onError: (err: any) => {
        console.error("Form submission error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });

        if (Platform.OS === "android") {
          ToastAndroid.show(
            err?.response?.data?.message || "An error occurred",
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert(
            "Error",
            err?.response?.data?.message || "An error occurred"
          );
        }

        if (err.message === "Network Error") {
          setMessage(
            "Network error. Please check your internet connection and try again. If the problem persists, the file might be too large."
          );
        } else {
          setMessage(
            err?.response?.data?.message ||
              "Failed to create campaign. Please try again."
          );
        }
      },
    });
  };

  const handlePayment = () => {
    setMessage(null);
    setShowTopUpButton(false);

    const budgetNum = Number(watch("budget"));
    const walletBalance = balanceData?.data?.wallet?.balance ?? 0;

    if (watch("paymentBy") === "wallet" && budgetNum > walletBalance) {
      setMessage("Insufficient wallet balance. Please top up your account.");
      setShowTopUpButton(true);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handleTopUpPress = () => {
    setShowTopUpButton(false);
    router.push({
      pathname: "/(others)/virtual-account-details",
    });
  };

  const renderPaymentSheet = () => (
    <Modal
      isVisible={isPaymentSheetVisible}
      onBackdropPress={() => setPaymentSheetVisible(false)}
      onBackButtonPress={() => setPaymentSheetVisible(false)}
      style={{ justifyContent: "flex-end", margin: 0 }}
      avoidKeyboard
    >
      <View style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Complete Your Campaign</Text>

        {/* Payment By Dropdown */}
        <FieldLabel label="Payment By" />
        <Controller
          control={control}
          name="paymentBy"
          render={({ field }) => (
            <>
              <PickerInput
                placeholder="Select payment method"
                value={field.value || ""}
                onChange={(val) => {
                  if (val === "none" || val === "coupon") return;
                  field.onChange(val);
                }}
                items={[
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
                error={errors.paymentBy?.message}
              />
              {/* Coupon + wallet info */}
              {(() => {
                if (
                  field.value &&
                  field.value !== "wallet" &&
                  field.value !== "none" &&
                  couponsData?.data
                ) {
                  const selectedCoupon = couponsData.data.find(
                    (c) => c.value === field.value
                  );
                  const budgetNum = Number(watch("budget"));
                  if (
                    selectedCoupon &&
                    !isNaN(budgetNum) &&
                    budgetNum > Number(selectedCoupon.balance)
                  ) {
                    return (
                      <Text
                        style={{
                          color: "#f59e42",
                          marginTop: 8,
                          fontFamily: "Nunito-Regular",
                        }}
                      >
                        The balance not covered by your coupon will be paid with
                        your wallet.
                      </Text>
                    );
                  }
                }
                return null;
              })()}
            </>
          )}
        />

        {message && (
          <Text
            style={{
              color: "#ff4d67",
              textAlign: "center",
              marginVertical: 10,
              fontFamily: "Nunito-Bold",
            }}
          >
            {message}
          </Text>
        )}

        {showTopUpButton ? (
          <TouchableOpacity
            style={[styles.payBtn, { marginTop: 16 }]}
            onPress={handleTopUpPress}
          >
            <Text style={styles.payTxt}>Fund Wallet</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.payBtn,
              !isValid || isPending ? styles.payBtnDisabled : null,
              { marginTop: 24 },
            ]}
            disabled={!isValid || isPending}
            onPress={handlePayment}
          >
            <Text style={styles.payTxt}>
              {isPending ? "Submitting..." : "Publish Campaign"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000", paddingTop: top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingBottom: 24 }]}
        style={{ flex: 1 }}
      >
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={styles.h1}>Create a campaign</Text>
        </View>
        <Text style={styles.sub}>
          Promote your music to thousands of fans on Youtube, Spotify, Apple
          Music and more.
        </Text>
        <View style={styles.divider} />
        <FieldLabel label="Song title" />
        <Controller
          control={control}
          name="songTitle"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Song name"
              value={value}
              onChangeText={onChange}
              error={errors.songTitle?.message}
            />
          )}
        />
        <FieldLabel label="Song link" />
        <Controller
          control={control}
          name="songLink"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="https://spotify.com..."
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              error={errors.songLink?.message}
            />
          )}
        />
        <FieldLabel label="Genre" />
        <Controller
          control={control}
          name="genre"
          render={({ field }) => (
            <PickerInput
              placeholder="Choose here"
              value={field.value}
              onChange={field.onChange}
              items={[
                { label: "Afrobeats", value: "afrobeats" },
                { label: "Pop", value: "pop" },
                { label: "Hip-hop", value: "hiphop" },
                { label: "Gospel", value: "gospel" },
                { label: "Country", value: "country" },
                { label: "R&B", value: "rnb" },
              ]}
              error={errors.genre?.message}
            />
          )}
        />
        <FieldLabel label="Upload Snippet" />
        <Text style={styles.helper}>
          Audio should be a Maximum of 5 MB and 20 seconds.{" "}
          <Text
            style={[styles.helper, { textDecorationLine: "underline" }]}
            onPress={() => Linking.openURL("https://audiotrimmer.com")}
          >
            Easily trim your track on audiotrimmer
          </Text>
        </Text>
        <Controller
          control={control}
          name="snippet"
          render={({ field: { value } }) => (
            <TouchableOpacity
              style={[
                styles.attachment,
                !!errors.snippet && { borderColor: "#ff003c" },
              ]}
              onPress={handlePickSnippet}
            >
              <Ionicons
                name="attach"
                size={18}
                color="#d1d5db"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.attachText}>
                {value && value.name
                  ? value.name
                  : "No file selected. Tap to attach Mp3 file"}
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.snippet && (
          <Text style={styles.err}>{errors.snippet.message}</Text>
        )}
        {/* Target Audience field */}
        <FieldLabel label="Target Audience" />
        <Text style={styles.helper}>
          Select the type of audience on Tunenova you want to target
        </Text>
        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <PickerInput
              placeholder="Choose one"
              value={field.value}
              onChange={(val) => field.onChange([val])}
              items={[
                { label: "Spotify", value: "spotify" },
                { label: "Youtube", value: "youtube" },
                { label: "Apple Music", value: "apple-music" },
              ]}
              error={errors.audience?.message}
              multiSelect={false}
              arrayValue={true}
            />
          )}
        />
        {/* Always show budget field */}
        <FieldLabel label="Set Budget" />
        <Controller
          control={control}
          name="budget"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Amount"
              keyboardType="numeric"
              value={value}
              onChangeText={onChange}
              error={errors.budget?.message}
            />
          )}
        />
        {/* Estimated Listeners */}
        {!isFreeCampaign && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Nunito-Regular",
                color: "white",
              }}
            >
              Estimated Listeners:
            </Text>
            <Text
              style={{
                fontFamily: "Nunito-Bold",
                color: "white",
                fontSize: 18,
              }}
            >
              {Math.floor(Number(watch("budget")) / 20)} -{" "}
              {Math.floor(Number(watch("budget")) / 20) + 50}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.payBtn,
            !isMainFormValid || isPending ? styles.payBtnDisabled : null,
            { marginTop: 24 },
          ]}
          disabled={!isMainFormValid || isPending}
          onPress={() => {
            if (isFreeCampaign) {
              handleSubmit(onSubmit)();
            } else {
              setMessage(null);
              setShowTopUpButton(false);
              setPaymentSheetVisible(true);
            }
          }}
        >
          {isPending && !isPaymentSheetVisible ? (
            <Text style={styles.payTxt}>Submitting...</Text>
          ) : (
            <Text style={styles.payTxt}>
              {isFreeCampaign ? "Upload Song" : "Proceed"}
            </Text>
          )}
        </TouchableOpacity>
        {message && !showTopUpButton ? ( // Only show non-top-up messages here
          <View style={styles.messageRow}>
            {isSuccess ? (
              <Text style={styles.successIcon}>✔️</Text>
            ) : isError ? (
              <Text style={styles.errorIcon}>❌</Text>
            ) : null}
            <Text
              style={{
                color: isSuccess ? "#34d399" : "#ff4d67",
                textAlign: "center",
                marginTop: 8,
                fontFamily: "Nunito-Bold",
              }}
            >
              {message}
            </Text>
          </View>
        ) : (
          <></>
        )}
      </ScrollView>
      {!isFreeCampaign && renderPaymentSheet()}
    </KeyboardAvoidingView>
  );
}

/* =================================================================== */
/*  Reusable field helpers                                             */
/* =================================================================== */
const FieldLabel = ({ label }: { label: string }) => (
  <Text style={styles.label}>{label}</Text>
);

const Input = ({
  error,
  ...props
}: TextInput["props"] & { error?: string }) => (
  <>
    <TextInput
      style={[styles.input, error && { borderColor: "#ff003c" }]}
      placeholderTextColor="#6b7280"
      {...props}
    />
    {error && <Text style={styles.err}>{error}</Text>}
  </>
);

const PickerInput = ({
  value,
  onChange,
  items,
  placeholder,
  error,
  multiSelect,
  arrayValue,
}: {
  value: string[] | string;
  onChange: (v: any) => void;
  items: { label: string; value: string }[];
  placeholder: string;
  error?: string;
  multiSelect?: boolean;
  arrayValue?: boolean;
}) => (
  <View style={{ marginBottom: 12 }}>
    <CustomPicker
      options={items}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      modalTitle={`${placeholder}`}
      multiSelect={multiSelect}
      arrayValue={arrayValue}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    backgroundColor: "#000",
    paddingTop: 10,
  },
  h1: {
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#374151",
    marginBottom: 6,
    marginHorizontal: -24,
  },
  sub: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 12,
    fontFamily: "Nunito-Regular",
  },
  label: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pickerText: {
    color: "#fff",
    fontSize: 16,
  },
  helper: {
    color: "#9ca3af",
    lineHeight: 20,
    marginBottom: 6,
  },
  attachment: {
    borderWidth: 1,
    borderColor: "#6b7280",
    backgroundColor: "#3f3f46",
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  attachText: { color: "#d1d5db", fontSize: 15 },
  err: {
    color: "#ff4d67",
    marginTop: 4,
    fontSize: 13,
  },
  payWrapper: { marginTop: 50 },
  payBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 0,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payTxt: {
    color: "#fff",
    fontSize: 19,
    fontFamily: "Nunito-Bold",
  },
  errorText: {
    color: "#ff4d67",
    marginTop: 4,
    fontSize: 13,
  },
  stickyBar: {
    backgroundColor: "#18181b",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#232326",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  successIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 4,
  },
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
});
