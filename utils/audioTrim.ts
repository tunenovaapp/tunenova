/**
 * React Native glue around the pure MP3 parser in utils/mp3.ts.
 *
 * Reads a picked audio file into memory, reports its exact duration, and writes
 * a losslessly-trimmed copy back to the cache directory. The trimmed result is
 * returned in the same shape `expo-document-picker` produces, so it can be
 * dropped straight into existing form state — none of the three upload paths
 * need to change.
 */

import { File, Paths } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";

import { Mp3ParseError, parseMp3, sliceMp3 } from "./mp3";

export { Mp3ParseError } from "./mp3";
export type { Mp3Index } from "./mp3";

/** Longest snippet an artist may upload. */
export const MAX_SNIPPET_MS = 30_000;

/** Largest file the backend accepts. */
export const MAX_SNIPPET_BYTES = 5 * 1024 * 1024;

export type TrimmedAsset = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
};

/**
 * Normalizes a picked file to something readable.
 *
 * Android hands back `content://` URIs that the filesystem APIs cannot open
 * directly, so those are copied into the cache first. Also guarantees the name
 * carries an audio extension.
 */
export async function prepareAudioFile(
  originalUri: string,
  originalName?: string | null,
): Promise<{ uri: string; name: string }> {
  let uri = originalUri;
  let name = (originalName || `audio-${Date.now()}.mp3`).trim();

  if (!/\.(mp3|m4a|wav|aac|ogg)$/i.test(name)) {
    name += ".mp3";
  }

  if (uri.startsWith("content://")) {
    const ext = name.split(".").pop() || "mp3";
    const dest = `${LegacyFileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
    await LegacyFileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  return { uri, name };
}

/** Reads a local audio file as raw bytes. */
export async function readAudioBytes(uri: string): Promise<Uint8Array> {
  const { uri: readableUri } = await prepareAudioFile(uri);
  return new File(readableUri).bytes();
}

/**
 * Exact duration of a local MP3, in milliseconds.
 * @throws {Mp3ParseError} when the file is not a parseable MP3.
 */
export async function getMp3DurationMs(uri: string): Promise<number> {
  const bytes = await readAudioBytes(uri);
  return parseMp3(bytes).totalDurationMs;
}

const stem = (name: string) => name.replace(/\.[^.]+$/, "") || "snippet";

/**
 * Writes [startMs, endMs) of `uri` to a new MP3 in the cache directory.
 *
 * Cuts snap to frame boundaries, so the result lands within ~26ms of the
 * requested range. No decoding or re-encoding happens, so there is no
 * generation loss.
 *
 * @throws {Mp3ParseError} when the source is not a parseable MP3 or the range
 * selects no audio.
 */
export async function trimMp3ToFile({
  uri,
  name,
  startMs,
  endMs,
}: {
  uri: string;
  name: string;
  startMs: number;
  endMs: number;
}): Promise<TrimmedAsset> {
  const bytes = await readAudioBytes(uri);
  const index = parseMp3(bytes);
  const trimmed = sliceMp3(bytes, index, startMs, endMs);

  const outputName = `trimmed-${stem(name)}-${Date.now()}.mp3`;
  const file = new File(Paths.cache, outputName);

  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(trimmed);

  return {
    uri: file.uri,
    name: `trimmed-${stem(name)}.mp3`,
    size: trimmed.length,
    mimeType: "audio/mpeg",
  };
}

/**
 * Human-readable reason a picked file cannot be used as-is, or null when it is
 * already acceptable. Used by every upload screen so the rules stay identical.
 */
export function describeSnippetProblem({
  sizeBytes,
  durationMs,
}: {
  sizeBytes?: number | null;
  durationMs?: number | null;
}): string | null {
  if (sizeBytes != null && sizeBytes > MAX_SNIPPET_BYTES) {
    return "Max file size is 5 MB";
  }
  if (durationMs != null && durationMs > MAX_SNIPPET_MS) {
    return `Snippets must be ${MAX_SNIPPET_MS / 1000} seconds or shorter. Trim your clip to continue.`;
  }
  return null;
}
