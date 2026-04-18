import {
  useDiscoverCampaign,
  useDisLikeCampaign,
  useExploreCampaigns,
  useLikeCampaign,
  useListenToCampaign,
} from "@/api/campaign/campaign";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  ToastAndroid,
} from "react-native";

interface PlayerContextType {
  player: any;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  campaigns: any[];
  campaign: any;
  play: () => void;
  pause: () => void;
  next: (paused?: boolean) => Promise<void>;
  previous: () => void;
  like: () => Promise<void>;
  dislike: () => Promise<void>;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  listenMutate: (data: { id: string }) => void;
  discoverMutate: (data: { id: string }) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useExploreCampaigns({ page });
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const campaigns = useMemo(() => data?.data?.campaigns || [], [data]);
  const pagination = data?.data?.pagination;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const lastLoadedSourceRef = useRef<string | null>(null);
  const needsSeekRef = useRef(false);
  const lastPlaybackIntentRef = useRef<"play" | "pause" | null>(null);

  useEffect(() => {
    console.log("[PlayerContext] isPaused changed =", isPaused);
  }, [isPaused]);

  const { mutate: listenMutate } = useListenToCampaign();
  const { mutateAsync: likeMutate } = useLikeCampaign();
  const { mutate: discoverMutate } = useDiscoverCampaign();
  const { mutateAsync: dislikeMutate } = useDisLikeCampaign();

  const campaign = useMemo(() => campaigns[currentIdx], [campaigns, currentIdx]);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const safePause = useCallback(
    (reason: string) => {
      try {
        player.pause();
        lastPlaybackIntentRef.current = "pause";
      } catch (error) {
        console.warn(`PlayerContext: failed to pause (${reason})`, error);
      }
    },
    [player]
  );

  const safePlay = useCallback(
    (reason: string) => {
      if (!status.isLoaded) {
        console.log(
          "[PlayerContext] Waiting for audio to load before play",
          reason
        );
        return;
      }

      try {
        player.play();
        lastPlaybackIntentRef.current = "play";
      } catch (error) {
        console.warn(`PlayerContext: failed to play (${reason})`, error);
      }
    },
    [player, status.isLoaded]
  );

  const syncPlayback = useCallback(
    (reason: string) => {
      const isOnHome = pathname === "/home";
      const hasAudio = Boolean(campaign?.audioFileUrl);
      const shouldPlay =
        hasAudio && isOnHome && !isPaused && appState === "active";

      if (!hasAudio) {
        safePause(`${reason}: no campaign audio`);
        return;
      }

      if (!status.isLoaded) {
        console.log(
          "[PlayerContext] Audio not loaded yet, deferring playback sync",
          reason
        );
        return;
      }

      if (shouldPlay) {
        if (lastPlaybackIntentRef.current === "play" && status.playing) {
          return;
        }

        console.log("[PlayerContext] Syncing to play", reason);
        safePlay(reason);
        return;
      }

      if (lastPlaybackIntentRef.current === "pause" && !status.playing) {
        return;
      }

      console.log("[PlayerContext] Syncing to pause", reason);
      safePause(reason);
    },
    [
      appState,
      campaign?.audioFileUrl,
      isPaused,
      pathname,
      safePause,
      safePlay,
      status.isLoaded,
      status.playing,
    ]
  );

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const isNewUser = await SecureStore.getItemAsync("isNewUser");
      console.log("[PlayerContext] isNewUser =", isNewUser);

      if (!isCancelled && isNewUser === "true") {
        console.log("[PlayerContext] Pausing for new user");
        setIsPaused(true);
        await SecureStore.deleteItemAsync("isNewUser");
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    console.log("[PlayerContext] Pathname changed =", pathname);
    if (pathname !== "/home") {
      console.log("[PlayerContext] Pausing because not on home");
      setIsPaused(true);
    } else {
      console.log("[PlayerContext] Now on home, resuming player");
      setIsPaused(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log("[PlayerContext] AppState changed =", nextAppState);
      setAppState(nextAppState);

      if (nextAppState === "active" && pathname === "/home") {
        console.log("[PlayerContext] App became active on home");
        setIsPaused(false);
      } else if (
        nextAppState === "background" ||
        nextAppState === "inactive"
      ) {
        console.log("[PlayerContext] App went to background");
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [pathname]);

  useEffect(() => {
    const nextSource = campaign?.audioFileUrl || null;

    if (!nextSource) {
      lastLoadedSourceRef.current = null;
      needsSeekRef.current = false;
      lastPlaybackIntentRef.current = null;
      syncPlayback("campaign cleared");
      return;
    }

    if (lastLoadedSourceRef.current === nextSource) {
      return;
    }

    console.log("[PlayerContext] Campaign changed, loading new audio");
    lastLoadedSourceRef.current = nextSource;
    needsSeekRef.current = true;
    lastPlaybackIntentRef.current = null;

    try {
      player.replace({ uri: nextSource });
    } catch (error) {
      console.warn("PlayerContext: failed to replace player source", error);
    }
  }, [campaign?.audioFileUrl, player, syncPlayback]);

  useEffect(() => {
    if (!campaign?.audioFileUrl || !status.isLoaded || !needsSeekRef.current) {
      return;
    }

    try {
      player.seekTo(0);
      needsSeekRef.current = false;
    } catch (error) {
      console.warn("PlayerContext: failed to seek after loading audio", error);
    }
  }, [campaign?.audioFileUrl, player, status.isLoaded]);

  useEffect(() => {
    syncPlayback("playback intent update");
  }, [syncPlayback]);

  const next = useCallback(
    async (paused = false) => {
      if (currentIdx < campaigns.length - 1) {
        setCurrentIdx((idx) => {
          console.log("idx", idx);
          return idx + 1;
        });
        if (paused) setIsPaused(true);
      } else if (pagination) {
        const nextPage = pagination.page + 1;
        if (nextPage > pagination.totalPages) {
          setPage(1);
          setCurrentIdx(0);
          if (nextPage - 1 === 1) {
            queryClient.invalidateQueries({
              queryKey: ["explore", 1, 10],
            });
          }
          safePause("queue wrapped");
          await refetch();
        } else {
          setPage(nextPage);
          setCurrentIdx(0);
          safePause("queue advanced");
          await refetch();
        }
      }
    },
    [campaigns.length, currentIdx, pagination, queryClient, refetch, safePause]
  );

  const previous = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((idx) => idx - 1);
    }
  }, [currentIdx]);

  const play = useCallback(() => {
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const like = useCallback(async () => {
    try {
      if (!campaign) return;
      await likeMutate({ id: campaign.id });
      await Linking.openURL(campaign.songLink!);
      await next();
    } catch (e) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Failed to like campaign", ToastAndroid.SHORT);
      } else {
        alert("Failed to like campaign");
      }
      throw e;
    }
  }, [campaign, likeMutate, next]);

  const dislike = useCallback(async () => {
    if (!campaign) return;
    try {
      await dislikeMutate({ id: campaign.id });
      await next();
    } catch (e) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Failed to dislike campaign", ToastAndroid.SHORT);
      } else {
        alert("Failed to dislike campaign");
      }
      throw e;
    }
  }, [campaign, dislikeMutate, next]);

  const isRefreshingRef = useRef(false);
  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    try {
      if (player && player.isLoaded) {
        safePause("refresh");
      }
      await refetch();
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [player, refetch, safePause]);

  const value = useMemo(
    () => ({
      player,
      isPaused,
      setIsPaused,
      currentIdx,
      setCurrentIdx,
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
    }),
    [
      campaign,
      campaigns,
      currentIdx,
      dislike,
      discoverMutate,
      isLoading,
      isPaused,
      like,
      listenMutate,
      next,
      onRefresh,
      pause,
      play,
      player,
      previous,
      refreshing,
      setCurrentIdx,
      setIsPaused,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
