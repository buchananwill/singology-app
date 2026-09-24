import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Where generated fixture media lives: served by the web app at `/media/...`. */
export const MEDIA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/public/media",
);

/** Largest stdout buffer we accept from ffmpeg/ffprobe (decoded PCM for a few minutes of mono audio). */
const MAX_BUFFER_BYTES = 256 * 1024 * 1024;

export interface RunFfmpegOptions {
  /** Working directory for ffmpeg; relative output names resolve against it. */
  cwd?: string;
}

/** Runs the `ffmpeg` on PATH, quiet except for errors, and returns its raw stdout (e.g. PCM on `pipe:1`). */
export async function runFfmpeg(
  args: readonly string[],
  options: RunFfmpegOptions = {},
): Promise<Buffer> {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { encoding: "buffer", maxBuffer: MAX_BUFFER_BYTES, cwd: options.cwd },
  );
  return stdout;
}

/** Measures a media file's container duration in seconds with `ffprobe`. */
export async function probeDurationSec(file: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`ffprobe returned no usable duration for ${file}: "${stdout.trim()}"`);
  }
  return duration;
}
