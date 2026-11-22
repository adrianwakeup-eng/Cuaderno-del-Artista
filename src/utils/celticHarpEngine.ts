// Procedural Web Audio API Celtic Lever Harp (Clàrsach) synthesizer.
// Plays lush, authentic D-Dorian / D-Major Celtic airs with warm wooden harp
// resonance, multi-tap reverb, rolled chords, and real-time pluck callbacks.

export interface HarpPluckEvent {
  pitchNorm: number; // 0 (low bass string) .. 1 (high treble string)
  velocity: number; // 0..1
  isChord: boolean;
}

interface CelticNoteStep {
  beatOffset: number; // in eighth-note beats
  midi: number | number[]; // single note or rolled chord
  velocity: number;
  durationSec?: number;
}

// Authentic 6/8 Celtic Air & Highland Lullaby in D Major / D Dorian (32 eighth-note bar loop x 2 = 64 eighth notes)
// MIDI reference: D3=50, G3=55, A3=57, B3=59, C4=60, D4=62, E4=64, F#4=66, G4=67, A4=69, B4=71, C5=72, D5=74, E5=76, F#5=78, A5=81
const CELTIC_HARP_SCORE: CelticNoteStep[] = [
  // Phrase 1 (D5 / D major open fifth — warm, serene opening)
  { beatOffset: 0, midi: [50, 57, 62, 66], velocity: 0.75, durationSec: 2.8 },
  { beatOffset: 1, midi: 69, velocity: 0.62, durationSec: 1.9 },
  { beatOffset: 2, midi: 74, velocity: 0.72, durationSec: 2.3 },
  { beatOffset: 3, midi: [57, 62, 76], velocity: 0.7, durationSec: 2.5 },
  { beatOffset: 4.5, midi: 74, velocity: 0.56, durationSec: 1.6 },
  { beatOffset: 5, midi: 71, velocity: 0.6, durationSec: 1.9 },

  // Bar 2 (G major lush Celtic cadence)
  { beatOffset: 6, midi: [55, 62, 67, 71], velocity: 0.74, durationSec: 2.8 },
  { beatOffset: 7, midi: 74, velocity: 0.64, durationSec: 2.0 },
  { beatOffset: 8, midi: 76, velocity: 0.68, durationSec: 2.1 },
  { beatOffset: 9, midi: [55, 62, 78], velocity: 0.78, durationSec: 2.9 },
  { beatOffset: 10.5, midi: 76, velocity: 0.58, durationSec: 1.6 },
  { beatOffset: 11, midi: 74, velocity: 0.62, durationSec: 1.9 },

  // Bar 3 (Bm7 -> A suspended highland float)
  { beatOffset: 12, midi: [59, 66, 71, 74], velocity: 0.72, durationSec: 2.6 },
  { beatOffset: 13, midi: 69, velocity: 0.58, durationSec: 1.9 },
  { beatOffset: 14, midi: 71, velocity: 0.64, durationSec: 2.0 },
  { beatOffset: 15, midi: [57, 64, 69, 73], velocity: 0.72, durationSec: 2.6 },
  { beatOffset: 16.5, midi: 71, velocity: 0.56, durationSec: 1.7 },
  { beatOffset: 17, midi: 69, velocity: 0.6, durationSec: 2.0 },

  // Bar 4 (Gentle D major resolution with high harp shimmer)
  { beatOffset: 18, midi: [50, 57, 62, 66], velocity: 0.74, durationSec: 3.1 },
  { beatOffset: 19, midi: 69, velocity: 0.6, durationSec: 2.1 },
  { beatOffset: 20, midi: 74, velocity: 0.68, durationSec: 2.3 },
  { beatOffset: 21, midi: 78, velocity: 0.66, durationSec: 2.5 },
  { beatOffset: 22, midi: 81, velocity: 0.64, durationSec: 2.8 },
  { beatOffset: 23, midi: 74, velocity: 0.52, durationSec: 2.2 },

  // Phrase 2 (Modal Celtic Mixolydian C-major lift — classic Irish harp color!)
  { beatOffset: 24, midi: [48, 55, 60, 64], velocity: 0.74, durationSec: 2.8 },
  { beatOffset: 25, midi: 67, velocity: 0.62, durationSec: 2.0 },
  { beatOffset: 26, midi: 72, velocity: 0.7, durationSec: 2.3 },
  { beatOffset: 27, midi: [55, 62, 74], velocity: 0.76, durationSec: 2.7 },
  { beatOffset: 28.5, midi: 72, velocity: 0.58, durationSec: 1.7 },
  { beatOffset: 29, midi: 71, velocity: 0.62, durationSec: 2.0 },

  // Bar 6 (G/B -> Em7 flowing arpeggio)
  { beatOffset: 30, midi: [55, 62, 67, 71], velocity: 0.73, durationSec: 2.7 },
  { beatOffset: 31, midi: 74, velocity: 0.65, durationSec: 2.1 },
  { beatOffset: 32, midi: 71, velocity: 0.58, durationSec: 1.9 },
  { beatOffset: 33, midi: [52, 59, 64, 67], velocity: 0.7, durationSec: 2.6 },
  { beatOffset: 34, midi: 71, velocity: 0.62, durationSec: 2.0 },
  { beatOffset: 35, midi: 74, velocity: 0.66, durationSec: 2.2 },

  // Bar 7 (A7sus4 -> A7 delicate Celtic ornament)
  { beatOffset: 36, midi: [57, 64, 69, 74], velocity: 0.75, durationSec: 2.6 },
  { beatOffset: 37, midi: 76, velocity: 0.68, durationSec: 2.1 },
  { beatOffset: 38, midi: 74, velocity: 0.62, durationSec: 1.9 },
  { beatOffset: 39, midi: [57, 64, 73], velocity: 0.72, durationSec: 2.5 },
  { beatOffset: 40, midi: 71, velocity: 0.6, durationSec: 1.8 },
  { beatOffset: 41, midi: 69, velocity: 0.64, durationSec: 2.0 },

  // Bar 8 (Warm rolling D-major harp cadence leading smoothly back to Bar 1)
  { beatOffset: 42, midi: [50, 57, 62, 66, 69, 74], velocity: 0.82, durationSec: 3.6 },
  { beatOffset: 44, midi: 78, velocity: 0.66, durationSec: 2.5 },
  { beatOffset: 45, midi: 74, velocity: 0.6, durationSec: 2.4 },
  { beatOffset: 46.5, midi: 69, velocity: 0.52, durationSec: 2.2 },
];

const TOTAL_LOOP_BEATS = 48;
const EIGHTH_BEAT_SEC = 0.34; // ~88 BPM dotted-quarter Celtic air feel

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class CelticHarpMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private reverbInput: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private schedulerTimer: number | null = null;
  private loopStartTime = 0;
  private nextStepIdx = 0;
  private loopCount = 0;
  private onPluckCb: ((ev: HarpPluckEvent) => void) | null = null;
  private visualTimers: number[] = [];

  private ensureAudioGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.72;
      this.dryGain.connect(this.masterGain);

      // Warm forest-hall multi-tap feedback reverb tailored for Celtic harp
      this.reverbInput = this.ctx.createGain();
      this.reverbInput.gain.value = 0.42;

      const tapTimes = [0.11, 0.19, 0.31, 0.47];
      tapTimes.forEach((delaySec, idx) => {
        if (!this.ctx || !this.reverbInput || !this.masterGain) return;
        const delay = this.ctx.createDelay(1.0);
        delay.delayTime.value = delaySec;

        const damp = this.ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2800 - idx * 320;

        const fb = this.ctx.createGain();
        fb.gain.value = 0.34;

        const wetOut = this.ctx.createGain();
        wetOut.gain.value = 0.28 - idx * 0.035;

        this.reverbInput.connect(delay);
        delay.connect(damp);
        damp.connect(fb);
        fb.connect(delay);
        damp.connect(wetOut);
        wetOut.connect(this.masterGain);
      });
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private pluckString(midi: number, when: number, velocity: number, durationSec = 2.4) {
    if (!this.ctx || !this.dryGain || !this.reverbInput) return;
    const freq = midiToFreq(midi);

    // Warm wooden harp body lowpass envelope (bright pluck transient settling into mellow wood tone)
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(Math.min(5400, freq * 6.5), when);
    bodyFilter.frequency.exponentialRampToValueAtTime(
      Math.max(420, freq * 1.9),
      when + Math.min(0.65, durationSec * 0.45)
    );
    bodyFilter.Q.value = 1.15;

    const noteGain = this.ctx.createGain();
    const peak = 0.145 * velocity;
    noteGain.gain.setValueAtTime(0.0001, when);
    noteGain.gain.linearRampToValueAtTime(peak, when + 0.009);
    noteGain.gain.exponentialRampToValueAtTime(peak * 0.42, when + 0.24);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, when + durationSec);

    // Harmonic recipe of a real Celtic gut/nylon lever harp
    const partials: Array<{ ratio: number; type: OscillatorType; amp: number; detune?: number }> = [
      { ratio: 1, type: 'triangle', amp: 0.68 },
      { ratio: 1, type: 'sine', amp: 0.44, detune: 1.8 },
      { ratio: 2, type: 'sine', amp: 0.26 },
      { ratio: 3, type: 'sine', amp: 0.095 },
    ];

    partials.forEach((p) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq * p.ratio, when);
      if (p.detune) osc.detune.setValueAtTime(p.detune, when);
      g.gain.value = p.amp;
      osc.connect(g);
      g.connect(bodyFilter);
      osc.start(when);
      osc.stop(when + durationSec + 0.05);
    });

    // Subtle finger-on-string pluck attack click
    const pluckBufLen = Math.max(64, Math.floor(this.ctx.sampleRate * 0.018));
    const pluckBuf = this.ctx.createBuffer(1, pluckBufLen, this.ctx.sampleRate);
    const ch = pluckBuf.getChannelData(0);
    for (let i = 0; i < pluckBufLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * (1 - i / pluckBufLen);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = pluckBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(3600, freq * 2.4);
    bp.Q.value = 2.2;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.032 * velocity, when);
    nGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.018);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(bodyFilter);
    noise.start(when);

    bodyFilter.connect(noteGain);
    noteGain.connect(this.dryGain);
    noteGain.connect(this.reverbInput);
  }

  private scheduleAhead = () => {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const lookAheadSec = 0.24;

    while (this.isPlaying) {
      const step = CELTIC_HARP_SCORE[this.nextStepIdx];
      const stepTime =
        this.loopStartTime +
        (this.loopCount * TOTAL_LOOP_BEATS + step.beatOffset) * EIGHTH_BEAT_SEC;

      if (stepTime > now + lookAheadSec) break;

      const dur = step.durationSec ?? 2.3;
      const notes = Array.isArray(step.midi) ? step.midi : [step.midi];
      const isChord = notes.length > 1;

      // Subtle authentic Celtic harp rolled arpeggio on chords (28ms between strings)
      notes.forEach((midi, idx) => {
        const noteWhen = Math.max(now + 0.005, stepTime + idx * 0.032);
        const noteVel = step.velocity * (idx === notes.length - 1 ? 1 : 0.86);
        this.pluckString(midi, noteWhen, noteVel, dur);
      });

      // Notify visual harp animation in sync with the scheduled acoustic note
      const topMidi = notes[notes.length - 1];
      const pitchNorm = Math.max(0, Math.min(1, (topMidi - 48) / 34));
      const delayMs = Math.max(0, Math.round((stepTime - now) * 1000));
      const timerId = window.setTimeout(() => {
        if (this.isPlaying) {
          this.onPluckCb?.({ pitchNorm, velocity: step.velocity, isChord });
        }
      }, delayMs);
      this.visualTimers.push(timerId);
      if (this.visualTimers.length > 48) {
        this.visualTimers = this.visualTimers.slice(-36);
      }

      this.nextStepIdx += 1;
      if (this.nextStepIdx >= CELTIC_HARP_SCORE.length) {
        this.nextStepIdx = 0;
        this.loopCount += 1;
      }
    }
  };

  public start(onPluck?: (ev: HarpPluckEvent) => void, muted = false) {
    this.onPluckCb = onPluck ?? null;
    this.isMuted = muted;
    const ctx = this.ensureAudioGraph();
    if (!ctx || !this.masterGain) return;

    this.isPlaying = true;
    const now = ctx.currentTime;
    this.loopStartTime = now + 0.06;
    this.nextStepIdx = 0;
    this.loopCount = 0;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0.0001 : 0.78, now + 0.45);

    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
    }
    this.scheduleAhead();
    this.schedulerTimer = window.setInterval(this.scheduleAhead, 90);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.78, now, 0.08);
  }

  public stop() {
    this.isPlaying = false;
    this.onPluckCb = null;
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.visualTimers.forEach((id) => window.clearTimeout(id));
    this.visualTimers = [];

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    }
  }
}

export const celticHarpEngine = new CelticHarpMusicEngine();
