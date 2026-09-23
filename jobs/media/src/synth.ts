/**
 * Pure, dependency-free synthesis of the facade's fixture sounds. Everything
 * here is generated from maths: no recordings, no samples, no human voices.
 * ffmpeg only encodes the result (see generate.ts).
 */

export const SAMPLE_RATE = 48_000;

/** One sung note (or a rest when `freqHz` is 0). */
export interface VoiceNote {
  freqHz: number;
  durSec: number;
  /** Peak loudness of this note, 0 to 1. */
  gain: number;
}

export interface VoiceStyle {
  /** Vibrato speed in Hz (singers sit around 5 to 6.5 Hz). */
  vibratoRateHz: number;
  /** Vibrato depth as a fraction of the pitch (0.012 is roughly a fifth of a semitone). */
  vibratoDepth: number;
  /** Seconds after a note starts before vibrato has fully faded in. */
  vibratoDelaySec: number;
  /** Seconds taken to glide from one pitch to the next. */
  glideSec: number;
  /** Relative amplitudes of harmonics 1, 2, 3, ... (a soft, vowel-like tone). */
  harmonics: readonly number[];
}

/** Equal-tempered frequency of a MIDI note number (69 = A4 = 440 Hz). */
export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Frequency raised or lowered by a number of cents (hundredths of a semitone). */
export function detune(freqHz: number, cents: number): number {
  return freqHz * 2 ** (cents / 1200);
}

function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/**
 * Renders a legato "voice-like" line: a phase-continuous harmonic tone with
 * delayed vibrato, pitch glides between notes and soft attacks and releases.
 */
export function renderVoice(notes: readonly VoiceNote[], style: VoiceStyle): Float32Array {
  const totalSec = notes.reduce((sum, n) => sum + n.durSec, 0);
  const out = new Float32Array(Math.ceil(totalSec * SAMPLE_RATE));
  const harmonicNorm = style.harmonics.reduce((sum, a) => sum + a, 0);
  const attackSec = 0.09;
  const releaseSec = 0.14;

  let phase = 0;
  let pitch = notes.find((n) => n.freqHz > 0)?.freqHz ?? 0;
  let index = 0;
  let noteStart = 0;

  for (const note of notes) {
    const noteSamples = Math.round(note.durSec * SAMPLE_RATE);
    const startPitch = pitch;
    for (let i = 0; i < noteSamples && index < out.length; i++, index++) {
      const tInNote = i / SAMPLE_RATE;
      if (note.freqHz <= 0) {
        out[index] = 0;
        continue;
      }
      const glide = smoothstep(tInNote / style.glideSec);
      pitch = startPitch + (note.freqHz - startPitch) * glide;
      const vibratoAmount = smoothstep((tInNote - 0.15) / style.vibratoDelaySec);
      const vibrato =
        1 +
        style.vibratoDepth *
          vibratoAmount *
          Math.sin(2 * Math.PI * style.vibratoRateHz * ((noteStart + i) / SAMPLE_RATE));
      phase += (2 * Math.PI * pitch * vibrato) / SAMPLE_RATE;
      if (phase > 2 * Math.PI * 1_000) {
        phase -= 2 * Math.PI * 1_000;
      }

      let sample = 0;
      for (let h = 0; h < style.harmonics.length; h++) {
        sample += (style.harmonics[h] ?? 0) * Math.sin((h + 1) * phase);
      }
      const envelope =
        smoothstep(tInNote / attackSec) * smoothstep((note.durSec - tInNote) / releaseSec);
      out[index] = (note.gain * envelope * sample) / harmonicNorm;
    }
    noteStart += noteSamples;
  }
  return out;
}

/** One sustained chord of the backing track. */
export interface Chord {
  freqsHz: readonly number[];
  durSec: number;
  /** Seconds between soft re-attacks inside the chord (a gentle pulse). */
  pulseSec: number;
  gain: number;
}

/** Renders soft, organ-like sustained chords with a gentle pulse on each beat. */
export function renderChords(chords: readonly Chord[]): Float32Array {
  const totalSec = chords.reduce((sum, c) => sum + c.durSec, 0);
  const out = new Float32Array(Math.ceil(totalSec * SAMPLE_RATE));
  let index = 0;
  for (const chord of chords) {
    const chordSamples = Math.round(chord.durSec * SAMPLE_RATE);
    for (let i = 0; i < chordSamples && index < out.length; i++, index++) {
      const t = i / SAMPLE_RATE;
      if (chord.freqsHz.length === 0) {
        out[index] = 0;
        continue;
      }
      const tInPulse = t % chord.pulseSec;
      const pulse = 0.55 + 0.45 * Math.exp(-tInPulse * 2.2);
      const envelope = smoothstep(t / 0.05) * smoothstep((chord.durSec - t) / 0.25);
      let sample = 0;
      for (const f of chord.freqsHz) {
        const w = 2 * Math.PI * f * t;
        sample += Math.sin(w) + 0.3 * Math.sin(2 * w) + 0.12 * Math.sin(3 * w);
      }
      out[index] = (chord.gain * envelope * pulse * sample) / (chord.freqsHz.length * 1.42);
    }
  }
  return out;
}

/**
 * Gentle loudness swell over the whole take (a singer's natural dynamics),
 * applied in place: gain moves between `1 - depth` and 1 with the given period.
 */
export function applySwell(samples: Float32Array, periodSec: number, depth: number): Float32Array {
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const swell = 1 - depth * 0.5 * (1 + Math.cos((2 * Math.PI * t) / periodSec));
    samples[i] = (samples[i] ?? 0) * swell;
  }
  return samples;
}

/** Converts float samples in [-1, 1] to little-endian 16-bit PCM for ffmpeg's `s16le` input. */
export function toPcm16(samples: Float32Array): Buffer {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(clamped * 32_767), i * 2);
  }
  return buffer;
}
