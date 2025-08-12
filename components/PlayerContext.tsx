import {
  useDiscoverCampaign,
  useExploreCampaigns,
  useLikeCampaign,
  useListenToCampaign,
} from "@/api/campaign/campaign";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "expo-audio";
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
import { AppState, Linking, ToastAndroid } from "react-native";

// Types
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
  dislike: () => void;
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
  const { data, isLoading, isError, refetch, isFetching } = useExploreCampaigns(
    { page }
  );
  const pathname = usePathname();

  const queryClient = useQueryClient();

  // Debug: Log initial pathname
  useEffect(() => {
    console.log("🔍 PlayerContext: Initial pathname =", pathname);
  }, []);

  const campaigns = useMemo(() => data?.data?.campaigns || [], [data]);
  const pagination = data?.data?.pagination;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debug: Log initial isPaused state
  useEffect(() => {
    console.log("🔍 PlayerContext: Initial isPaused =", isPaused);
  }, []);

  const { mutate: listenMutate } = useListenToCampaign();
  const { mutate: likeMutate } = useLikeCampaign();
  const { mutate: discoverMutate } = useDiscoverCampaign();

  const campaign = useMemo(() => {
    return campaigns[currentIdx];
  }, [campaigns, currentIdx]);
  const player = useAudioPlayer(
    campaign?.audioFileUrl ? { uri: campaign.audioFileUrl } : undefined
  );

  // Pause player for new users
  useEffect(() => {
    (async () => {
      const isNewUser = await SecureStore.getItemAsync("isNewUser");
      console.log("🔍 PlayerContext: isNewUser =", isNewUser);
      if (isNewUser === "true") {
        console.log("🔍 PlayerContext: Pausing for new user");
        player.pause();
        setIsPaused(true);
        await SecureStore.deleteItemAsync("isNewUser");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause when not on home
  useEffect(() => {
    console.log("🔍 PlayerContext: Pathname changed to =", pathname);
    if (pathname !== "/home") {
      console.log("🔍 PlayerContext: Pausing because not on home");
      player.pause();
      setIsPaused(true);
    } else {
      console.log("🔍 PlayerContext: Now on home, resuming player");
      setIsPaused(false);
    }
  }, [pathname]);

  // Play/pause on isPaused change
  useEffect(() => {
    console.log("🔍 PlayerContext: isPaused changed to =", isPaused);
    if (isPaused) {
      console.log("🔍 PlayerContext: Pausing player due to isPaused = true");
      player.pause();
    } else {
      console.log("🔍 PlayerContext: Playing player due to isPaused = false");
      player.play();
    }
  }, [isPaused]);

  // AppState listener for foreground/background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log("🔍 PlayerContext: AppState changed to =", nextAppState);
      if (nextAppState === "active") {
        console.log(
          "🔍 PlayerContext: App became active, setting isPaused = false"
        );
        setIsPaused(false);
        setTimeout(() => {
          try {
            console.log(pathname);
            if (pathname === "/home") {
              console.log("🔍 PlayerContext: Playing on home after app active");
              player.play();
            } else {
              console.log(
                "🔍 PlayerContext: Pausing because not on home after app active"
              );
              player.pause();
            }
          } catch (err) {
            console.log("dan dan dannnnn...");
            ToastAndroid.show("Tap logo to resume player", ToastAndroid.SHORT);
          }
        }, 1000);
      } else if (nextAppState === "background") {
        console.log("🔍 PlayerContext: App went to background, pausing");
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [player, pathname]);

  // Play new audio on campaign change
  useEffect(() => {
    if (campaign?.audioFileUrl) {
      console.log("🔍 PlayerContext: Campaign changed, loading new audio");
      player.replace({ uri: campaign.audioFileUrl });
      player.seekTo(0);
      if (isPaused === true) {
        console.log("🔍 PlayerContext: Keeping paused after campaign change");
        player.pause();
      } else {
        console.log("🔍 PlayerContext: Playing after campaign change");
        player.play();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.audioFileUrl, currentIdx]);

  // Navigation
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
          player.pause();
          await refetch();
        } else {
          setPage(nextPage);
          setCurrentIdx(0);
          player.pause();
          await refetch();
        }
      }
    },
    [currentIdx, campaigns.length, pagination, player, refetch]
  );

  const previous = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((idx) => idx - 1);
    }
  }, [currentIdx]);

  const play = useCallback(() => {
    setIsPaused(false);
    player.play();
  }, [player]);

  const pause = useCallback(() => {
    setIsPaused(true);
    player.pause();
  }, [player]);

  const like = useCallback(async () => {
    if (!campaign) return;
    likeMutate({ id: campaign.id });
    await Linking.openURL(campaign.songLink!);
    next();
  }, [campaign, likeMutate]);

  const dislike = useCallback(() => {
    next();
  }, [next]);

  // Refresh
  const isRefreshingRef = useRef(false);
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
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
