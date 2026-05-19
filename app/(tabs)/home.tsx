import api from "@/api/apiclient";
import { useProfile } from "@/api/auth/auth";
import { useUpdateNotifications, useVerifiedUsersCount } from "@/api/user/user";
import { HomeFeedbackSheet } from "@/components/home/home-feedback-sheet";
import { HomeHeader } from "@/components/home/home-header";
import { HomeEmptyState, HomeLoadingState } from "@/components/home/home-state";
import { HomeTipsModal } from "@/components/home/home-tips-modal";
import { HomeUploadSheet } from "@/components/home/home-upload-sheet";
import { NowPlayingCard } from "@/components/home/now-playing-card";
import { usePlayer } from "@/components/PlayerContext";
import { NOVA_TIPS } from "@/constants/novaTips";
import { useNotification } from "@/context/notificationsContext";
import { useInboxNotifications } from "@/hooks/useInboxNotifications";
import { RFValue } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const LISTEN_COMPLETION_SECONDS = 20;
const TRACK_LOADING_TIMEOUT_MS = 12_000;
const DEFAULT_HERO = require("../../assets/images/hero-default.png");

type CreateFreeCampaignParams = {
  fileUri: string;
  fileName?: string | null;
  mimeType?: string | null;
  songLink: string;
  songTitle?: string | null;
  genre?: string | null;
};

type PickedAudio = {
  uri: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
};

type Advert = {
  id: number | string;
  imageUrl: string;
  createdAt: string;
  endDate: string;
  advertUrl: string;
};

type PlaybackSnapshot = {
  campaignId: string;
  currentTime: number;
  didJustFinish: boolean;
};

type TrackChangeState = {
  sourceCampaignId: string | null;
  sourceCurrentTime: number;
  targetCampaignId: string | null;
};

function showTransientMessage(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Notice", message);
}

function formatTime(seconds?: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function resolveAssetUri(uri?: string | null) {
  const value = uri?.trim();

  if (!value) {
    return null;
  }

  if (/^(https?:|file:|content:|data:|asset:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("./") || value.startsWith("../")) {
    return null;
  }

  const baseURL =
    typeof api.defaults.baseURL === "string" ? api.defaults.baseURL : "";

  if (!baseURL) {
    return null;
  }

  try {
    if (value.startsWith("/")) {
      return new URL(value, new URL(baseURL).origin).toString();
    }

    return new URL(value, `${baseURL.replace(/\/$/, "")}/`).toString();
  } catch {
    return null;
  }
}

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
  originalName?: string | null,
) {
  let uri = originalUri;
  let name = (originalName || `audio-${Date.now()}.mp3`).trim();

  if (!/\.(mp3|m4a|wav|aac|ogg)$/i.test(name)) {
    name += ".mp3";
  }

  if (uri.startsWith("content://")) {
    const ext = name.split(".").pop() || "mp3";
    const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  return { uri, name };
}

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
      const baseURL = (api.defaults as any)?.baseURL?.replace(/\/$/, "") || "";
      const url = `${baseURL}/campaigns/create/free`;
      const token = await SecureStore.getItemAsync("access_token");

      const result = await FileSystem.uploadAsync(url, uri, {
        httpMethod: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "audioFile",
        mimeType: type,
        parameters: {
          songLink: (songLink || "").trim(),
          ...(songTitle ? { songTitle: songTitle.trim() } : {}),
          ...(genre ? { genre: genre.trim() } : {}),
        },
      });

      let body: any = null;

      try {
        body = result.body ? JSON.parse(result.body) : null;
      } catch {
        body = result.body;
      }

      if (result.status >= 200 && result.status < 300) {
        return body;
      }

      const error: any = new Error(
        (body && body.message) || "Failed to create campaign",
      );
      error.status = result.status;
      error.payload = body;
      throw error;
    },
  });
}

const fetchAdverts = async (): Promise<Advert[]> => {
  const res = await api.get<{ data?: Advert[] }>("/adverts/active");
  return res.data?.data ?? [];
};

async function openExternalUrl(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open external URL:", error);
      showTransientMessage("No browser found to open the link");
    }
  }
}

export default function ExplorePlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const playerFrameWidth = Math.min(width - 40, 460);
  const cardArtworkHeight = Math.min(
    Math.max(playerFrameWidth * 1.08, 360),
    450,
  );
  const doubleTapWidth = width - 40;

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

  const status = useAudioPlayerStatus(player);
  const thump = useSharedValue(1);
  const advertOpacity = useSharedValue(1);
  const advertScale = useSharedValue(1);
  const finishHandledForCampaign = useRef<string | null>(null);
  const loadTimeoutAttempts = useRef<Record<string, number>>({});
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPlaybackSnapshot = useRef<PlaybackSnapshot | null>(null);
  const trackChangeState = useRef<TrackChangeState | null>(null);
  const tipsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fabIdleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fabEnabledRef = useRef(true);

  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isFabEnabled, setIsFabEnabled] = useState(true);
  const [pickedAudio, setPickedAudio] = useState<PickedAudio | null>(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [currentAdvertSlot, setCurrentAdvertSlot] = useState(-1);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isOpeningSponsor, setIsOpeningSponsor] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isDislikePending, setIsDislikePending] = useState(false);
  const [isTrackChanging, setIsTrackChanging] = useState(false);

  const { data: profileData } = useProfile();
  const greetingName =
    profileData?.data?.name?.trim()?.split(/\s+/)[0] || "Creator";
  const { data: listenerCount } = useVerifiedUsersCount();
  const { data: inboxData } = useInboxNotifications();
  const unreadNotificationCount = inboxData?.unread.length ?? 0;

  const handleOpenNotifications = useCallback(() => {
    router.push("/(others)/notifications");
  }, [router]);
  const { expoPushToken } = useNotification();
  const {
    mutate: updateNotifications,
    isPending: notifPending,
    isError: notifError,
    isSuccess: notifSuccess,
  } = useUpdateNotifications();

  const { mutateAsync: createFreeCampaign, isPending: isCreatingCampaign } =
    useCreateFreeCampaign();

  const { data: adverts = [] } = useQuery<Advert[]>({
    queryKey: ["adverts"],
    queryFn: fetchAdverts,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isPaused) {
      thump.value = withRepeat(
        withSequence(
          withTiming(1.04, {
            duration: 700,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 700,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
      return;
    }

    thump.value = withTiming(1, { duration: 180 });
  }, [isPaused, thump]);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const seen = await AsyncStorage.getItem("hasSeenTips");

      if (seen || isCancelled) {
        return;
      }

      setIsPaused(true);
      tipsTimeout.current = setTimeout(() => {
        if (isCancelled) {
          return;
        }

        try {
          player.pause();
        } catch {}

        setShowTipsModal(true);
      }, 1500);
    })();

    return () => {
      isCancelled = true;
      if (tipsTimeout.current) {
        clearTimeout(tipsTimeout.current);
      }
    };
  }, [player, setIsPaused]);

  useEffect(() => {
    if (expoPushToken && !notifPending && !notifError && !notifSuccess) {
      updateNotifications({ expoPushToken, notificationsEnabled: true });
    }
  }, [
    expoPushToken,
    notifPending,
    notifError,
    notifSuccess,
    updateNotifications,
  ]);

  useEffect(() => {
    finishHandledForCampaign.current = null;
    previousPlaybackSnapshot.current = null;
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign?.id || !status?.isLoaded || status?.isBuffering) {
      return;
    }

    loadTimeoutAttempts.current[campaign.id] = 0;
  }, [campaign?.id, status?.isBuffering, status?.isLoaded]);

  useEffect(() => {
    if (isPaused) {
      advertOpacity.value = withTiming(1, { duration: 180 });
      advertScale.value = withTiming(1, { duration: 180 });
      return;
    }

    if (!adverts.length) {
      if (currentAdvertSlot !== -1) {
        setCurrentAdvertSlot(-1);
      }
      advertOpacity.value = withTiming(1, { duration: 180 });
      advertScale.value = withTiming(1, { duration: 180 });
      return;
    }

    const fadeDuration = 320;
    let swapId: ReturnType<typeof setTimeout> | null = null;
    const timeoutId = setTimeout(() => {
      advertOpacity.value = withTiming(0, { duration: fadeDuration });

      swapId = setTimeout(() => {
        setCurrentAdvertSlot((slot) => {
          const totalSlots = adverts.length + 1;
          const nextSlot = (slot + 2 + totalSlots) % totalSlots;
          return nextSlot - 1;
        });

        advertScale.value = 0.97;
        advertOpacity.value = withTiming(1, { duration: fadeDuration });
        advertScale.value = withTiming(1, { duration: 420 });
      }, fadeDuration);
    }, 6000);

    return () => {
      clearTimeout(timeoutId);
      if (swapId) {
        clearTimeout(swapId);
      }
    };
  }, [adverts.length, advertOpacity, advertScale, currentAdvertSlot, isPaused]);

  const activeAdvert = useMemo(() => {
    if (!adverts.length || currentAdvertSlot < 0) {
      return null;
    }

    const safeIndex =
      ((currentAdvertSlot % adverts.length) + adverts.length) % adverts.length;
    return adverts[safeIndex] || null;
  }, [adverts, currentAdvertSlot]);

  const resolvedAdvertImageUrl = resolveAssetUri(activeAdvert?.imageUrl);
  const imageSource = resolvedAdvertImageUrl
    ? { uri: resolvedAdvertImageUrl }
    : DEFAULT_HERO;
  const currentAdvertUrl = resolveAssetUri(activeAdvert?.advertUrl);

  const artworkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: advertOpacity.value,
    transform: [{ scale: thump.value * advertScale.value }],
  }));

  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;
  const didJustFinish = Boolean(status?.didJustFinish);
  const hasLoadedDuration = duration > 0;
  const progress = hasLoadedDuration ? currentTime / duration : 0;
  const discoverThreshold = hasLoadedDuration ? Math.min(10, duration / 2) : 10;
  const isDiscoverReady = hasLoadedDuration && currentTime >= discoverThreshold;
  const nextCampaignId =
    currentIdx < campaigns.length - 1
      ? (campaigns[currentIdx + 1]?.id ?? null)
      : null;
  const previousCampaignId =
    currentIdx > 0 ? (campaigns[currentIdx - 1]?.id ?? null) : null;
  const isAudioLoading =
    Boolean(campaign) &&
    (isTrackChanging || !status?.isLoaded || status?.isBuffering);

  const resetTrackChangeState = useCallback(() => {
    trackChangeState.current = null;
    setIsTrackChanging(false);
  }, []);

  const beginTrackChange = useCallback(
    (targetCampaignId?: string | null) => {
      try {
        player.pause();
      } catch {}

      trackChangeState.current = {
        sourceCampaignId: campaign?.id ?? null,
        sourceCurrentTime: currentTime,
        targetCampaignId: targetCampaignId ?? null,
      };
      setIsTrackChanging(true);
    },
    [campaign?.id, currentTime, player],
  );

  useEffect(() => {
    if (!isTrackChanging) {
      return;
    }

    const pendingTrackChange = trackChangeState.current;

    if (
      !campaign?.id ||
      !pendingTrackChange ||
      !status?.isLoaded ||
      status?.isBuffering ||
      didJustFinish
    ) {
      return;
    }

    const campaignChanged = campaign.id !== pendingTrackChange.sourceCampaignId;
    const playbackReset =
      Math.abs(currentTime - pendingTrackChange.sourceCurrentTime) > 0.05;
    const targetReached = pendingTrackChange.targetCampaignId
      ? campaign.id === pendingTrackChange.targetCampaignId
      : campaignChanged || playbackReset;

    if (!targetReached || (!campaignChanged && !playbackReset)) {
      return;
    }

    resetTrackChangeState();
  }, [
    campaign?.id,
    currentTime,
    didJustFinish,
    isTrackChanging,
    resetTrackChangeState,
    status?.isBuffering,
    status?.isLoaded,
  ]);

  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (
      !campaign?.id ||
      !isAudioLoading ||
      showFeedbackSheet ||
      showTipsModal ||
      showUploadModal
    ) {
      return;
    }

    const attempts = loadTimeoutAttempts.current[campaign.id] ?? 0;

    if (attempts >= 2) {
      return;
    }

    loadTimeoutRef.current = setTimeout(() => {
      const currentAttempts =
        (loadTimeoutAttempts.current[campaign.id] ?? 0) + 1;
      loadTimeoutAttempts.current[campaign.id] = currentAttempts;

      if (currentAttempts >= 2) {
        resetTrackChangeState();
        setIsPaused(true);
        return;
      }

      beginTrackChange(nextCampaignId);

      void (async () => {
        try {
          await next();
          setIsPaused(false);
        } catch (error) {
          console.error("Failed to skip slow-loading campaign:", error);
          resetTrackChangeState();
        }
      })();
    }, TRACK_LOADING_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [
    beginTrackChange,
    campaign?.id,
    isAudioLoading,
    next,
    nextCampaignId,
    resetTrackChangeState,
    setIsPaused,
    showFeedbackSheet,
    showTipsModal,
    showUploadModal,
  ]);

  const handleNext = useCallback(async () => {
    if (isTrackChanging) {
      return;
    }

    setShowFeedbackSheet(false);
    beginTrackChange(nextCampaignId);

    try {
      await next();
    } catch (error) {
      console.error("Failed to move to next campaign:", error);
      resetTrackChangeState();
    }
  }, [
    beginTrackChange,
    isTrackChanging,
    next,
    nextCampaignId,
    resetTrackChangeState,
  ]);

  const handlePrevious = useCallback(() => {
    if (isTrackChanging || !previousCampaignId) {
      return;
    }

    setShowFeedbackSheet(false);
    beginTrackChange(previousCampaignId);

    try {
      previous();
    } catch (error) {
      console.error("Failed to move to previous campaign:", error);
      resetTrackChangeState();
    }
  }, [
    beginTrackChange,
    isTrackChanging,
    previous,
    previousCampaignId,
    resetTrackChangeState,
  ]);

  const handleOpenUploadSheet = useCallback(() => {
    try {
      player.pause?.();
    } catch {}

    setIsPaused(true);
    setShowUploadModal(true);
  }, [player, setIsPaused]);

  const resetUploadSheet = useCallback(() => {
    setPickedAudio(null);
    setMusicUrl("");
    setShowUploadModal(false);
  }, []);

  const pickAudioFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: false,
      });

      if (res.canceled) {
        return;
      }

      const asset = res.assets?.[0];

      if (!asset) {
        return;
      }

      if (asset.size != null && asset.size > MAX_FILE_BYTES) {
        showTransientMessage("Max file size is 5 MB");
        return;
      }

      setPickedAudio({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType:
          asset.mimeType || guessMimeFromName(asset.name || "audio.mp3"),
      });
    } catch (error) {
      console.warn("pickAudioFile error:", error);
      showTransientMessage("Could not open file picker");
    }
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!pickedAudio) {
      showTransientMessage("Please choose a music file");
      return;
    }

    if (!musicUrl.trim()) {
      showTransientMessage("Paste the track URL before submitting");
      return;
    }

    try {
      new URL(musicUrl.trim());
    } catch {
      showTransientMessage("That link does not look valid");
      return;
    }

    try {
      const response = await createFreeCampaign({
        fileUri: pickedAudio.uri,
        fileName: pickedAudio.name || "audio.mp3",
        mimeType: pickedAudio.mimeType || "audio/mpeg",
        songLink: musicUrl.trim(),
        songTitle:
          (pickedAudio.name || "").replace(/\.[^/.]+$/, "") || "Untitled",
        genre: "afrobesats",
      });

      showTransientMessage("Campaign created!");
      resetUploadSheet();

      try {
        await onRefresh?.();
      } catch {}

      console.log("Create free campaign response:", response);
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        "Ensure you've created a paid campaign within the last 7 days."
      );
      console.error("Create free campaign failed:", error?.payload || error);

      const message =
        error?.payload?.message ||
        (error?.status === 429 && error?.payload?.nextResetDate
          ? `Limit reached. Try again after ${error.payload.nextResetDate}`
          : error?.message || "Upload failed");

      if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert("Error", message);
      }
    }
  }, [createFreeCampaign, musicUrl, onRefresh, pickedAudio, resetUploadSheet]);

  const handleDiscover = useCallback(async () => {
    if (isDiscovering || isAudioLoading) {
      return;
    }

    if (!campaign?.id || !campaign.songLink) {
      showTransientMessage("This track is missing a discovery link");
      return;
    }

    if (!hasLoadedDuration) {
      showTransientMessage("Audio is still loading. Give it a moment.");
      return;
    }

    if (!isDiscoverReady) {
      showTransientMessage(
        `Listen for at least ${Math.ceil(discoverThreshold)}s to discover this song`,
      );
      return;
    }

    setIsDiscovering(true);

    try {
      discoverMutate({ id: campaign.id });
      player.pause();
      setIsPaused(true);

      if (campaign.isPaid) {
        listenMutate({ id: campaign.id });
        setShowFeedbackSheet(true);
        return;
      }

      await openExternalUrl(campaign.songLink);
    } finally {
      setIsDiscovering(false);
    }
  }, [
    campaign,
    discoverMutate,
    discoverThreshold,
    hasLoadedDuration,
    isAudioLoading,
    isDiscovering,
    isDiscoverReady,
    listenMutate,
    player,
    setIsPaused,
  ]);

  const handleHeroPress = useCallback(() => {
    if (isAudioLoading) {
      return;
    }

    if (isPaused) {
      play();
    } else {
      pause();
    }
  }, [isAudioLoading, isPaused, pause, play]);

  const handleSponsorPress = useCallback(async () => {
    if (!currentAdvertUrl || isOpeningSponsor || isAudioLoading) {
      return;
    }

    setIsOpeningSponsor(true);

    const advertId = activeAdvert?.id;
    if (advertId != null) {
      try {
        await api.post(`/adverts/${advertId}/click`);
      } catch (error) {
        console.warn("Failed to record advert click:", error);
      }
    }

    try {
      await openExternalUrl(currentAdvertUrl);
    } finally {
      setIsOpeningSponsor(false);
    }
  }, [activeAdvert?.id, currentAdvertUrl, isAudioLoading, isOpeningSponsor]);

  useEffect(() => {
    if (!campaign?.id) {
      return;
    }

    const currentSnapshot: PlaybackSnapshot = {
      campaignId: campaign.id,
      currentTime,
      didJustFinish,
    };
    const previousSnapshot = previousPlaybackSnapshot.current;

    if (!previousSnapshot || previousSnapshot.campaignId !== campaign.id) {
      previousPlaybackSnapshot.current = currentSnapshot;
      return;
    }

    const crossedListenThreshold =
      previousSnapshot.currentTime <= LISTEN_COMPLETION_SECONDS &&
      currentSnapshot.currentTime > LISTEN_COMPLETION_SECONDS;
    const finishedNow =
      !previousSnapshot.didJustFinish && currentSnapshot.didJustFinish;

    previousPlaybackSnapshot.current = currentSnapshot;

    if (
      (!crossedListenThreshold && !finishedNow) ||
      finishHandledForCampaign.current === campaign.id
    ) {
      return;
    }

    finishHandledForCampaign.current = campaign.id;
    listenMutate({ id: campaign.id });

    if (campaign.isPaid) {
      player.pause();
      setIsPaused(true);
      setShowFeedbackSheet(true);
      return;
    }

    beginTrackChange(nextCampaignId);

    void (async () => {
      try {
        await next();
        setIsPaused(false);
      } catch (error) {
        console.error("Failed to auto-advance campaign:", error);
        resetTrackChangeState();
      }
    })();
  }, [
    beginTrackChange,
    campaign?.id,
    campaign?.isPaid,
    currentTime,
    didJustFinish,
    listenMutate,
    next,
    nextCampaignId,
    player,
    resetTrackChangeState,
    setIsPaused,
  ]);

  const handleLike = useCallback(async () => {
    if (isLikePending || isDislikePending || isTrackChanging) {
      return;
    }

    setIsLikePending(true);
    beginTrackChange(nextCampaignId);

    try {
      await like();
      setShowFeedbackSheet(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to submit like feedback:", error);
      resetTrackChangeState();
    } finally {
      setIsLikePending(false);
    }
  }, [
    beginTrackChange,
    isDislikePending,
    isLikePending,
    isTrackChanging,
    like,
    nextCampaignId,
    resetTrackChangeState,
    setIsPaused,
  ]);

  const handleDislike = useCallback(async () => {
    if (isLikePending || isDislikePending || isTrackChanging) {
      return;
    }

    setIsDislikePending(true);
    beginTrackChange(nextCampaignId);

    try {
      await dislike();
      setShowFeedbackSheet(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to submit dislike feedback:", error);
      resetTrackChangeState();
    } finally {
      setIsDislikePending(false);
    }
  }, [
    beginTrackChange,
    dislike,
    isDislikePending,
    isLikePending,
    isTrackChanging,
    nextCampaignId,
    resetTrackChangeState,
    setIsPaused,
  ]);

  const handleContinueTips = useCallback(async () => {
    if (currentTipIdx < NOVA_TIPS.length - 1) {
      setCurrentTipIdx((idx) => idx + 1);
      return;
    }

    setShowTipsModal(false);
    await AsyncStorage.setItem("hasSeenTips", "true");
    setIsPaused(false);
    player.play();
  }, [currentTipIdx, player, setIsPaused]);

  const handleGestureLeft = useCallback(() => {
    if (currentIdx > 0) {
      handlePrevious();
    }
  }, [currentIdx, handlePrevious]);

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(280)
        .onEnd((event) => {
          if (event.x < doubleTapWidth / 2) {
            runOnJS(handleGestureLeft)();
            return;
          }

          runOnJS(handleNext)();
        }),
    [doubleTapWidth, handleGestureLeft, handleNext],
  );

  const showEmptyState = !isLoading && (!campaigns.length || !campaign);
  const bottomFabOffset = insets.bottom + 25;

  const fabOpacity = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ scale: 0.98 + 0.02 * fabOpacity.value }],
  }));

  const enableFab = useCallback(() => {
    if (!fabEnabledRef.current) {
      fabEnabledRef.current = true;
      setIsFabEnabled(true);
    }
  }, []);

  const showFab = useCallback(() => {
    enableFab();
    fabOpacity.value = withTiming(1, { duration: 160 });
  }, [enableFab, fabOpacity]);

  const scheduleFabHide = useCallback(() => {
    if (fabIdleTimeout.current) {
      clearTimeout(fabIdleTimeout.current);
      fabIdleTimeout.current = null;
    }

    fabIdleTimeout.current = setTimeout(() => {
      fabOpacity.value = withTiming(0, { duration: 260 });
      setTimeout(() => {
        fabEnabledRef.current = false;
        setIsFabEnabled(false);
      }, 280);
    }, 1600);
  }, [fabOpacity]);

  useEffect(() => {
    showFab();
    scheduleFabHide();

    return () => {
      if (fabIdleTimeout.current) {
        clearTimeout(fabIdleTimeout.current);
        fabIdleTimeout.current = null;
      }
    };
  }, [scheduleFabHide, showFab]);

  const handleHomeScroll = useCallback(() => {
    showFab();
    scheduleFabHide();
  }, [scheduleFabHide, showFab]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(225,0,50,0.18)", "rgba(225,0,50,0.02)", "transparent"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
        style={styles.topGlow}
      />

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.04)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.sideGlow}
      />

      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleHomeScroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 10,
            paddingBottom: bottomFabOffset,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#E10032"]}
            progressBackgroundColor="#111114"
          />
        }
      >
        <View style={styles.contentShell}>
          <HomeHeader
            greetingName={greetingName}
            listenerCount={listenerCount}
            onPressNotifications={handleOpenNotifications}
            unreadNotificationCount={unreadNotificationCount}
          />

          <View style={styles.heroSection}>
            {isLoading ? (
              <HomeLoadingState />
            ) : showEmptyState ? (
              <HomeEmptyState onCreatePress={handleOpenUploadSheet} />
            ) : (
              <GestureDetector gesture={gesture}>
                <View>
                  <NowPlayingCard
                    artworkHeight={cardArtworkHeight}
                    currentTimeLabel={formatTime(currentTime)}
                    durationLabel={formatTime(duration)}
                    frameWidth={playerFrameWidth}
                    imageAnimatedStyle={artworkAnimatedStyle}
                    imageSource={imageSource}
                    isAdVisible={Boolean(activeAdvert)}
                    isAudioLoading={isAudioLoading}
                    isDiscoverPending={isDiscovering}
                    isDiscoverReady={isDiscoverReady}
                    isPaused={isPaused}
                    isSponsorPending={isOpeningSponsor}
                    isSponsored={campaign.isPaid}
                    onDiscoverPress={handleDiscover}
                    onHeroPress={() => {
                      handleHeroPress();
                    }}
                    onSponsorPress={
                      currentAdvertUrl
                        ? () => {
                            void handleSponsorPress();
                          }
                        : undefined
                    }
                    progress={progress}
                  />
                </View>
              </GestureDetector>
            )}
          </View>

          <View style={styles.supportRow}>
            <View style={styles.supportCard}>
              <Ionicons
                name="cash-outline"
                size={18}
                color="#FF5177"
              />
              <Text style={styles.supportText}>
                Listens can unlock both cash and rewards.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        pointerEvents={isFabEnabled ? "auto" : "none"}
        style={[styles.fabWrap, { bottom: bottomFabOffset }, fabAnimatedStyle]}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel="Add track"
          onPress={handleOpenUploadSheet}
        >
          <LinearGradient
            colors={["#FF214F", "#B30D2D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <View style={styles.fabIcon}>
              <Ionicons
                name="add"
                size={20}
                color="#fff"
              />
            </View>
            <Text style={styles.fabText}>Add Track</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <HomeFeedbackSheet
        visible={showFeedbackSheet}
        isDislikePending={isDislikePending}
        isLikePending={isLikePending}
        onClose={() => {}}
        onLike={() => {
          void handleLike();
        }}
        onDislike={() => {
          void handleDislike();
        }}
      />

      <HomeTipsModal
        visible={showTipsModal}
        currentStep={currentTipIdx}
        totalSteps={NOVA_TIPS.length}
        tip={NOVA_TIPS[currentTipIdx] || NOVA_TIPS[0]}
        onContinue={() => {
          void handleContinueTips();
        }}
      />

      <HomeUploadSheet
        visible={showUploadModal}
        isSubmitting={isCreatingCampaign}
        musicUrl={musicUrl}
        onChangeMusicUrl={setMusicUrl}
        onClose={resetUploadSheet}
        onPickAudio={() => {
          void pickAudioFile();
        }}
        onSubmit={() => {
          void handleUploadSubmit();
        }}
        pickedAudioMimeType={pickedAudio?.mimeType}
        pickedAudioName={pickedAudio?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050507",
  },
  topGlow: {
    position: "absolute",
    top: -120,
    left: -60,
    right: -60,
    height: 280,
  },
  sideGlow: {
    position: "absolute",
    top: 180,
    right: -80,
    width: 220,
    height: 420,
    borderRadius: 220,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentShell: {
    paddingHorizontal: 20,
    gap: 26,
  },
  heroSection: {
    gap: 20,
  },
  supportRow: {
    gap: 12,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  supportText: {
    flex: 1,
    color: "#B7B8C1",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
    lineHeight: RFValue(20),
  },
  fabWrap: {
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  fabIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
});
