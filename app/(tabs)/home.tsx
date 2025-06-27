import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { usePathname } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { ReactNode } from "react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Linking,
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useProfile } from "../../api/auth/auth";
import {
  useDiscoverCampaign,
  useExploreCampaigns,
  useLikeCampaign,
  useListenToCampaign,
} from "../../api/campaign/campaign";
import { Skeleton } from "./wallet";

/**
 * ----------------------------------------------------------------------------
 *  MusicPlayerScreen – minimal promo‑snippet player (25s clip)
 * ----------------------------------------------------------------------------
 *  •   Progress bar driven by Reanimated (0 → 25s).
 *  •   Top‑right wallet pill; bottom tab‑bar with 4 icons (Home active).
 * ----------------------------------------------------------------------------
 */

const { width, height } = Dimensions.get("window");

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type RectangularProgressBarProps = {
  progress: SharedValue<number>;
  width?: number;
  height?: number;
  border?: number;
  children: ReactNode;
};

// Gradient and sparkle progress bar
function RectangularProgressBar({
  progress,
  width = 220,
  height = 220,
  border = 4,
  children,
}: RectangularProgressBarProps) {
  // SVG progress bar
  const perimeter = (width - border) * 2 + (height - border) * 2;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.value),
  }));

  return (
    <View
      style={{
        width,
        height,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
      collapsable={false}
    >
      {/* SVG Gradient Progress Border */}
      <Svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient
            id="grad"
            x1="0"
            y1="0"
            x2={width}
            y2={height}
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="0%"
              stopColor="#ff003c"
            />
            <Stop
              offset="50%"
              stopColor="#ffb347"
            />
            <Stop
              offset="100%"
              stopColor="#ff00ff"
            />
          </LinearGradient>
        </Defs>
        <Rect
          x={border / 2}
          y={border / 2}
          width={width - border}
          height={height - border}
          rx={32}
          stroke="url(#grad)"
          strokeWidth={border}
          fill="none"
        />
        <AnimatedRect
          x={border / 2}
          y={border / 2}
          width={width - border}
          height={height - border}
          rx={32}
          stroke="#fff"
          strokeWidth={border}
          fill="none"
          strokeDasharray={perimeter}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Album art and overlay */}
      <View
        style={{
          width: width - border * 4,
          height: height - border * 4,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          gap: 50,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// Header Component
type HeaderProps = { userFirstLetter: string };
const Header: React.FC<HeaderProps> = memo(function Header({
  userFirstLetter,
}) {
  return (
    <View style={styles.headerRow}>
      <Image
        source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
        style={{ height: 40, width: 120 }}
        contentFit="contain"
        contentPosition="center"
      />
      <Text
        style={{
          fontFamily: "Nunito-Medium",
          color: "#fff",
          fontSize: RFValue(20),
        }}
      >
        {`Hello, ${userFirstLetter}!`}
      </Text>
    </View>
  );
});

// MetaInfo Component
type MetaInfoProps = { campaign: any; slideDirection: "left" | "right" };
const MetaInfo: React.FC<MetaInfoProps> = memo(function MetaInfo({
  campaign,
  slideDirection,
}) {
  return (
    <View style={styles.innerMetaContainer}>
      <Animated.Text
        entering={slideDirection === "right" ? SlideInRight : SlideInLeft}
        exiting={slideDirection === "right" ? SlideOutLeft : SlideOutRight}
        style={[styles.title, { marginBottom: 4 }]}
        numberOfLines={1}
        key={campaign.songTitle}
      >
        {campaign.songTitle}
      </Animated.Text>
      {campaign.isPaid && (
        <Animated.Text
          entering={slideDirection === "right" ? SlideInRight : SlideInLeft}
          exiting={slideDirection === "right" ? SlideOutLeft : SlideOutRight}
          style={[styles.sponsored, { marginBottom: 0 }]}
          key={campaign.songTitle + "-sponsored"}
        >
          Sponsored
        </Animated.Text>
      )}
    </View>
  );
});

// PlayerProgress Component
type PlayerProgressProps = {
  player: any;
  thumpAnimationStyle: any;
  isPaused: boolean;
  onPlayPause: () => void;
  campaign: any;
  slideDirection: "left" | "right";
  setShowModal: (v: boolean) => void;
  discoverMutate: (data: { id: string }) => void;
  setIsPaused: (v: boolean) => void;
  handleNext: () => void;
};
const PlayerProgress: React.FC<PlayerProgressProps> = React.memo(
  function PlayerProgress({
    player,
    thumpAnimationStyle,
    isPaused,
    onPlayPause,
    campaign,
    slideDirection,
    setShowModal,
    discoverMutate,
    setIsPaused,
    handleNext,
  }) {
    const status = useAudioPlayerStatus(player);
    const progress = useDerivedValue(() => {
      if (status?.duration && status.duration > 0) {
        return (status.currentTime ?? 0) / status.duration;
      }
      return 0;
    }, [status]);

    useEffect(() => {
      let hasFinished = false;

      if (status?.currentTime && status.currentTime > 20) {
        hasFinished = true;
      } else if (status?.didJustFinish) {
        hasFinished = true;
      }

      if (hasFinished) {
        player.pause();

        if (campaign?.isPaid) {
          setShowModal(true);
          return;
        }

        handleNext();
      }
    }, [status?.currentTime, status?.didJustFinish]);

    const handleDiscover = async () => {
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

      // Mutate and open link
      discoverMutate({ id: campaign.id });

      player.pause();
      setIsPaused(true);

      if (campaign.isPaid) {
        setShowModal(true);
        return;
      }
      try {
        await WebBrowser.openBrowserAsync(campaign.songLink!);
      } catch (error) {
        try {
          await (async () => {
            await Linking.openURL(campaign.songLink!);
          })();
        } catch (err) {
          ToastAndroid.show(
            "No browser found to open the link",
            ToastAndroid.SHORT
          );
          console.error("Error opening song link with fallback:", err);
        }
      }
    };

    return (
      <>
        <RectangularProgressBar
          progress={progress}
          width={width - 48}
          height={height * 0.5}
          border={5}
        >
          <Pressable
            style={styles.pressableHero}
            onPress={onPlayPause}
          >
            <Animated.Image
              source={
                campaign.artworkUrl
                  ? { uri: campaign.artworkUrl }
                  : require("../../assets/images/Asset 2@4x-8.png")
              }
              style={[
                styles.hero,
                thumpAnimationStyle,
                isPaused && { opacity: 0.5 },
              ]}
              resizeMode="contain"
            />
            {isPaused && (
              <View
                style={styles.heroOverlay}
                pointerEvents="none"
              >
                <Text style={styles.heroOverlayText}>Paused</Text>
              </View>
            )}
          </Pressable>
          <MetaInfo
            campaign={campaign}
            slideDirection={slideDirection}
          />
        </RectangularProgressBar>
        <Controls handleDiscover={handleDiscover} />
      </>
    );
  }
);

// PlayerArea Component
type PlayerAreaProps = {
  player: any;
  campaign: any;
  thumpAnimationStyle: any;
  isPaused: boolean;
  onPlayPause: () => void;
  slideDirection: "left" | "right";
  handleNext: () => void;
  handlePrevious: () => void;
  currentIdx: number;
  width: number;
  setShowModal: (v: boolean) => void;
  setIsPaused: (v: boolean) => void;
  discoverMutate: (data: { id: string }) => void;
};
const PlayerArea: React.FC<PlayerAreaProps> = memo(function PlayerArea({
  player,
  campaign,
  thumpAnimationStyle,
  isPaused,
  onPlayPause,
  slideDirection,
  handleNext,
  handlePrevious,
  currentIdx,
  width,
  setShowModal,
  discoverMutate,
  setIsPaused,
}) {
  // Open songLink in browser

  return (
    <>
      <GestureDetector
        gesture={Gesture.Tap()
          .numberOfTaps(2)
          .onEnd((event) => {
            const x = event.x;
            if (x < width / 2) {
              if (currentIdx > 0) {
                runOnJS(handlePrevious)();
              } else {
                // Optionally: shake or toast
              }
            } else {
              runOnJS(handleNext)();
            }
          })}
      >
        <PlayerProgress
          player={player}
          thumpAnimationStyle={thumpAnimationStyle}
          isPaused={isPaused}
          onPlayPause={onPlayPause}
          campaign={campaign}
          slideDirection={slideDirection}
          setShowModal={setShowModal}
          discoverMutate={discoverMutate}
          setIsPaused={setIsPaused}
          handleNext={handleNext}
        />
      </GestureDetector>
    </>
  );
});

// Controls Component
type ControlsProps = { handleDiscover: () => void };
const Controls: React.FC<ControlsProps> = memo(function Controls({
  handleDiscover,
}) {
  return (
    <View style={styles.postLikeRow}>
      <TouchableOpacity
        style={styles.discoverBtn}
        onPress={handleDiscover}
      >
        <Text style={styles.discoverBtnText}>Tap to Discover</Text>
      </TouchableOpacity>
    </View>
  );
});

// LikeModal Component
type LikeModalProps = {
  showModal: boolean;
  handleLike: () => void;
  handleDislike: () => void;
  setShowModal: (v: boolean) => void;
};
const LikeModal: React.FC<LikeModalProps> = memo(function LikeModal({
  showModal,
  handleLike,
  handleDislike,
  setShowModal,
}) {
  return (
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
            style={{ width: 25, height: 25, marginBottom: 10 }}
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
              <Text style={[styles.modalBtnText, { color: "#000" }]}>No</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// TipsModal Component
type TipsModalProps = {
  showTipsModal: boolean;
  tips: string[];
  currentTipIdx: number;
  setCurrentTipIdx: React.Dispatch<React.SetStateAction<number>>;
  setShowTipsModal: (v: boolean) => void;
  setIsPaused: (v: boolean) => void;
  player: any;
};
const TipsModal: React.FC<TipsModalProps> = memo(function TipsModal({
  showTipsModal,
  tips,
  currentTipIdx,
  setCurrentTipIdx,
  setShowTipsModal,
  setIsPaused,
  player,
}) {
  return (
    <Modal
      visible={showTipsModal}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.tipsModalOverlay}>
        <View style={styles.tipsModalContent}>
          <Text style={styles.tipsModalTitle}>Nova Tips</Text>
          <Text style={styles.tipsModalText}>{tips[currentTipIdx]}</Text>
          <TouchableOpacity
            style={styles.tipsModalBtn}
            onPress={async () => {
              if (currentTipIdx < tips.length - 1) {
                setCurrentTipIdx((idx) => idx + 1);
              } else {
                setShowTipsModal(false);
                await AsyncStorage.setItem("hasSeenTips", "true");
                setIsPaused(false);
                player.play();
              }
            }}
          >
            <Text style={styles.tipsModalBtnText}>
              {currentTipIdx < tips.length - 1 ? "Proceed" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// Loader Component
type LoaderProps = {
  refreshing: boolean;
  onRefresh: () => void;
  thumpAnimationStyle: any;
};
const Loader: React.FC<LoaderProps> = memo(function Loader({
  refreshing,
  onRefresh,
  thumpAnimationStyle,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
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
});

// ErrorState Component
type ErrorStateProps = {
  refreshing: boolean;
  onRefresh: () => void;
  userFirstLetter: string;
  thumpAnimationStyle: any;
};
const ErrorState: React.FC<ErrorStateProps> = memo(function ErrorState({
  refreshing,
  onRefresh,
  userFirstLetter,
  thumpAnimationStyle,
}) {
  const progress = useDerivedValue(() => 0);

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <Header userFirstLetter={userFirstLetter} />
        <RectangularProgressBar
          progress={progress}
          width={width - 48}
          height={height * 0.5}
          border={4}
        >
          <Image
            source={require("../../assets/images/Asset 2@4x-8.png")}
            style={[
              {
                height: "35%",
                width: "35%",
                marginHorizontal: "auto",
                marginBottom: 30,
              },
              thumpAnimationStyle,
            ]}
            contentFit="contain"
            contentPosition="center"
          />
          <View style={styles.innerMetaContainer}>
            <Text style={[styles.title]}>No campaign available</Text>
          </View>
        </RectangularProgressBar>
        <View style={styles.metaWrapper}>
          <View style={styles.postLikeRow} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

export default function ExplorePlayerScreen() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useExploreCampaigns(
    { page }
  );
  const pathname = usePathname();

  const campaigns = useMemo(() => data?.data?.campaigns || [], [data]);
  const pagination = data?.data?.pagination;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const colorProgress = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const thump = useSharedValue(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const tips = [
    "Earn cash instantly when you listen to songs with the 'sponsored' tag.",
    "Earn more cash when you invite friends",
    "Tap the logo to pause or play the music.",
    "Double-tap the right hand side of the logo to skip to the next song.",
    "Double-tap the left hand side of the logo to go back to the previous song.",
  ];
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );

  const { data: profileData } = useProfile();
  const userFirstLetter =
    profileData?.data?.name?.trim()?.charAt(0)?.toUpperCase() || "C";

  // Start animations
  useEffect(() => {
    if (!isPaused) {
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
    } else {
      // Pause thump animation
      thump.value = 1;
    }
  }, [isPaused]);

  const thumpAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thump.value }],
  }));

  const { mutate: listenMutate } = useListenToCampaign();
  const { mutate: likeMutate } = useLikeCampaign();
  const { mutate: discoverMutate } = useDiscoverCampaign();

  const campaign = useMemo(
    () => campaigns[currentIdx],
    [campaigns, currentIdx]
  );
  const player = useAudioPlayer(
    campaign?.audioFileUrl ? { uri: campaign.audioFileUrl } : undefined
  );

  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/home") {
      player.pause();
      setIsPaused(true);
    }
  }, [pathname]);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    try {
      if (player && player.isLoaded) {
        player.pause();
      }
      await refetch();
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [player, refetch]);

  // Play the current campaign's audio and animate progress bar to match duration (fix glitch)
  useEffect(() => {
    if (campaign?.audioFileUrl) {
      player.replace({ uri: campaign.audioFileUrl });
      player.seekTo(0);
      player.play();
      listenMutate({ id: campaign.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.audioFileUrl]);

  console.log("current Idx", currentIdx);

  // Move to next campaign or next page
  const handleNext = async () => {
    setSlideDirection("right");
    setShowModal(false);
    if (currentIdx < campaigns.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else if (pagination) {
      const nextPage = pagination.page + 1;
      if (nextPage > pagination.totalPages) {
        setPage(1);
        setCurrentIdx(0);
        player.pause();
        await refetch();
      } else {
        setPage(nextPage);
        setCurrentIdx(0);
        player.pause();
        await refetch();
      }
    }
  };

  // Move to previous campaign
  const handlePrevious = () => {
    setSlideDirection("left");
    setShowModal(false);
    if (currentIdx > 0) {
      setCurrentIdx((idx) => idx - 1);
    }
  };

  // No longer move to next on dislike
  const handleDislike = () => {
    handleNext();
  };

  // Like the campaign (no longer moves to next)
  const handleLike = async () => {
    likeMutate({ id: campaign.id });
    // Show skip/discover buttons
    if (campaign?.songLink) {
      await WebBrowser.openBrowserAsync(campaign.songLink);
    }
    handleNext();
  };

  // Show tips modal for first-time users
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem("hasSeenTips");
      if (!seen) {
        setIsPaused(true);
        setTimeout(() => {
          try {
            player.pause();
          } catch (e) {
            console.warn("Failed to pause player:", e);
          }

          setShowTipsModal(true);
        }, 1500);
      }
    })();
    // Only run this when player is ready
  }, [player]);

  // Skeleton loader
  if (isLoading || isFetching) {
    return (
      <Loader
        refreshing={refreshing}
        onRefresh={onRefresh}
        thumpAnimationStyle={thumpAnimationStyle}
      />
    );
  }

  if (isError || !campaign) {
    return (
      <ErrorState
        refreshing={refreshing}
        onRefresh={onRefresh}
        userFirstLetter={userFirstLetter}
        thumpAnimationStyle={thumpAnimationStyle}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <Header userFirstLetter={userFirstLetter} />
        <PlayerArea
          player={player}
          campaign={campaign}
          thumpAnimationStyle={thumpAnimationStyle}
          isPaused={isPaused}
          onPlayPause={() => {
            if (isPaused) {
              setIsPaused(false);
              player.play();
            } else {
              setIsPaused(true);
              player.pause();
            }
          }}
          slideDirection={slideDirection}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          currentIdx={currentIdx}
          width={width}
          setShowModal={setShowModal}
          discoverMutate={discoverMutate}
          setIsPaused={setIsPaused}
        />
        <LikeModal
          showModal={showModal}
          handleLike={handleLike}
          handleDislike={handleDislike}
          setShowModal={setShowModal}
        />
        <TipsModal
          showTipsModal={showTipsModal}
          tips={tips}
          currentTipIdx={currentTipIdx}
          setCurrentTipIdx={setCurrentTipIdx}
          setShowTipsModal={setShowTipsModal}
          setIsPaused={setIsPaused}
          player={player}
        />
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 40,
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
  },
  pressableHero: {
    height: "35%",
    width: "35%",
  },
  hero: {
    width: "100%",
    height: "100%",
    marginHorizontal: "auto",
  },
  heroShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 20,
  },
  screenGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 50,
  },
  metaWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  innerMetaContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  title: {
    fontSize: RFValue(22),
    color: "#fff",
    marginBottom: 5,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  sponsored: {
    color: "#9ca3af",
    marginBottom: 16,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
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
    fontSize: RFValue(18),
    fontFamily: "Nunito-Medium",
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 24,
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
  refreshHintAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: "#E10032",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  heroOverlayText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Bold",
    backgroundColor: "rgba(0,0,0,0.32)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    width: 300,
    gap: 10,
  },
  tipsModalTitle: {
    color: "#000",
    fontSize: RFValue(14),
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  tipsModalText: {
    color: "#000",
    fontSize: RFValue(13),
    fontFamily: "Nunito-Medium",
    textAlign: "center",
  },
  tipsModalBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  tipsModalBtnText: {
    color: "#fff",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
});
