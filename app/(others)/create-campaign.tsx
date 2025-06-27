import { yupResolver } from "@hookform/resolvers/yup";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as yup from "yup";

import { useCreateCampaign } from "@/api/campaign/campaign";
import CustomPicker from "@/components/CustomPicker";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FormShape = {
  songTitle: string;
  songLink: string;
  genre: string;
  snippet: DocumentPicker.DocumentPickerAsset;
  audience: string[];
  budget?: string;
};

const getValidationSchema = (campaignType: any) =>
  yup.lazy(() =>
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
          "Max size is 10 MB",
          (file) => !file || (file.size ?? 0) <= 5 * 1024 * 1024
        ),
      audience:
        campaignType !== "free"
          ? yup
              .array()
              .of(yup.string().defined())
              .min(1, "Select at least one audience type")
              .required("Select at least one audience type")
          : yup.array().of(yup.string().defined()).optional(),
      budget: yup
        .string()
        .optional()
        .matches(/^[\d]+(\.\d{1,2})?$/, "Enter a valid number")
        .test("min", "Minimum amount is ₦1500", (value) => {
          if (!value) return true; // Allow empty since it's optional
          const num = parseFloat(value);
          return !isNaN(num) && num >= 1500;
        }),
    })
  );

export default function CreatePaidCampaignScreen() {
  const { campaignType } = useLocalSearchParams();
  const { bottom, top } = useSafeAreaInsets();
  const [message, setMessage] = React.useState<string | null>(null);
  const { mutate, isPending, isSuccess, isError, error } = useCreateCampaign();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid, errors },
  } = useForm<FormShape>({
    resolver: yupResolver(getValidationSchema(campaignType)) as any,
    mode: "onChange",
    defaultValues: {
      songTitle: "",
      songLink: "",
      genre: "",
      snippet: {} as DocumentPicker.DocumentPickerAsset,
      audience: campaignType === "free" ? ["spotify"] : [],
      budget: undefined,
    },
  });

  /* --------------------------------------------------------------- */
  /*  Animated Pay-Now button                                        */
  /* --------------------------------------------------------------- */
  const enabled = useSharedValue(0);
  enabled.value = withTiming(isValid ? 1 : 0.4, {
    duration: 250,
    easing: Easing.ease,
  });

  const rPayStyle = useAnimatedStyle(() => ({
    opacity: enabled.value,
    transform: [{ scale: enabled.value ? 1 : 0.97 }],
  }));

  /* --------------------------------------------------------------- */
  /*  File picker logic                                              */
  /* --------------------------------------------------------------- */
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
    setMessage(null);
    // Map form data to API payload
    const payload = {
      songTitle: data.songTitle,
      genre: data.genre,
      targetAudience: Array.isArray(data.audience)
        ? data.audience
        : [data.audience],
      audioFile: {
        uri: data.snippet.uri,
        name: data.snippet.name,
        type: data.snippet.mimeType || "audio/mpeg",
      },
      songLink: data.songLink,
      isPaid: campaignType !== "free",
      budget:
        campaignType !== "free" && data.budget
          ? Number(data.budget)
          : undefined,
    };

    // Show uploading message
    setMessage("Uploading campaign... This may take a few moments.");

    mutate(payload, {
      onSuccess: async (res) => {
        setMessage("Campaign created successfully!");
        setTimeout(async () => {
          if (res.data.virtualAccount?.accountNumber) {
            // Instead of opening browser, route to virtual account details screen
            router.replace({
              pathname: "/(others)/virtual-account-details",
              params: {
                accountNumber: res.data.virtualAccount?.accountNumber || "",
                bankName: res.data.virtualAccount?.bankName || "",
                accountName: res.data.virtualAccount?.accountName || "",
                budget: data.budget,
              },
            });
          } else {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Entypo
                name="chevron-left"
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <Text style={styles.h1}>Create a campaign</Text>
          </View>
          <Text style={styles.sub}>
            Promote your music to thousands of Music Fans.
          </Text>

          {/* ------------- Song title ---------------- */}
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

          {/* ------------- Song link ----------------- */}
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

          {/* ------------- Genre picker -------------- */}
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

          {/* ------------- Upload snippet ------------ */}
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

          {/* -------- Target audience picker ---------- */}
          {campaignType !== "free" && (
            <>
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
                      { label: "Boomplay", value: "boomplay" },
                    ]}
                    error={errors.audience?.message}
                    arrayValue={true}
                  />
                )}
              />
            </>
          )}

          {/* -------------- Budget -------------------- */}
          {campaignType !== "free" ? (
            <>
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
            </>
          ) : (
            ""
          )}

          {campaignType !== "free" && Number(watch("budget")) > 20 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontFamily: "Nunito-Regular",
                  color: "white",
                  marginTop: 30,
                }}
              >
                Estimated Listeners:
              </Text>
              <Text
                style={{
                  fontFamily: "Nunito-Bold",
                  color: "white",
                  marginTop: 30,
                  fontSize: 18,
                }}
              >
                {Number(watch("budget")) / 20} -{" "}
                {Number(watch("budget")) / 20 + 50}
              </Text>
            </View>
          ) : (
            ""
          )}

          {/* -------------- Pay Now ------------------- */}
          <View style={[styles.payWrapper, rPayStyle]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.payBtn}
              disabled={!isValid || isPending}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.payTxt}>
                {isPending
                  ? "Submitting..."
                  : campaignType === "free"
                  ? "Upload Song"
                  : "Pay Now"}
              </Text>
            </TouchableOpacity>
            {message && (
              <Text
                style={{
                  color: isSuccess ? "#34d399" : "#ff4d67",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                {message}
              </Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
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

/* =================================================================== */
/*  Styles                                                             */
/* =================================================================== */
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    backgroundColor: "#000",
    paddingTop: 10,
  },
  h1: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  sub: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 32,
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
    height: 58,
    alignItems: "center",
    justifyContent: "center",
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
});
