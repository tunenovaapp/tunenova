/** Formats a duration in seconds as `m:ss`. */
export function formatTime(seconds?: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/** Formats a duration in milliseconds as `m:ss`. */
export function formatMs(ms?: number) {
  return formatTime((ms ?? 0) / 1000);
}
