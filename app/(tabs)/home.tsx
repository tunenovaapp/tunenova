import api from "@/api/apiclient";
import { useNotification } from "@/context/notificationsContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import type { ReactNode } from "react";
import React, { memo, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  useUpdateNotifications,
  useVerifiedUsersCount,
} from "../../api/user/user";
import { usePlayer } from "../../components/PlayerContext";
import { Skeleton } from "./wallet";

const { width, height } = Dimensions.get("window");
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/* ------------------------------------------------------------------ */
/*  File helpers — mirror the “works” page behavior                   */
/* ------------------------------------------------------------------ */
function guessMimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "aac":
      return "audio/aac";
    case "ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
}

async function prepareFileForUpload(
  originalUri: string,
  originalName?: string | null
) {
  let uri = originalUri;
  let name = (originalName || `audio-${Date.now()}.mp3`).trim();

  // Ensure we have a valid extension for the backend
  if (!/\.(mp3|m4a|wav|aac|ogg)$/i.test(name)) {
    name += ".mp3";
  }

  // On Android content:// must be copied to a file path
  if (uri.startsWith("content://")) {
    const ext = name.split(".").pop() || "mp3";
    const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }
  return { uri, name };
}

/* ------------------------------------------------------------------ */
/*  Mutation — switch to FileSystem.uploadAsync (no axios)            */
/* ------------------------------------------------------------------ */
type CreateFreeCampaignParams = {
  fileUri: string;
  fileName?: string | null;
  mimeType?: string | null;
  songLink: string;
  songTitle?: string | null;
  genre?: string | null;
};

function useCreateFreeCampaign() {
  return useMutation({
    mutationFn: async ({
      fileUri,
      fileName,
      mimeType,
      songLink,
      songTitle,
      genre,
    }: CreateFreeCampaignParams) => {
      const { uri, name } = await prepareFileForUpload(fileUri, fileName);
      const type = mimeType || guessMimeFromName(name);

      // Build URL from axios client baseURL
      const baseURL = (api.defaults as any)?.baseURL?.replace(/\/$/, "") || "";
      const url = `${baseURL}/campaigns/create/free`;

      // Reuse Authorization header if present on axios client; fallback to AsyncStorage
      const headers: Record<string, string> = { Accept: "application/json" };

      const token = await SecureStore.getItemAsync("access_token");

      headers["Authorization"] = `Bearer ${token}`;

      // Use native multipart upload for reliability
      const result = await FileSystem.uploadAsync(url, uri, {
        httpMethod: "POST",
        headers,
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "audioFile",
        // Although not required for MULTIPART, some servers prefer explicit type
        // (Expo will infer if omitted)
        mimeType: type,
        parameters: {
          songLink: (songLink || "").trim(),
          ...(songTitle ? { songTitle: songTitle.trim() } : {}),
          ...(genre ? { genre: genre.trim() } : {}),
        },
      });

      // Parse and normalize response/errors
      let body: any = null;
      try {
        body = result.body ? JSON.parse(result.body) : null;
      } catch {
        // keep body as raw string if not JSON
        body = result.body;
      }

      if (result.status >= 200 && result.status < 300) {
        return body;
      }

      const err: any = new Error(
        (body && body.message) || "Failed to create campaign"
      );
      err.status = result.status;
      err.payload = body;
      throw err;
    },
  });
}

/* ------------------------------------------------------------------ */
/*  UI                                                                */
/* ------------------------------------------------------------------ */

type RectangularProgressBarProps = {
  progress: SharedValue<number>;
  width?: number;
  height?: number;
  border?: number;
  children: ReactNode;
};

function RectangularProgressBar({
  progress,
  width = 220,
  height = 220,
  border = 4,
  children,
}: RectangularProgressBarProps) {
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
          fontFamily: "RedditSans-Bold",
          color: "#fff",
          fontSize: RFValue(18),
        }}
      >
        {`Hey ${userFirstLetter} 🎧`}
      </Text>
    </View>
  );
});

type MetaInfoProps = { campaign: any; slideDirection: "left" | "right" };
const MetaInfo: React.FC<MetaInfoProps> = memo(function MetaInfo({
  campaign,
  slideDirection,
}) {
  return (
    <View style={styles.innerMetaContainer}>
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
  listenMutate: (data: { id: string }) => void;
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
    listenMutate,
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
        listenMutate({ id: campaign.id });
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

      if (currentTime < requiredTime || !status) {
        ToastAndroid.show(
          `Listen for at least ${Math.ceil(
            requiredTime
          )}s to discover this song!`,
          ToastAndroid.SHORT
        );
        return;
      }

      discoverMutate({ id: campaign.id });

      player.pause();
      setIsPaused(true);

      if (campaign.isPaid) {
        listenMutate({ id: campaign.id });
        setShowModal(true);
        return;
      }
      try {
        await WebBrowser.openBrowserAsync(campaign.songLink!);
      } catch {
        try {
          await Linking.openURL(campaign.songLink!);
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
  listenMutate: (data: { id: string }) => void;
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
  listenMutate,
}) {
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
          listenMutate={listenMutate}
        />
      </GestureDetector>
    </>
  );
});

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

/* ------------------------------------------------------------------ */
/*  Home Screen                                                       */
/* ------------------------------------------------------------------ */
type PickedAudio = {
  uri: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
};

export default function ExplorePlayerScreen() {
  const {
    player,
    isPaused,
    setIsPaused,
    currentIdx,
    campaigns,
    campaign,
    play,
    pause,
    next,
    previous,
    like,
    dislike,
    refreshing,
    onRefresh,
    isLoading,
    listenMutate,
    discoverMutate,
  } = usePlayer();

  const [showModal, setShowModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );

  const thump = useSharedValue(1);
  const thumpAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thump.value }],
  }));
  useEffect(() => {
    if (!isPaused) {
      thump.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      thump.value = 1;
    }
  }, [isPaused]);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem("hasSeenTips");
      if (!seen) {
        setIsPaused(true);
        setTimeout(() => {
          try {
            player.pause();
          } catch {}
          setShowTipsModal(true);
        }, 1500);
      }
    })();
  }, [player]);

  const { data: profileData } = useProfile();
  const userFirstLetter =
    profileData?.data?.name?.trim()?.charAt(0)?.toUpperCase() || "C";
  const { data: verifiedUsersCount } = useVerifiedUsersCount();
  const { expoPushToken } = useNotification();
  const {
    mutate: updateNotifications,
    isPending: notifPending,
    isError: notifError,
    isSuccess: notifSuccess,
  } = useUpdateNotifications();

  useEffect(() => {
    if (expoPushToken && !notifPending && !notifError && !notifSuccess) {
      updateNotifications({ expoPushToken, notificationsEnabled: true });
    }
  }, [expoPushToken, notifPending, notifError, notifSuccess]);

  // --- Bottom Modal (Create FREE) ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pickedAudio, setPickedAudio] = useState<PickedAudio | null>(null);
  const [musicUrl, setMusicUrl] = useState("");

  const { mutateAsync: createFreeCampaign, isPending: isCreatingCampaign } =
    useCreateFreeCampaign();

  const openUploadSheet = () => {
    try {
      player.pause?.();
    } catch {}
    setIsPaused(true);
    setShowUploadModal(true);
  };

  const resetUploadSheet = () => {
    setPickedAudio(null);
    setMusicUrl("");
    setShowUploadModal(false);
  };

  const pickAudioFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "audio/mpeg",
        copyToCacheDirectory: false,
      });

      if ((res as any)?.canceled || (res as any)?.type === "cancel") return;

      let asset:
        | DocumentPicker.DocumentPickerAsset
        | (DocumentPicker.DocumentResult & { assets?: any })
        | undefined;

      if ("assets" in res && res.assets?.length) {
        asset = res.assets[0];
      } else if ((res as any)?.type === "success") {
        asset = res as any;
      }

      if (!asset) return;

      // Optional: enforce 5MB limit just like your form page
      if (asset.size != null && asset.size > MAX_FILE_BYTES) {
        ToastAndroid.show("Max file size is 5 MB", ToastAndroid.SHORT);
        return;
      }

      setPickedAudio({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType || "audio/mpeg",
      });
    } catch (e) {
      console.warn("pickAudioFile error:", e);
      ToastAndroid.show("Could not open file picker", ToastAndroid.SHORT);
    }
  };

  const handleUploadSubmit = async () => {
    if (!pickedAudio) {
      ToastAndroid.show("Please choose a music file", ToastAndroid.SHORT);
      return;
    }
    if (!musicUrl.trim()) {
      ToastAndroid.show(
        "Paste the track URL (e.g. Spotify link)",
        ToastAndroid.SHORT
      );
      return;
    }

    try {
      new URL(musicUrl.trim());
    } catch {
      ToastAndroid.show("That link doesn't look valid", ToastAndroid.SHORT);
      return;
    }

    try {
      const resp = await createFreeCampaign({
        fileUri: pickedAudio.uri,
        fileName: pickedAudio.name || "audio.mp3",
        mimeType: pickedAudio.mimeType || "audio/mpeg",
        songLink: musicUrl.trim(),
        songTitle:
          (pickedAudio.name || "").replace(/\.[^/.]+$/, "") || "Untitled",
        genre: "afrobesats", // set your default if needed
      });

      ToastAndroid.show("Campaign created!", ToastAndroid.SHORT);
      resetUploadSheet();
      try {
        onRefresh?.();
      } catch {}
      console.log("Create free campaign response:", resp);
    } catch (err: any) {
      console.error("Create free campaign failed:", err?.payload || err);
      const msg =
        err?.payload?.message ||
        (err?.status === 429 && err?.payload?.nextResetDate
          ? `Limit reached. Try again after ${err.payload.nextResetDate}`
          : err?.message || "Upload failed");
      if (Platform.OS === "android") {
        ToastAndroid.show(msg, ToastAndroid.LONG);
      } else {
        Alert.alert("Error", msg);
      }
    }
  };

  if (isLoading) {
    return (
      <Loader
        refreshing={refreshing}
        onRefresh={onRefresh}
        thumpAnimationStyle={thumpAnimationStyle}
      />
    );
  }

  if (!campaigns.length || !campaign) {
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
          onPlayPause={() => (isPaused ? play() : pause())}
          slideDirection={slideDirection}
          handleNext={async () => {
            setSlideDirection("right");
            setShowModal(false);
            await next();
          }}
          handlePrevious={() => {
            setSlideDirection("left");
            setShowModal(false);
            previous();
          }}
          currentIdx={currentIdx}
          width={width}
          setShowModal={setShowModal}
          discoverMutate={discoverMutate}
          listenMutate={listenMutate}
          setIsPaused={setIsPaused}
        />
        {verifiedUsersCount ? (
          <Text
            style={{
              marginTop: RFValue(16),
              color: "#777",
              textAlign: "center",
              fontFamily: "Nunito-Regular",
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
        <LikeModal
          showModal={showModal}
          handleLike={async () => {
            await like();
            setShowModal(false);
          }}
          handleDislike={() => {
            dislike();
            setShowModal(false);
          }}
          setShowModal={setShowModal}
        />
        <TipsModal
          showTipsModal={showTipsModal}
          tips={[
            "Earn cash instantly when you listen to songs with the 'sponsored' tag.",
            "Earn more cash when you invite friends",
            "Tap the logo to pause or play the music.",
            "Double-tap the right hand side of the logo to skip to the next song.",
            "Double-tap the left hand side of the logo to go back to the previous song.",
          ]}
          currentTipIdx={currentTipIdx}
          setCurrentTipIdx={setCurrentTipIdx}
          setShowTipsModal={setShowTipsModal}
          setIsPaused={setIsPaused}
          player={player}
        />
      </ScrollView>

      {/* --- Floating Action Button (FAB) --- */}
      <TouchableOpacity
        onPress={openUploadSheet}
        accessibilityRole="button"
        accessibilityLabel="Add track"
        activeOpacity={0.85}
        style={styles.fab}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* --- Bottom Sheet Upload Modal (Free Route) --- */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={resetUploadSheet}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={resetUploadSheet}
        >
          <Pressable
            style={styles.bottomSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a track</Text>

            <Pressable
              style={[
                styles.sheetFileBtn,
                isCreatingCampaign && { opacity: 0.6 },
              ]}
              onPress={pickAudioFile}
              disabled={isCreatingCampaign}
            >
              <Text style={styles.sheetFileBtnText}>
                {pickedAudio?.name ? pickedAudio.name : "Choose music file"}
              </Text>
              {pickedAudio?.mimeType ? (
                <Text style={styles.sheetFileMeta}>{pickedAudio.mimeType}</Text>
              ) : null}
            </Pressable>

            <KeyboardAvoidingView
              behavior={Platform.select({ ios: "padding", android: undefined })}
            >
              <TextInput
                style={styles.sheetInput}
                placeholder="Paste Spotify/Apple Music/URL"
                placeholderTextColor="#888"
                value={musicUrl}
                onChangeText={setMusicUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                editable={!isCreatingCampaign}
              />
            </KeyboardAvoidingView>

            <View style={styles.sheetActionRow}>
              <Pressable
                style={[
                  styles.sheetActionBtn,
                  { backgroundColor: "#E6E6E6" },
                  isCreatingCampaign && { opacity: 0.7 },
                ]}
                onPress={resetUploadSheet}
                disabled={isCreatingCampaign}
              >
                <Text style={[styles.sheetActionBtnText, { color: "#000" }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sheetActionBtn,
                  { backgroundColor: "#E10032" },
                  isCreatingCampaign && { opacity: 0.7 },
                ]}
                onPress={handleUploadSubmit}
                disabled={isCreatingCampaign}
              >
                <Text style={styles.sheetActionBtnText}>
                  {isCreatingCampaign ? "Submitting..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
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
    fontFamily: "Nunito-Bold",
    textAlign: "center",
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

  // FAB
  fab: {
    position: "absolute",
    right: 24,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E10032",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    color: "#fff",
    fontSize: RFValue(24),
    lineHeight: RFValue(24),
    fontFamily: "Nunito-Bold",
  },

  // Bottom Sheet
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#0E0E0E",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2A2A2A",
    marginBottom: 12,
  },
  sheetTitle: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(16),
    textAlign: "center",
    marginBottom: 16,
  },
  sheetFileBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#252525",
  },
  sheetFileBtnText: {
    color: "#fff",
    fontFamily: "Nunito-Medium",
    fontSize: RFValue(13),
  },
  sheetFileMeta: {
    color: "#9ca3af",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(11),
    marginTop: 6,
  },
  sheetInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1A1A1A",
    color: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#252525",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
    marginBottom: 16,
  },
  sheetActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  sheetActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActionBtnText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(13),
  },
});
