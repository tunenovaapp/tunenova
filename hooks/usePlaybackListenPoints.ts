import { useEffect, useRef } from "react";
import type { ListenBody } from "../api/campaign/campaign";

const INTERVAL_SECONDS = 10;
const MAX_INTERVALS = 3;

export function usePlaybackListenPoints({
  campaignId,
  currentTime,
  isLoaded,
  isPlaying,
  didJustFinish,
  recordListen,
}: {
  campaignId: ListenBody["id"] | undefined;
  currentTime: number;
  isLoaded: boolean;
  isPlaying: boolean;
  didJustFinish: boolean;
  recordListen: (listen: ListenBody) => void;
}) {
  const playback = useRef<{
    campaignId: ListenBody["id"];
    playbackId: string;
    position: number;
    reportedIntervals: number;
  } | null>(null);

  useEffect(() => {
    if (playback.current?.campaignId !== campaignId) {
      playback.current = null;
    }
    if (campaignId == null || !isLoaded) return;

    const previous = playback.current;
    // A native player can still report the previous track's position on change.
    if (!previous || (currentTime < previous.position && currentTime < 1)) {
      if (currentTime >= INTERVAL_SECONDS || didJustFinish) return;
      playback.current = {
        campaignId,
        playbackId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        position: currentTime,
        reportedIntervals: 0,
      };
      return;
    }

    previous.position = currentTime;
    if (!isPlaying && !didJustFinish) return;

    const intervals = Math.min(
      MAX_INTERVALS,
      Math.floor(currentTime / INTERVAL_SECONDS),
    );
    if (intervals > previous.reportedIntervals) {
      previous.reportedIntervals = intervals;
      recordListen({ id: campaignId, playbackId: previous.playbackId, intervals });
    }
  }, [campaignId, currentTime, didJustFinish, isLoaded, isPlaying, recordListen]);
}
