// Procedural Web Audio API synthesizer for relaxing crochet-studio acoustic music & tactile SFX.
// Zero external URLs — works 100% offline in browser and Windows Electron builds.

class CrochetAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private isPlaying = false;
  private schedulerId: number | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private stepIndex = 0;
  private musicVolume = 0.45;
  private sfxEnabled = true;
  private warmthEnabled = true;

  // Warm Fmaj7 -> Dm9 -> Bbmaj7 -> C6 gentle acoustic waltz/arpeggio (Hz)
  private readonly chordProgression: number[][] = [
    [174.61, 220.0, 261.63, 329.63, 392.0, 440.0], // Fmaj9
    [146.83, 220.0, 261.63, 329.63, 349.23, 440.0], // Dm9
    [116.54, 174.61, 220.0, 293.66, 349.23, 440.0], // Bbmaj7
    [130.81, 196.0, 261.63, 329.63, 392.0, 440.0], // C6/9
  ];

  private readonly melodyPattern = [0, 2, 3, 5, 4, 2, 1, 3];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);

      // Soft warm acoustic delay
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.38;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.28;

      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1450;

      this.musicGain.connect(this.masterGain);
      this.musicGain.connect(this.delayNode);
      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      delayFilter.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setAmbientWarmth(enabled: boolean) {
    this.warmthEnabled = enabled;
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.setTargetAtTime(enabled && this.isPlaying ? 0.025 : 0.0001, this.ctx.currentTime, 0.3);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public startMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.isPlaying) return;
    this.isPlaying = true;

    this.startWarmRoomTexture();

    const triggerNextNote = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const measure = Math.floor(this.stepIndex / 8) % this.chordProgression.length;
      const beatInMeasure = this.stepIndex % 8;
      const chord = this.chordProgression[measure];

      // Bass warm felt note on beat 0 and beat 4
      if (beatInMeasure === 0 || beatInMeasure === 4) {
        const bassFreq = beatInMeasure === 0 ? chord[0] : chord[1];
        this.playFeltNote(bassFreq, now, 1.9, 0.14);
      }

      // Gentle nylon guitar / kalimba pluck
      const noteIdx = this.melodyPattern[beatInMeasure];
      const freq = chord[noteIdx] || chord[2];
      // Occasional delicate octave shimmer
      const shimmer = beatInMeasure === 3 && measure % 2 === 1 ? freq * 2 : freq;
      this.playPluckNote(shimmer, now, 1.35, 0.09);

      this.stepIndex += 1;
    };

    triggerNextNote();
    // 68 BPM eighth-note gentle pulse (~440ms)
    this.schedulerId = window.setInterval(triggerNextNote, 460);
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  }

  public toggleMusic(): boolean {
    if (this.isPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  private startWarmRoomTexture() {
    if (!this.ctx || !this.musicGain) return;
    if (this.noiseSource) {
      if (this.noiseGain) {
        this.noiseGain.gain.setTargetAtTime(this.warmthEnabled ? 0.025 : 0.0001, this.ctx.currentTime, 0.3);
      }
      return;
    }

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownish cozy fireplace/room warmth noise
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.2;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    const gain = this.ctx.createGain();
    gain.gain.value = this.warmthEnabled ? 0.025 : 0.0001;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start();

    this.noiseSource = src;
    this.noiseGain = gain;
  }

  private playPluckNote(freq: number, startTime: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(freq * 2, startTime);

    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.value = 0.22;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2100, startTime);
    filter.frequency.exponentialRampToValueAtTime(520, startTime + duration);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + 0.028);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(startTime);
    harmonic.start(startTime);
    osc.stop(startTime + duration + 0.05);
    harmonic.stop(startTime + duration + 0.05);
  }

  private playFeltNote(freq: number, startTime: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.value = 600;

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + 0.14);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // Tactile SFX: Leather clasp + wooden bead when opening the book
  public playBookOpen() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    // 1. Soft wooden yarn-button unlatch
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.22, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // 2. Ascending crochet lace harp shimmer
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((f, idx) => {
      const t = now + 0.12 + idx * 0.09;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(t);
      o.stop(t + 0.9);
    });
  }

  // Tactile SFX: Crisp parchment page turn
  public playPageFlip() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const duration = 0.28;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
    filter.frequency.exponentialRampToValueAtTime(750, now + duration);
    filter.Q.value = 1.4;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.24, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(now);
  }

  // Tactile SFX: Gentle wooden crochet hook click
  public playStitchClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.12, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const audioEngine = new CrochetAudioEngine();
