import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import { useVerifiedUsersCount } from "../../api/user/user";

import CustomPicker from "../../components/CustomPicker";

const schema = yup.object().shape({
  campaignType: yup.string().required("Please choose a campaign type"),
});

type FormData = yup.InferType<typeof schema>;

export default function CreateCampaignScreen() {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormData>({
    defaultValues: { campaignType: "" },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const campaignOptions = [
    { label: "Free Campaign", value: "free" },
    { label: "Paid Campaign", value: "paid" },
  ];

  /* ------------------------------------------------------------------ */
  /*  Reanimated shared value to fade-in / scale-in when the form is     */
  /*  valid.                                                             */
  /* ------------------------------------------------------------------ */
  const enabled = useSharedValue(0);
  enabled.value = withTiming(isValid ? 1 : 0, {
    duration: 250,
    easing: Easing.ease,
  });

  const rProceedStyle = useAnimatedStyle(() => ({
    opacity: enabled.value,
    transform: [{ scale: enabled.value === 1 ? 1 : 0.98 }],
  }));

  const { data: verifiedUsersCount } = useVerifiedUsersCount();

  const onSubmit = (data: FormData) => {
    router.push({
      pathname: "/create-campaign",
      params: {
        campaignType: data.campaignType,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.h1}>Create a campaign</Text>
            <Text style={styles.sub}>
              Promote your music to thousands of Music Fans.
            </Text>

            <View style={styles.divider} />

            {/* ------------------------------------------------------------ */}
            {/*  Body                                                       */}
            {/* ------------------------------------------------------------ */}
            <Text style={styles.h2}>Choose Campaign</Text>
            <Text style={styles.p}>
              Free campaigns allow you upload a snippet of your song to the
              Tunenova app.
            </Text>
            <Text style={styles.p}>
              Paid campaigns guarantee a number of fans that will hear your song
              &amp; discover it on streaming platforms like Spotify, Apple Music
              &amp; more.
            </Text>

            {verifiedUsersCount ? (
              <Text
                style={{
                  fontSize: RFValue(12),
                  color: "#d1d5db",
                  fontFamily: "Nunito-Regular",
                  marginTop: 5,
                  marginBottom: 10,
                }}
              >
                Tunenova Listeners:{" "}
                <Text
                  style={{
                    fontFamily: "Nunito-Bold",
                  }}
                >
                  {verifiedUsersCount}
                </Text>
              </Text>
            ) : null}

            <Controller
              control={control}
              name="campaignType"
              render={({ field: { onChange, value } }) => (
                <CustomPicker
                  options={campaignOptions}
                  onChange={onChange}
                  value={value}
                  placeholder="Select campaign type..."
                  modalTitle="Select Campaign Type"
                />
              )}
            />

            {/* ------------------------------------------------------------ */}
            {/*  Proceed button                                             */}
            {/* ------------------------------------------------------------ */}
            <Animated.View style={[styles.proceedWrapper, rProceedStyle]}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.proceedBtn}
                disabled={!isValid}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.proceedText}>Proceed</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------- */
/*  Styles                                                              */
/* -------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  h1: {
    fontSize: RFValue(22),
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },
  sub: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 4,
    marginBottom: 8,
    fontFamily: "Nunito-Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 12,
    marginHorizontal: -24,
  },
  h2: {
    fontSize: RFValue(17),
    fontFamily: "Nunito-Regular",
    color: "#fff",
    marginBottom: 12,
  },
  p: {
    color: "#d1d5db",
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: "Nunito-Regular",
  },
  proceedWrapper: {
    marginTop: 40,
  },
  proceedBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 8,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedText: {
    color: "#fff",
    fontSize: RFValue(18),
    fontWeight: "600",
    fontFamily: "Nunito-Medium",
  },
});
