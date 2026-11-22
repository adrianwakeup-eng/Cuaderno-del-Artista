// Reliable native HTMLAudioElement playback for the user's uploaded MP3 soundtrack,
// paired with track-time-synchronized musical phrasing for the fairy's harp hands,
// airborne feet, harp shimmer, and golden fairy dust bursts.
//
// IMPORTANT: Does NOT use `crossOrigin = 'anonymous'` or `createMediaElementSource`,
// because proxied static audio streams without Access-Control-Allow-Origin headers
// get silently zeroed by Web Audio MediaElementAudioSourceNode per spec.

export const FAIRY_MUSIC_TRACK_URL =
  '/assets/aistudio/THE_MOST_BEAUTIFUL_FUSION___Flamenco__Accordion___Violin_in_Music_That_Touches_the_Soul_MP3_320K__ee7e4e41.mp3';

export interface MusicReactiveSample {
  playing: boolean;
  energy: number; // 0..1 overall musical intensity
  bass: number; // 0..1 rhythmic low-end groove
  melody: number; // 0..1 flamenco guitar / accordion / violin melody flow
  treble: number; // 0..1 bright string pluck sparkle
  pitchNorm: number; // 0..1 active melodic register (drives vertical hand position on harp)
  onsetStrength: number; // 0..1 transient peak on musical accents
  isChordAccent: boolean;
  trackTimeSec: number;
}

class FairyMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private isMuted = false;
  private targetVolume = 0.85;
  private fadeTimer: number | null = null;
  private lastOnsetTs = 0;
  private prevMelody = 0;

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const el = new Audio();
      el.src = FAIRY_MUSIC_TRACK_URL;
      el.loop = true;
      // Use 'metadata' so large 320kbps MP3s begin streaming immediately via HTTP 206 Range requests
      el.preload = 'metadata';
      el.volume = this.isMuted ? 0 : this.targetVolume;
      el.muted = this.isMuted;

      // If play() was initiated while metadata/chunks were still buffering, ensure playback resumes
      el.addEventListener('canplay', () => {
        if (this.isPlaying && el.paused) {
          void el.play().catch(() => {});
        }
      });

      this.audio = el;
    }
    return this.audio;
  }

  private clearFade() {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private fadeVolumeTo(target: number, durationMs: number, onDone?: () => void) {
    this.clearFade();
    const el = this.audio;
    if (!el) {
      onDone?.();
      return;
    }
    const clampedTarget = Math.max(0, Math.min(1, target));
    const startVol = el.volume;
    const steps = Math.max(1, Math.round(durationMs / 25));
    let step = 0;

    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const p = Math.min(1, step / steps);
      const eased = p * (2 - p);
      el.volume = Math.max(0, Math.min(1, startVol + (clampedTarget - startVol) * eased));
      if (p >= 1) {
        this.clearFade();
        onDone?.();
      }
    }, 25);
  }

  /**
   * Starts playing the uploaded MP3 track. Call directly inside user click handlers
   * whenever possible so browser autoplay policies always permit immediate audio output.
   */
  public start(muted = false) {
    this.isMuted = muted;
    this.isPlaying = true;
    const el = this.ensureAudio();
    this.clearFade();

    el.muted = muted;
    el.volume = muted ? 0 : Math.max(0.18, el.volume);

    if (el.paused) {
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Will retry automatically on 'canplay' or next user interaction if blocked
        });
      }
    }

    if (!muted) {
      this.fadeVolumeTo(this.targetVolume, 420);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.audio) return;
    this.audio.muted = muted;
    if (this.isPlaying) {
      if (!muted && this.audio.paused) {
        void this.audio.play().catch(() => {});
      }
      this.fadeVolumeTo(muted ? 0 : this.targetVolume, 180);
    }
  }

  public stop() {
    this.isPlaying = false;
    const el = this.audio;
    if (!el) return;

    this.fadeVolumeTo(0, 220, () => {
      if (!this.isPlaying && this.audio) {
        this.audio.pause();
      }
    });
    this.prevMelody = 0;
  }

  /**
   * Produces organic, flamenco/accordion/violin-inspired musical modulation
   * locked to the real `audio.currentTime` of the uploaded MP3 track.
   */
  public sampleFrame(nowSec: number): MusicReactiveSample {
    const el = this.audio;
    const trackTimeSec = el && el.currentTime > 0 ? el.currentTime : nowSec;

    if (!this.isPlaying) {
      return {
        playing: false,
        energy: 0,
        bass: 0,
        melody: 0,
        treble: 0,
        pitchNorm: 0.5,
        onsetStrength: 0,
        isChordAccent: false,
        trackTimeSec,
      };
    }

    const t = trackTimeSec;
    // Expressive musical phrases (~106 BPM flamenco-fusion cadence + violin rubato swells)
    const phraseSwell = 0.52 + 0.48 * Math.sin(t * 0.42 - 0.6);
    const beatPulse = Math.pow(Math.max(0, Math.sin(t * Math.PI * 3.55)), 1.8);
    const strumWave = 0.5 + 0.5 * Math.sin(t * 6.8 + Math.sin(t * 1.65) * 1.4);
    const flourish = Math.pow(Math.max(0, Math.sin(t * 10.6 + Math.cos(t * 2.3))), 2.2);

    const bass = Math.min(1, 0.2 + beatPulse * (0.45 + phraseSwell * 0.25));
    const melody = Math.min(1, 0.26 + strumWave * (0.42 + phraseSwell * 0.28));
    const treble = Math.min(1, 0.18 + flourish * (0.5 + phraseSwell * 0.25));
    const energy = bass * 0.32 + melody * 0.46 + treble * 0.22;
    const pitchNorm = Math.max(
      0.08,
      Math.min(0.92, 0.5 + 0.32 * Math.sin(t * 1.85 + Math.sin(t * 0.65)) + 0.1 * Math.cos(t * 4.3))
    );

    const melodyRise = melody - this.prevMelody;
    this.prevMelody = this.prevMelody * 0.72 + melody * 0.28;

    let onsetStrength = 0;
    let isChordAccent = false;
    const sinceLast = nowSec - this.lastOnsetTs;

    if (
      sinceLast > 0.18 &&
      (melodyRise > 0.042 || (beatPulse > 0.78 && sinceLast > 0.34) || flourish > 0.82)
    ) {
      this.lastOnsetTs = nowSec;
      onsetStrength = Math.max(0.48, Math.min(1.2, energy * 1.25 + Math.max(0, melodyRise) * 3.8));
      isChordAccent = beatPulse > 0.72 || phraseSwell > 0.84;
    }

    return {
      playing: true,
      energy,
      bass,
      melody,
      treble,
      pitchNorm,
      onsetStrength,
      isChordAccent,
      trackTimeSec,
    };
  }
}

export const fairyMusicPlayer = new FairyMusicPlayer();
