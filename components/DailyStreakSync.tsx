import {
  ClaimStreakResponse,
  useClaimDailyStreak,
} from "@/api/user/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

const STORAGE_KEY = "@daily_streak:cache_v1";
const COOLDOWN_MS = 20 * 60 * 60 * 1000;

type CachedStreak = ClaimStreakResponse & { lastAttemptAt: number };

export function DailyStreakSync() {
  const qc = useQueryClient();
  const { mutate } = useClaimDailyStreak();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      let cached: CachedStreak | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) cached = JSON.parse(raw) as CachedStreak;
      } catch (err) {
        console.warn("DailyStreakSync: failed to read cache", err);
      }

      if (cached) {
        const { lastAttemptAt: _ignored, ...streak } = cached;
        qc.setQueryData<ClaimStreakResponse>(["streak"], streak);
      }

      const cooldownActive =
        cached && Date.now() - cached.lastAttemptAt < COOLDOWN_MS;
      if (cooldownActive) return;

      mutate(undefined, {
        onSuccess: async (data) => {
          const payload: CachedStreak = { ...data, lastAttemptAt: Date.now() };
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          } catch (err) {
            console.warn("DailyStreakSync: failed to write cache", err);
          }

          if (data.success && (data.pointsAwarded ?? 0) > 0) {
            Alert.alert(
              `🔥 Day ${data.currentStreak} streak!`,
              `You earned +${data.pointsAwarded} points.`,
            );
          }
        },
        onError: (err) => {
          console.warn("DailyStreakSync: claim failed", err?.message);
        },
      });
    })();
  }, [mutate, qc]);

  return null;
}
