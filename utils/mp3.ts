/**
 * Minimal MPEG-1/2/2.5 Layer III (MP3) frame parser and lossless slicer.
 *
 * An MP3 is a flat sequence of independently-decodable frames, so a clip can be
 * produced by concatenating the frames that fall inside a time range — no
 * decoding and no re-encoding, which means no quality loss and no native
 * dependency. Cuts snap to frame boundaries (~26ms at 44.1kHz).
 *
 * Pure functions only: no React Native imports, so this is unit-testable and
 * runs anywhere. Platform glue lives in utils/audioTrim.ts.
 */

export type Mp3Frame = {
  /** Byte offset of the frame header within the source buffer. */
  offset: number;
  /** Total frame length in bytes, including the 4-byte header. */
  size: number;
  /** Playback duration contributed by this frame. */
  durationMs: number;
};

export type Mp3Index = {
  /** Audio frames only — a leading Xing/Info/VBRI metadata frame is excluded. */
  frames: Mp3Frame[];
  totalDurationMs: number;
  sampleRate: number;
  /** True when a Xing/VBRI header was present (variable bitrate). */
  isVbr: boolean;
};

export class Mp3ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Mp3ParseError";
  }
}

const MPEG_V25 = 0;
const MPEG_RESERVED = 1;
const MPEG_V2 = 2;
const MPEG_V1 = 3;

const LAYER_III = 1;

// Layer III bitrates in kbps, indexed by the header's 4-bit bitrate index.
// Index 0 is "free" and 15 is "bad"; both are rejected.
const BITRATES_V1_L3 = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1,
];
const BITRATES_V2_L3 = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1,
];

const SAMPLE_RATES: Record<number, number[]> = {
  [MPEG_V1]: [44100, 48000, 32000, -1],
  [MPEG_V2]: [22050, 24000, 16000, -1],
  [MPEG_V25]: [11025, 12000, 8000, -1],
};

// Layer III emits 1152 samples per frame on MPEG-1 and 576 on MPEG-2/2.5.
const SAMPLES_PER_FRAME_V1 = 1152;
const SAMPLES_PER_FRAME_V2 = 576;

type FrameHeader = {
  size: number;
  durationMs: number;
  sampleRate: number;
  /** Bytes of side information between the header and any Xing magic. */
  sideInfoSize: number;
};

/**
 * Decodes the 4-byte frame header at `offset`.
 * Returns null when the bytes are not a valid Layer III header, which is the
 * signal for the scanner to resync one byte forward.
 */
function decodeHeader(bytes: Uint8Array, offset: number): FrameHeader | null {
  if (offset + 4 > bytes.length) return null;

  const b0 = bytes[offset];
  const b1 = bytes[offset + 1];
  const b2 = bytes[offset + 2];
  const b3 = bytes[offset + 3];

  // 11-bit frame sync.
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null;

  const version = (b1 >> 3) & 0x03;
  if (version === MPEG_RESERVED) return null;

  const layer = (b1 >> 1) & 0x03;
  if (layer !== LAYER_III) return null;

  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;

  if (bitrateIndex === 0 || bitrateIndex === 0x0f) return null;
  if (sampleRateIndex === 3) return null;

  const isV1 = version === MPEG_V1;
  const bitrateKbps = isV1
    ? BITRATES_V1_L3[bitrateIndex]
    : BITRATES_V2_L3[bitrateIndex];
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];

  if (bitrateKbps <= 0 || sampleRate <= 0) return null;

  const bitrate = bitrateKbps * 1000;
  const samplesPerFrame = isV1 ? SAMPLES_PER_FRAME_V1 : SAMPLES_PER_FRAME_V2;

  // Layer III frame length: 144 bytes/frame on MPEG-1, 72 on MPEG-2/2.5.
  const coefficient = isV1 ? 144 : 72;
  const size = Math.floor((coefficient * bitrate) / sampleRate) + padding;
  if (size <= 4) return null;

  const isMono = ((b3 >> 6) & 0x03) === 0x03;
  const sideInfoSize = isV1 ? (isMono ? 17 : 32) : isMono ? 9 : 17;

  return {
    size,
    durationMs: (samplesPerFrame / sampleRate) * 1000,
    sampleRate,
    sideInfoSize,
  };
}

/** Total bytes occupied by a leading ID3v2 tag, or 0 when absent. */
function id3v2Length(bytes: Uint8Array): number {
  if (bytes.length < 10) return 0;
  // "ID3"
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;

  // Syncsafe integer: 7 usable bits per byte.
  const size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);

  const hasFooter = (bytes[5] & 0x10) !== 0;
  return 10 + size + (hasFooter ? 10 : 0);
}

/** End offset of audio data, excluding a trailing 128-byte ID3v1 tag. */
function audioEnd(bytes: Uint8Array): number {
  if (bytes.length < 128) return bytes.length;
  const start = bytes.length - 128;
  // "TAG"
  if (
    bytes[start] === 0x54 &&
    bytes[start + 1] === 0x41 &&
    bytes[start + 2] === 0x47
  ) {
    return start;
  }
  return bytes.length;
}

function matchesAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset + text.length > bytes.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * A file's first frame is often a Xing/Info/VBRI header carrying VBR metadata
 * rather than audio. It must not be counted as playable duration, and must not
 * be copied into a trimmed file (it describes the *original* length).
 */
function isMetadataFrame(
  bytes: Uint8Array,
  offset: number,
  header: FrameHeader,
): boolean {
  const xingAt = offset + 4 + header.sideInfoSize;
  if (matchesAscii(bytes, xingAt, "Xing")) return true;
  if (matchesAscii(bytes, xingAt, "Info")) return true;
  // VBRI always sits 32 bytes past the header, regardless of side info size.
  if (matchesAscii(bytes, offset + 4 + 32, "VBRI")) return true;
  return false;
}

/**
 * Builds a frame index for an MP3 buffer.
 * @throws {Mp3ParseError} when no valid Layer III frames are found.
 */
export function parseMp3(bytes: Uint8Array): Mp3Index {
  const end = audioEnd(bytes);
  let offset = id3v2Length(bytes);

  const frames: Mp3Frame[] = [];
  let totalDurationMs = 0;
  let sampleRate = 0;
  let isVbr = false;
  let sawFirstFrame = false;

  while (offset + 4 <= end) {
    const header = decodeHeader(bytes, offset);

    if (!header) {
      // Junk between frames is common in real files — resync rather than abort.
      offset += 1;
      continue;
    }

    // A truncated final frame is not playable; stop cleanly.
    if (offset + header.size > end) break;

    if (!sawFirstFrame) {
      sawFirstFrame = true;
      sampleRate = header.sampleRate;

      if (isMetadataFrame(bytes, offset, header)) {
        isVbr = true;
        offset += header.size;
        continue;
      }
    }

    frames.push({
      offset,
      size: header.size,
      durationMs: header.durationMs,
    });
    totalDurationMs += header.durationMs;
    offset += header.size;
  }

  if (frames.length === 0) {
    throw new Mp3ParseError(
      "No MP3 audio frames found. The file may be corrupt or not an MP3.",
    );
  }

  return { frames, totalDurationMs, sampleRate, isVbr };
}

/**
 * Index of the first frame at or after `ms`, clamped to the frame list.
 */
function frameIndexAtMs(index: Mp3Index, ms: number): number {
  if (ms <= 0) return 0;

  let elapsed = 0;
  for (let i = 0; i < index.frames.length; i += 1) {
    if (elapsed >= ms) return i;
    elapsed += index.frames[i].durationMs;
  }
  return index.frames.length;
}

/**
 * Extracts [startMs, endMs) as a standalone MP3 buffer.
 *
 * Emits audio frames only — no ID3 tag and no Xing header. Copying the source
 * Xing header would make players report the original file's duration.
 *
 * @throws {Mp3ParseError} when the range selects no frames.
 */
export function sliceMp3(
  bytes: Uint8Array,
  index: Mp3Index,
  startMs: number,
  endMs: number,
): Uint8Array {
  if (endMs <= startMs) {
    throw new Mp3ParseError("Trim end must be after trim start.");
  }

  const startFrame = frameIndexAtMs(index, startMs);
  const endFrame = Math.max(startFrame + 1, frameIndexAtMs(index, endMs));
  const selected = index.frames.slice(startFrame, endFrame);

  if (selected.length === 0) {
    throw new Mp3ParseError("Selected range contains no audio.");
  }

  let total = 0;
  for (const frame of selected) total += frame.size;

  const out = new Uint8Array(total);
  let written = 0;
  for (const frame of selected) {
    out.set(bytes.subarray(frame.offset, frame.offset + frame.size), written);
    written += frame.size;
  }

  return out;
}

/** Exact duration of the frames a slice would select, for UI readouts. */
export function sliceDurationMs(
  index: Mp3Index,
  startMs: number,
  endMs: number,
): number {
  const startFrame = frameIndexAtMs(index, startMs);
  const endFrame = Math.max(startFrame + 1, frameIndexAtMs(index, endMs));

  let total = 0;
  for (let i = startFrame; i < endFrame && i < index.frames.length; i += 1) {
    total += index.frames[i].durationMs;
  }
  return total;
}
