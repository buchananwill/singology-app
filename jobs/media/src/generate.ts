/**
 * Generates the facade's synthetic fixture media into apps/web/public/media
 * (spec decision 22). Run with `pnpm --filter @singology/media-jobs generate`.
 *
 * Every sound is synthesised in synth.ts; ffmpeg (on PATH) only encodes it.
 * No recordings and no human voices are involved.
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { MEDIA_DIR, probeDurationSec, runFfmpeg } from "./ffmpeg.ts";
import {
  applySwell,
  type Chord,
  detune,
  midiToHz,
  renderChords,
  renderVoice,
  SAMPLE_RATE,
  toPcm16,
  type VoiceNote,
  type VoiceStyle,
} from "./synth.ts";

/** A five-note scale up and down: do re mi fa sol fa mi re do. */
const FIVE_NOTE_SCALE = [0, 2, 4, 5, 7, 5, 4, 2, 0] as const;

/** The exercise is sung four times, a semitone higher each time, from C4. */
const PHRASE_ROOTS = [60, 61, 62, 63] as const;

interface TakeShape {
  noteSec: number;
  finalNoteSec: number;
  restSec: number;
  /** Intonation per scale step in cents (a student is rarely perfectly in tune). */
  centsByStep: readonly number[];
  /** Loudness per scale step, 0 to 1. */
  gainByStep: readonly number[];
}

function scaleTake(shape: TakeShape): VoiceNote[] {
  const notes: VoiceNote[] = [{ freqHz: 0, durSec: 1, gain: 0 }];
  for (const root of PHRASE_ROOTS) {
    FIVE_NOTE_SCALE.forEach((step, i) => {
      const isLast = i === FIVE_NOTE_SCALE.length - 1;
      notes.push({
        freqHz: detune(midiToHz(root + step), shape.centsByStep[i] ?? 0),
        durSec: isLast ? shape.finalNoteSec : shape.noteSec,
        gain: shape.gainByStep[i] ?? 0.7,
      });
    });
    notes.push({ freqHz: 0, durSec: shape.restSec, gain: 0 });
  }
  return notes;
}

const STUDENT_STYLE_A: VoiceStyle = {
  vibratoRateHz: 5.6,
  vibratoDepth: 0.012,
  vibratoDelaySec: 0.6,
  glideSec: 0.08,
  harmonics: [1, 0.55, 0.32, 0.2, 0.12, 0.07, 0.04],
};

/** Take B: slightly slower, wider vibrato, a softer tone and different tuning slips. */
const STUDENT_STYLE_B: VoiceStyle = {
  vibratoRateHz: 5.1,
  vibratoDepth: 0.016,
  vibratoDelaySec: 0.45,
  glideSec: 0.12,
  harmonics: [1, 0.45, 0.24, 0.14, 0.08, 0.04],
};

const COACH_STYLE: VoiceStyle = {
  vibratoRateHz: 5.9,
  vibratoDepth: 0.01,
  vibratoDelaySec: 0.5,
  glideSec: 0.06,
  harmonics: [1, 0.6, 0.4, 0.25, 0.15, 0.1, 0.06, 0.03],
};

function studentTakeA(): Float32Array {
  const voice = renderVoice(
    scaleTake({
      noteSec: 1.8,
      finalNoteSec: 3,
      restSec: 1.5,
      centsByStep: [0, 5, -12, -20, -8, -15, 4, 0, -6],
      gainByStep: [0.62, 0.66, 0.7, 0.74, 0.8, 0.74, 0.68, 0.64, 0.6],
    }),
    STUDENT_STYLE_A,
  );
  return applySwell(voice, 19, 0.18);
}

function studentTakeB(): Float32Array {
  const voice = renderVoice(
    scaleTake({
      noteSec: 1.75,
      finalNoteSec: 3.2,
      restSec: 1.4,
      centsByStep: [-4, 0, -5, -8, 3, -6, 0, 2, -2],
      gainByStep: [0.58, 0.64, 0.7, 0.76, 0.84, 0.76, 0.7, 0.62, 0.56],
    }),
    STUDENT_STYLE_B,
  );
  return applySwell(voice, 23, 0.12);
}

/** Backing track: I, V, I chords under each phrase of the exercise, one pulse per scale note. */
function backingTrack(): Float32Array {
  const noteSec = 1.8;
  const chords: Chord[] = [{ freqsHz: [], durSec: 1, pulseSec: 1, gain: 0 }];
  for (const root of PHRASE_ROOTS) {
    const tonic = [root - 12, root - 5, root, root + 4].map(midiToHz);
    const dominant = [root - 5, root - 1, root + 2, root + 7].map(midiToHz);
    chords.push({ freqsHz: tonic, durSec: noteSec * 4, pulseSec: noteSec, gain: 0.5 });
    chords.push({ freqsHz: dominant, durSec: noteSec * 4, pulseSec: noteSec, gain: 0.5 });
    chords.push({ freqsHz: tonic, durSec: 3 + 1.5, pulseSec: noteSec, gain: 0.45 });
  }
  return renderChords(chords);
}

/** Coach reply: a short demonstration phrase, a slow arpeggio 1-3-5-8-5-3-1 sung twice. */
function coachReply(): Float32Array {
  const arpeggio = [0, 4, 7, 12, 7, 4, 0];
  const notes: VoiceNote[] = [{ freqHz: 0, durSec: 0.6, gain: 0 }];
  for (const root of [57, 59]) {
    arpeggio.forEach((step, i) => {
      notes.push({
        freqHz: midiToHz(root + step),
        durSec: i === arpeggio.length - 1 ? 2.8 : 1.6,
        gain: 0.62 + 0.04 * Math.min(i, arpeggio.length - 1 - i),
      });
    });
    notes.push({ freqHz: 0, durSec: 1.2, gain: 0 });
  }
  return renderVoice(notes, COACH_STYLE);
}

/** Tone for the test-pattern video: a slow siren-like 1-5-8-5-1 line, about 30 s. */
function videoTone(): Float32Array {
  const steps = [0, 7, 12, 7, 0, 4, 7, 4, 0];
  const notes: VoiceNote[] = [{ freqHz: 0, durSec: 0.5, gain: 0 }];
  for (const root of [55, 57]) {
    steps.forEach((step, i) => {
      notes.push({ freqHz: midiToHz(root + step), durSec: 1.5, gain: 0.55 + 0.03 * (i % 3) });
    });
    notes.push({ freqHz: 0, durSec: 1, gain: 0 });
  }
  const tone = renderVoice(notes, STUDENT_STYLE_A);
  // Exactly 30 s: the line is 29.5 s long, so the tail is silence.
  const out = new Float32Array(30 * SAMPLE_RATE);
  out.set(tone.subarray(0, out.length));
  return out;
}

const PCM_INPUT = ["-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1"] as const;

async function writePcm(dir: string, name: string, samples: Float32Array): Promise<string> {
  const file = path.join(dir, `${name}.s16le`);
  await writeFile(file, toPcm16(samples));
  return file;
}

async function encodeAudio(pcmFile: string, outName: string): Promise<string> {
  const out = path.join(MEDIA_DIR, outName);
  await runFfmpeg([
    ...PCM_INPUT,
    "-i",
    pcmFile,
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    "-ar",
    String(SAMPLE_RATE),
    "-movflags",
    "+faststart",
    out,
  ]);
  return out;
}

/** 30 s, 1280x720, 30 fps test pattern with the tone as AAC audio; keyframe every 2 s for clean HLS cuts. */
async function encodeVideo(pcmFile: string, outName: string): Promise<string> {
  const out = path.join(MEDIA_DIR, outName);
  await runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=1280x720:rate=30:duration=30",
    ...PCM_INPUT,
    "-i",
    pcmFile,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "slow",
    "-crf",
    "30",
    "-g",
    "60",
    "-keyint_min",
    "60",
    "-sc_threshold",
    "0",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-ar",
    String(SAMPLE_RATE),
    "-shortest",
    "-movflags",
    "+faststart",
    out,
  ]);
  return out;
}

/** Repackages the video (no re-encode) as a VOD HLS rendition with fMP4 segments of about 6 s. */
async function packageHls(videoFile: string, outDir: string): Promise<string> {
  const dir = path.join(MEDIA_DIR, outDir);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const playlist = path.join(dir, "index.m3u8");
  // Run inside the output folder: ffmpeg writes the fMP4 init segment relative to its working directory.
  await runFfmpeg(
    [
      "-i",
      videoFile,
      "-c",
      "copy",
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_type",
      "fmp4",
      "-hls_fmp4_init_filename",
      "init.mp4",
      "-hls_segment_filename",
      "segment-%03d.m4s",
      "index.m3u8",
    ],
    { cwd: dir },
  );
  return playlist;
}

async function main(): Promise<void> {
  await mkdir(MEDIA_DIR, { recursive: true });
  const tmp = await mkdtemp(path.join(os.tmpdir(), "singology-media-"));
  try {
    const outputs: string[] = [];
    outputs.push(
      await encodeAudio(await writePcm(tmp, "take-a", studentTakeA()), "student-take-a.m4a"),
    );
    outputs.push(
      await encodeAudio(await writePcm(tmp, "take-b", studentTakeB()), "student-take-b.m4a"),
    );
    outputs.push(
      await encodeAudio(await writePcm(tmp, "backing", backingTrack()), "backing-track.m4a"),
    );
    outputs.push(await encodeAudio(await writePcm(tmp, "coach", coachReply()), "coach-reply.m4a"));
    const video = await encodeVideo(
      await writePcm(tmp, "video-tone", videoTone()),
      "test-pattern.mp4",
    );
    outputs.push(video);
    outputs.push(await packageHls(video, "test-pattern-hls"));

    for (const file of outputs) {
      const duration = await probeDurationSec(file);
      console.log(`${path.relative(MEDIA_DIR, file)}\t${duration.toFixed(3)} s`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

await main();
