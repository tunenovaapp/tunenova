import { useEffect, useState } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  label: string;
}

export function useCountdown(
  targetDate: string | null,
  intervalMs = 60_000,
): CountdownResult {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [targetDate, intervalMs]);

  if (!targetDate)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, label: "" };

  const diff = new Date(targetDate).getTime() - now;
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, label: "Ended" };

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  let label = "";
  if (days > 0) label = `${days}d ${hours}h left`;
  else if (hours > 0) label = `${hours}h ${minutes}m left`;
  else label = `${minutes}m left`;

  return { days, hours, minutes, seconds, isExpired: false, label };
}
