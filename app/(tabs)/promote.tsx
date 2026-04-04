import { yupResolver } from "@hookform/resolvers/yup";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from "react-native";
import * as yup from "yup";

import { useCreateCampaign } from "@/api/campaign/campaign";
import { useCoupons } from "@/api/user/user";
import { useBalance } from "@/api/wallet/wallet";
import {
  CampaignType,
  CampaignTypeToggle,
} from "@/components/promote/campaign-type-toggle";
import {
  ChoiceChipGroup,
  ChoiceOption,
} from "@/components/promote/choice-chip-group";
import { EstimateCard } from "@/components/promote/estimate-card";
import {
  PaymentMethodList,
  PaymentOption,
} from "@/components/promote/payment-method-list";
import { PromoteSection } from "@/components/promote/promote-section";
import { SnippetUploadCard } from "@/components/promote/snippet-upload-card";
import {
  PromoteStickyBanner,
  PromoteStickyBar,
} from "@/components/promote/sticky-submit-bar";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FormShape = {
  campaignType: CampaignType;
  songTitle: string;
  songLink: string;
  genre: string;
  snippet: DocumentPicker.DocumentPickerAsset | null;
  audience: string[];
  budget: string;
  paymentBy?: string;
};

const DEFAULT_VALUES: FormShape = {
  campaignType: "free",
  songTitle: "",
  songLink: "",
  genre: "",
  snippet: null,
  audience: [],
  budget: "0",
  paymentBy: undefined,
};

const GENRE_OPTIONS: ChoiceOption[] = [
  { label: "Afrobeats", value: "afrobeats" },
  { label: "Pop", value: "pop" },
  { label: "Hip-hop", value: "hiphop" },
  { label: "Gospel", value: "gospel" },
  { label: "Country", value: "country" },
  { label: "R&B", value: "rnb" },
];

const AUDIENCE_OPTIONS: ChoiceOption[] = [
  {
    label: "Spotify",
    value: "spotify",
    description: "Target listeners who are likely to continue into Spotify.",
  },
  {
    label: "YouTube",
    value: "youtube",
    description: "Great when your discovery link should drive video views.",
  },
  {
    label: "Apple Music",
    value: "apple-music",
    description: "Aim at Apple Music listeners and premium stream intent.",
  },
];

const validationSchema = yup.object({
  campaignType: yup.mixed<CampaignType>().oneOf(["free", "paid"]).required(),
  songTitle: yup.string().trim().required("Title is required"),
  songLink: yup
    .string()
    .trim()
    .url("Must be a valid URL")
    .required("Song link is required"),
  genre: yup.string().required("Select a genre"),
  snippet: yup
    .mixed<DocumentPicker.DocumentPickerAsset>()
    .nullable()
    .test("required", "Snippet is required", (file) => Boolean(file?.name))
    .test(
      "size",
      "Max size is 5 MB",
      (file) => !file || (file.size ?? 0) <= 5 * 1024 * 1024,
    ),
  audience: yup
    .array()
    .of(yup.string().defined())
    .min(1, "Select at least one audience type")
    .required(),
  budget: yup.string().when("campaignType", {
    is: "paid",
    then: (schema) =>
      schema
        .required("Enter a budget")
        .matches(/^[\d]+(\.\d{1,2})?$/, {
          message: "Enter a valid number",
          excludeEmptyString: true,
        })
        .test("min", "Minimum paid budget is \u20A61,000", (value) => {
          if (!value) return false;
          const num = parseFloat(value);
          return !Number.isNaN(num) && num >= 1000;
        }),
    otherwise: (schema) => schema.optional(),
  }),
  paymentBy: yup.string().when("campaignType", {
    is: "paid",
    then: (schema) => schema.required("Select a payment method"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const audienceLabelMap: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  "apple-music": "Apple Music",
};

export default function PromoteScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { bottom, top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const [banner, setBanner] = useState<PromoteStickyBanner | null>(null);
  const [showTopUpAction, setShowTopUpAction] = useState(false);

  const songLinkRef = useRef<TextInput>(null);
  const budgetRef = useRef<TextInput>(null);

  const { mutate, isPending } = useCreateCampaign();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { data: couponsData, isLoading: isCouponsLoading } = useCoupons();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { isValid, errors },
  } = useForm<FormShape>({
    resolver: yupResolver(validationSchema) as any,
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const campaignType = watch("campaignType");
  const songTitle = watch("songTitle");
  const songLink = watch("songLink");
  const genre = watch("genre");
  const snippet = watch("snippet");
  const audience = watch("audience");
  const budgetValue = watch("budget");
  const paymentBy = watch("paymentBy");

  const isPaidCampaign = campaignType === "paid";
  const walletBalance = balanceData?.data?.wallet?.balance ?? 0;
  const couponOptions = useMemo(
    () => couponsData?.data ?? [],
    [couponsData?.data],
  );
  const budgetNumber = Number(budgetValue || 0);
  const selectedAudience = Array.isArray(audience) ? audience[0] : undefined;
  const audienceLabel =
    audienceLabelMap[selectedAudience ?? ""] || "your selected platform";

  const estimatedListenersMin = Math.floor(budgetNumber / 20);
  const estimatedListenersMax = estimatedListenersMin + 50;
  const estimatedStreamsMin = Math.floor(estimatedListenersMin * 0.1);
  const estimatedStreamsMax = Math.floor(estimatedListenersMax * 0.6);
  const estimateReady =
    isPaidCampaign && !Number.isNaN(budgetNumber) && budgetNumber >= 1000;

  const selectedCoupon =
    paymentBy && paymentBy !== "wallet"
      ? couponOptions.find((coupon) => coupon.value === paymentBy)
      : undefined;
  const selectedCouponBalance = selectedCoupon
    ? Number(selectedCoupon.balance)
    : 0;
  const selectedCouponShortfall =
    selectedCoupon && budgetNumber > selectedCouponBalance
      ? budgetNumber - selectedCouponBalance
      : 0;

  const paymentNote = selectedCouponShortfall
    ? `${formatCurrency(selectedCouponBalance)} will come from this campaign balance. The remaining ${formatCurrency(selectedCouponShortfall)} will fall back to your wallet.`
    : null;

  const paymentOptions: PaymentOption[] = useMemo(
    () => [
      {
        label: "Wallet balance",
        value: "wallet",
        detail: isBalanceLoading
          ? "Checking available funds..."
          : formatCurrency(walletBalance),
        helper:
          "Pay directly from your Tunenova wallet for instant confirmation.",
      },
      ...couponOptions.map((coupon) => ({
        label: "Campaign balance",
        value: coupon.value,
        detail: formatCurrency(Number(coupon.balance)),
        helper: "Use saved campaign credit before your wallet is touched.",
      })),
    ],
    [couponOptions, isBalanceLoading, walletBalance],
  );

  const paymentEmptyState = isCouponsLoading
    ? "Checking if you have any campaign balances available..."
    : couponOptions.length === 0
      ? "No campaign balances are available right now. Wallet payment is still ready to use."
      : null;

  const isMainFormValid =
    Boolean(songTitle.trim()) &&
    Boolean(songLink.trim()) &&
    Boolean(genre) &&
    Boolean(snippet?.name) &&
    Boolean(selectedAudience) &&
    !errors.songTitle &&
    !errors.songLink &&
    !errors.genre &&
    !errors.snippet &&
    !errors.audience;

  const canSubmit = isPaidCampaign ? isValid : isMainFormValid;

  const summaryTitle = showTopUpAction
    ? "Wallet funding needed"
    : isPaidCampaign
      ? `Paid campaign${estimateReady ? ` · ${formatCurrency(budgetNumber)}` : ""}`
      : "Free campaign";
  const summaryText = showTopUpAction
    ? "Your selected wallet payment does not currently cover this budget."
    : isPaidCampaign
      ? `Promote to ${audienceLabel} listeners with inline wallet or campaign-balance payment.`
      : "Launch a free snippet campaign with your song link and selected platform.";
  const primaryButtonLabel = showTopUpAction
    ? "Fund Wallet"
    : isPending
      ? "Submitting..."
      : isPaidCampaign
        ? "Create Paid Campaign"
        : "Create Free Campaign";

  const handlePickSnippet = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/mpeg",
      copyToCacheDirectory: false,
    });

    if (result.assets?.[0]) {
      setBanner(null);
      setShowTopUpAction(false);
      setValue("snippet", result.assets[0], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [setValue]);

  const handleClearSnippet = useCallback(() => {
    setValue("snippet", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const handleCampaignTypeChange = useCallback(
    (nextType: CampaignType) => {
      setBanner(null);
      setShowTopUpAction(false);
      setValue("campaignType", nextType, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (nextType === "free") {
        setValue("budget", "0", {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("paymentBy", undefined, {
          shouldDirty: true,
          shouldValidate: true,
        });
        clearErrors(["budget", "paymentBy"]);
        return;
      }

      if (!budgetValue || Number(budgetValue) === 0) {
        setValue("budget", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      budgetRef.current?.focus();
    },
    [budgetValue, clearErrors, setValue],
  );

  const onSubmit = (data: FormShape) => {
    const isPaid = data.campaignType === "paid";

    let couponId: string | undefined;
    if (
      isPaid &&
      data.paymentBy &&
      data.paymentBy !== "wallet" &&
      data.paymentBy !== "none"
    ) {
      const coupon = couponOptions.find(
        (item) => item.value === data.paymentBy,
      );
      if (coupon) {
        couponId = coupon.id.toString();
      }
    }

    const payload = {
      songTitle: data.songTitle,
      genre: data.genre,
      targetAudience: data.audience,
      audioFile: {
        uri: data.snippet!.uri,
        name: data.snippet!.name,
        type: data.snippet!.mimeType || "audio/mpeg",
      },
      songLink: data.songLink,
      isPaid,
      budget: isPaid ? Number(data.budget) : undefined,
      paymentBy: isPaid ? data.paymentBy : undefined,
      ...(couponId ? { couponId } : {}),
    };

    setBanner({
      tone: "info",
      text: "Uploading campaign. Audio files can take a few moments.",
    });

    mutate(payload as any, {
      onSuccess: (response) => {
        setBanner({
          tone: "success",
          text: "Campaign created successfully. Preparing the next step...",
        });

        setTimeout(() => {
          if (response.data.virtualAccount?.accountNumber) {
            router.replace({
              pathname: "/(others)/virtual-account-details",
              params: {
                accountNumber: response.data.virtualAccount.accountNumber || "",
                bankName: response.data.virtualAccount.bankName || "",
                accountName: response.data.virtualAccount.accountName || "",
                budget: data.budget,
                id: response.data.campaign.id,
              },
            });
            return;
          }

          reset(DEFAULT_VALUES);
          queryClient.invalidateQueries({
            queryKey: ["my-campaigns", "coupons", "balance"],
          });
          setBanner(null);
          router.replace("/(tabs)/analytics");
        }, 700);
      },
      onError: (error: any) => {
        console.error("Form submission error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        setBanner({
          tone: "error",
          text:
            error.message === "Network Error"
              ? "Network error. Check your connection and try again. If the problem persists, the file may be too large."
              : error?.response?.data?.message ||
                "Failed to create campaign. Please try again.",
        });
      },
    });
  };

  const handlePrimaryAction = () => {
    if (showTopUpAction) {
      setShowTopUpAction(false);
      router.push({ pathname: "/(others)/virtual-account-details" });
      return;
    }

    setBanner(null);
    setShowTopUpAction(false);

    if (
      isPaidCampaign &&
      paymentBy === "wallet" &&
      budgetNumber > walletBalance
    ) {
      setBanner({
        tone: "error",
        text: "Insufficient wallet balance. Fund your wallet to finish this paid campaign.",
      });
      setShowTopUpAction(true);
      return;
    }

    handleSubmit(onSubmit)();
  };

  const handleOpenAudioTrimmer = () => {
    Linking.openURL("https://audiotrimmer.com");
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 10, paddingBottom: bottom + 210 },
          ]}
        >
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons
                name="megaphone-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.heroBadgeText}>Create campaign</Text>
            </View>
            <Text style={styles.heroTitle}>
              Help the audience discover your song.
            </Text>
            <Text style={styles.heroText}>
              Create campaigns to help the audience discover your song.
            </Text>
            <View
              style={[styles.heroPoints, isCompact && styles.heroPointsStacked]}
            >
              <View style={styles.heroPoint}>
                <Ionicons
                  name="flash-outline"
                  size={15}
                  color="#FB7185"
                />
                <Text style={styles.heroPointText}>Free snippet upload</Text>
              </View>
              <View style={styles.heroPoint}>
                <Ionicons
                  name="rocket-outline"
                  size={15}
                  color="#FB7185"
                />
                <Text style={styles.heroPointText}>Paid audience boost</Text>
              </View>
            </View>
          </View>

          <PromoteSection
            title="Campaign type"
            description="What type of campaign do you want to create?"
          >
            <CampaignTypeToggle
              value={campaignType}
              onChange={handleCampaignTypeChange}
              stacked={isCompact}
            />
          </PromoteSection>

          <PromoteSection
            title="Song details"
            description="Paste the title and the streaming link listeners should discover after they hear your clip."
          >
            <Controller
              control={control}
              name="songTitle"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Song title"
                  placeholder="e.g. Midnight Run"
                  value={value}
                  onChangeText={(text) => {
                    setBanner(null);
                    setShowTopUpAction(false);
                    onChange(text);
                  }}
                  error={errors.songTitle?.message}
                  returnKeyType="next"
                  onSubmitEditing={() => songLinkRef.current?.focus()}
                />
              )}
            />

            <Controller
              control={control}
              name="songLink"
              render={({ field: { onChange, value } }) => (
                <TextField
                  ref={songLinkRef}
                  label="Song link"
                  placeholder="https://open.spotify.com/track/..."
                  value={value}
                  onChangeText={(text) => {
                    setBanner(null);
                    setShowTopUpAction(false);
                    onChange(text);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  error={errors.songLink?.message}
                />
              )}
            />
          </PromoteSection>

          <PromoteSection
            title="Snippet upload"
            description="Attach the MP3 clip people will hear on Tunenova before they decide to discover the full song."
          >
            <SnippetUploadCard
              snippet={snippet}
              error={errors.snippet?.message}
              onPick={handlePickSnippet}
              onClear={handleClearSnippet}
              onTrimPress={handleOpenAudioTrimmer}
            />
          </PromoteSection>

          <PromoteSection
            title="Audience setup"
            description="Pick the genre and platform that best match the campaign you want to run."
          >
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Genre</Text>
              <ChoiceChipGroup
                options={GENRE_OPTIONS}
                value={genre || null}
                onChange={(value) => {
                  setBanner(null);
                  setShowTopUpAction(false);
                  setValue("genre", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                error={errors.genre?.message}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Target platform</Text>
              <ChoiceChipGroup
                options={AUDIENCE_OPTIONS}
                value={selectedAudience || null}
                onChange={(value) => {
                  setBanner(null);
                  setShowTopUpAction(false);
                  setValue("audience", [value], {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                error={errors.audience?.message}
                variant="card"
              />
            </View>
          </PromoteSection>

          {isPaidCampaign ? (
            <>
              <PromoteSection
                title="Paid reach settings"
                description="Set your budget and preview the likely stream range before you pay."
              >
                <Controller
                  control={control}
                  name="budget"
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      ref={budgetRef}
                      label="Budget"
                      placeholder="Minimum \u20A61,000"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(text) => {
                        setBanner(null);
                        setShowTopUpAction(false);
                        onChange(text.replace(/[^\d.]/g, ""));
                      }}
                      error={errors.budget?.message}
                    />
                  )}
                />
                <EstimateCard
                  audienceLabel={audienceLabel}
                  estimatedMin={estimatedStreamsMin}
                  estimatedMax={estimatedStreamsMax}
                  ready={estimateReady}
                />
              </PromoteSection>

              <PromoteSection
                title="Payment"
                description="Choose how to fund this campaign. Wallet balance is always available, and campaign balances apply first when selected."
              >
                <PaymentMethodList
                  options={paymentOptions}
                  value={paymentBy}
                  onChange={(value) => {
                    setBanner(null);
                    setShowTopUpAction(false);
                    setValue("paymentBy", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={errors.paymentBy?.message}
                  note={paymentNote}
                  emptyState={paymentEmptyState}
                />
              </PromoteSection>
            </>
          ) : (
            <PromoteSection
              title="Free campaign flow"
              description="No budget or payment is needed here. Once the song details and snippet are ready, you can publish immediately."
            >
              <View style={styles.freeSummary}>
                <View style={styles.freeSummaryRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#22C55E"
                  />
                  <Text style={styles.freeSummaryText}>No payment step</Text>
                </View>
                <View style={styles.freeSummaryRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#22C55E"
                  />
                  <Text style={styles.freeSummaryText}>
                    Link and snippet go live as soon as submission succeeds
                  </Text>
                </View>
              </View>
            </PromoteSection>
          )}
        </ScrollView>

        <PromoteStickyBar
          summaryTitle={summaryTitle}
          summaryText={summaryText}
          buttonLabel={primaryButtonLabel}
          onPress={handlePrimaryAction}
          disabled={isPending || (!showTopUpAction && !canSubmit)}
          pending={isPending}
          banner={banner}
          bottomInset={bottom}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

const TextField = React.forwardRef<TextInput, TextFieldProps>(
  ({ label, error, ...props }, ref) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#64748B"
        selectionColor="#F43F5E"
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  ),
);

TextField.displayName = "TextField";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#26141C",
    backgroundColor: "#0F0B10",
    padding: 22,
    gap: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#1F0E16",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    lineHeight: 34,
    fontFamily: "Nunito-Bold",
  },
  heroText: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Nunito-Regular",
  },
  heroPoints: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPointsStacked: {
    flexDirection: "column",
  },
  heroPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#12161D",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroPointText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 16,
    color: "#FFFFFF",
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
  freeSummary: {
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#0B0E12",
    borderWidth: 1,
    borderColor: "#242B34",
    padding: 16,
  },
  freeSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  freeSummaryText: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
});
