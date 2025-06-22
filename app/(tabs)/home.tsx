import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useDiscoverCampaign,
  useExploreCampaigns,
  useLikeCampaign,
  useListenToCampaign,
} from "../../api/campaign/campaign";
import { useBalance } from "../../api/wallet/wallet";
import { Skeleton } from "./wallet";

/**
 * ----------------------------------------------------------------------------
 *  MusicPlayerScreen – minimal promo‑snippet player (25s clip)
 * ----------------------------------------------------------------------------
 *  •   Progress bar driven by Reanimated (0 → 25s).
 *  •   Top‑right wallet pill; bottom tab‑bar with 4 icons (Home active).
 * ----------------------------------------------------------------------------
 */

const { width } = Dimensions.get("window");
const CLIP_DURATION = 7;

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export default function ExplorePlayerScreen() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useExploreCampaigns(
    { page }
  );
  const campaigns = data?.data?.campaigns || [];
  const pagination = data?.data?.pagination;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const progress = useSharedValue(0);
  const [showPostLike, setShowPostLike] = useState(false);
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const hintBounce = useSharedValue(0);
  const thump = useSharedValue(1);

  // Check if user has ever refreshed
  useEffect(() => {
    (async () => {
      const refreshed = await AsyncStorage.getItem("hasRefreshedHome");
      if (!refreshed) {
        // Show hint occasionally
        setTimeout(() => setShowRefreshHint(true), 1200);
      } else {
        setHasRefreshed(true);
      }
    })();
  }, []);

  // Animate the hint when shown
  useEffect(() => {
    if (showRefreshHint) {
      hintBounce.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        3,
        false
      );
      // Auto-hide after 3.5s
      const t = setTimeout(() => setShowRefreshHint(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showRefreshHint]);

  // Occasionally re-show the hint if user hasn't refreshed
  useEffect(() => {
    if (!hasRefreshed) {
      const interval = setInterval(() => {
        setShowRefreshHint(true);
      }, 20000); // every 20s
      return () => clearInterval(interval);
    }
  }, [hasRefreshed]);

  const rHintStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hintBounce.value }],
    opacity: showRefreshHint ? 1 : 0,
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    if (!hasRefreshed) {
      setHasRefreshed(true);
      setShowRefreshHint(false);
      await AsyncStorage.setItem("hasRefreshedHome", "true");
    }
  };

  // Start animations
  useEffect(() => {
    // Background color animation
    colorProgress.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.linear }),
      -1,
      true
    );

    // Thump animation
    thump.value = withRepeat(
      withSequence(
        // A gentle, steady pulse
        withTiming(1.1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true // yoyo (reverses the animation)
    );
  }, []);

  const thumpAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thump.value }],
  }));

  const rScreenGlowStyle = useAnimatedStyle(() => {
    const shadowColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      [
        "#E10032", // Brand
        "#ff00ff", // Magenta
        "#00ffff", // Cyan
        "#ffff00", // Yellow
        "#00ff00", // Lime
        "#E10032", // Back to Brand
      ]
    );

    return {
      shadowColor,
    };
  });

  const { mutate: listenMutate } = useListenToCampaign();
  const { mutate: likeMutate } = useLikeCampaign();
  const { mutate: discoverMutate } = useDiscoverCampaign();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();

  const campaign = campaigns[currentIdx];
  const player = useAudioPlayer(
    campaign?.audioFileUrl ? { uri: campaign.audioFileUrl } : undefined
  );
  const status = useAudioPlayerStatus(player);

  // Play the current campaign's audio
  useEffect(() => {
    if (campaign?.audioFileUrl) {
      player.replace({ uri: campaign.audioFileUrl });
      player.seekTo(0);
      player.play();
      // Mark as listened
      listenMutate({ id: campaign.id });
      // Animate progress
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: CLIP_DURATION * 1000,
        easing: Easing.linear,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.audioFileUrl]);

  // Listen for playback end
  useEffect(() => {
    if (status?.didJustFinish) {
      setShowModal(true);
    }
  }, [status?.didJustFinish]);

  // Move to next campaign or next page
  const handleNext = useCallback(async () => {
    setShowModal(false);
    if (currentIdx < campaigns.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else if (pagination && pagination.page < pagination.totalPages) {
      // Fetch next page and reset index
      setPage((p) => p + 1);
      setCurrentIdx(0);
      await refetch();
    } else {
      // Optionally: show a message or loop
      // setCurrentIdx(0); // Remove this to avoid looping
    }
  }, [currentIdx, campaigns.length, pagination, refetch]);

  // No longer move to next on dislike
  const handleDislike = useCallback(() => {
    handleNext();
    setShowModal(false);
    setShowPostLike(true);
  }, [player]);

  // Skip to next campaign
  const handleSkip = useCallback(() => {
    setShowPostLike(false);
    handleNext();
  }, [handleNext]);

  // Open songLink in browser
  const handleDiscover = useCallback(() => {
    // For paid campaigns, check listen duration
    if (campaign.isPaid) {
      const currentTime = status?.currentTime ?? 0;
      const duration = status?.duration ?? 0;
      const requiredTime = Math.min(10, duration / 2);

      if (currentTime < requiredTime) {
        ToastAndroid.show(
          `Listen for at least ${Math.ceil(
            requiredTime
          )}s to discover this song!`,
          ToastAndroid.SHORT
        );
        return;
      }
    }

    // Mutate and open link
    discoverMutate({ id: campaign.id });
    setShowModal(true);
  }, [campaign, status, discoverMutate]);

  // Like the campaign (no longer moves to next)
  const handleLike = useCallback(() => {
    likeMutate({ id: campaign.id });
    // Show skip/discover buttons
    if (campaign?.songLink) {
      Linking.openURL(campaign.songLink);
    }
    setShowModal(false);
    handleNext();
  }, [campaign, likeMutate]);

  // Animated width for the progress fill
  const rProgress = useAnimatedStyle(() => ({
    width: interpolate(
      (status?.currentTime ?? 0) / (status?.duration || 1),
      [0, 1],
      [0, width - 48]
    ),
  }));

  // Helper to format seconds as mm:ss
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Skeleton loader
  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <Skeleton style={{ height: 300, margin: 24, borderRadius: 16 }} />
          <Skeleton
            style={{ height: 40, marginHorizontal: 24, marginBottom: 16 }}
          />
          <Skeleton
            style={{ height: 40, marginHorizontal: 24, marginBottom: 16 }}
          />
          <Skeleton
            style={{
              height: 60,
              marginHorizontal: 24,
              borderRadius: 8,
              marginBottom: 40,
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !campaign) {
    return (
      <AnimatedSafeAreaView
        style={[styles.container, styles.screenGlow, rScreenGlowStyle]}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {/* Header -------------------------------------------------------- */}
          <View style={styles.headerRow}>
            <Image
              source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
              style={{ height: 40, width: 120 }}
              contentFit="contain"
              contentPosition="center"
            />
            <TouchableOpacity
              style={styles.walletPill}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={18}
                color="#000"
              />
              <Text style={styles.walletText}>
                ₦
                {isBalanceLoading
                  ? "..."
                  : balanceData?.data?.wallet?.balance?.toLocaleString(
                      "en-NG",
                      {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      }
                    ) ?? "N0"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Album art */}
          <View style={styles.heroContainer}>
            <Animated.Image
              source={require("../../assets/images/Asset 2@4x-8.png")}
              style={[styles.hero, thumpAnimationStyle]}
            />
          </View>

          {/* Track meta + progress ---------------------------------------- */}
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>No campaign available</Text>
            {/* No sponsored label or progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: 0 }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.time}>0:00</Text>
              <Text style={styles.time}>-0:00</Text>
            </View>
          </View>
        </ScrollView>
      </AnimatedSafeAreaView>
    );
  }

  return (
    <AnimatedSafeAreaView
      style={[styles.container, styles.screenGlow, rScreenGlowStyle]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Pull to refresh hint */}
        {showRefreshHint && (
          <Animated.View style={[styles.refreshHint, rHintStyle]}>
            <AntDesign
              name="arrowdown"
              size={28}
              color="#fff"
              style={{ marginBottom: 2 }}
            />
            <Text style={styles.refreshHintText}>Pull down to refresh!</Text>
          </Animated.View>
        )}
        {/* Header -------------------------------------------------------- */}
        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
            style={{ height: 40, width: 120 }}
            contentFit="contain"
            contentPosition="center"
          />
          <TouchableOpacity
            style={styles.walletPill}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={18}
              color="#000"
            />
            <Text style={styles.walletText}>
              {isBalanceLoading
                ? "..."
                : balanceData?.data?.wallet?.balance?.toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    minimumFractionDigits: 0,
                  }) ?? "N0"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Album art */}
        <View style={styles.heroContainer}>
          <Animated.Image
            source={require("../../assets/images/Asset 2@4x-8.png")}
            style={[styles.hero, thumpAnimationStyle]}
          />
        </View>

        {/* Track meta + progress ---------------------------------------- */}
        <View style={styles.metaWrapper}>
          <Text style={styles.title}>{campaign.songTitle}</Text>
          {campaign.isPaid && <Text style={styles.sponsored}>Sponsored</Text>}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, rProgress]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>
              {formatTime(status?.currentTime ?? 0)}
            </Text>
            <Text style={styles.time}>
              -{formatTime(status?.duration ?? 0)}
            </Text>
          </View>
          {(showPostLike || !campaign.isPaid) && (
            <View style={styles.postLikeRow}>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
              >
                <Text style={styles.skipBtnText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={handleDiscover}
              >
                <Text style={styles.discoverBtnText}>Discover</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Like Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={require("../../assets/images/Asset 2@4x-8.png")}
                style={{
                  width: 25,
                  height: 25,
                  marginBottom: 10,
                }}
                contentFit="contain"
                contentPosition="center"
              />
              <Text style={styles.modalTitle}>Do you like this song?</Text>
              <View style={{ marginTop: 24, width: "100%", gap: 10 }}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: "#ff003c" }]}
                  onPress={handleLike}
                >
                  <Text style={styles.modalBtnText}>Yes</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: "#E6E6E6" }]}
                  onPress={handleDislike}
                >
                  <Text style={[styles.modalBtnText, { color: "#000" }]}>
                    No
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AnimatedSafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  logo: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "RedditSans-Bold",
    letterSpacing: 2,
  },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  walletText: {
    marginLeft: 6,
    fontFamily: "Nunito-Medium",
  },
  heroContainer: {
    width: "80%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 24,
  },
  hero: {
    width: "35%",
    height: "35%",
  },
  heroShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },
  screenGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 150,
    elevation: 50,
  },
  metaWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: RFValue(24),
    color: "#fff",
    marginBottom: 5,
    fontFamily: "Nunito-Medium",
  },
  sponsored: {
    color: "#9ca3af",
    marginBottom: 16,
    fontFamily: "Nunito-Regular",
  },
  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#374151",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#ff003c",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  time: {
    color: "#6b7280",
    fontFamily: "Nunito-Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    width: 300,
  },
  modalTitle: {
    color: "#000",
    fontSize: RFValue(20),
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  modalBtn: {
    marginHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Medium",
  },
  postLikeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
    gap: 16,
  },
  skipBtn: {
    backgroundColor: "#08090A",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  skipBtnText: {
    color: "#fff",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Medium",
  },
  discoverBtn: {
    backgroundColor: "#E10032",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  discoverBtnText: {
    color: "#fff",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Medium",
  },
  refreshHint: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#E10032",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  refreshHintText: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    fontSize: 16,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
