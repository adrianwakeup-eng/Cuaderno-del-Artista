// Procedural Web Audio API synthesizer for tactile crochet-studio button & option SFX.
// Zero external URLs — works 100% offline in browser and Windows Electron builds.

class CrochetAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private sfxEnabled = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.72;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
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

  // Tactile SFX: Gentle wooden crochet hook click + tiny retro sparkle
  public playStitchClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.045);

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.13, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Retro + Crochet SFX: Cozy 8-bit wooden pop for opening toolbars, drawers & selecting tools
  public playRetroPop(pitchBoost = 0) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const base = 523.25 * Math.pow(1.06, pitchBoost); // C5 scaled

    [base, base * 1.25].forEach((freq, idx) => {
      const t = now + idx * 0.038;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1850;

      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.065, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.085);
    });
  }

  // Crochet Yarn Pluck: Soft plucked thread note for colors, brushes, stickers & symbols
  public playYarnPluck(seed = 0) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const pentatonic = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    const freq = pentatonic[Math.abs(seed) % pentatonic.length];

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.04, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(650, now + 0.16);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.14, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Retro Undo / Redo Chime
  public playUndoRedo(isRedo = false) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = isRedo ? [392.0, 587.33] : [587.33, 392.0];

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.11, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  // Retro Toggle Bell: Sweet on/off craft bell for layers & switches
  public playToggleChime(active = true) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = active ? [523.25, 783.99] : [659.25, 440.0];

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.1, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // Cozy Retro Save / New Page Arpeggio
  public playSaveChime() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.1, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  // Soft Felt Brush Eraser Whisper
  public playEraseBrush() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const duration = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.value = 1.1;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.14, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(now);
  }

  // Tactile SFX: Ornate wooden wardrobe latch + gentle hinge swing + golden crochet shimmer
  public playWardrobeDoor(opening = true) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    // 1. Warm brass latch & carved wood thud
    const latch = ctx.createOscillator();
    const latchEnv = ctx.createGain();
    latch.type = 'triangle';
    latch.frequency.setValueAtTime(opening ? 320 : 190, now);
    latch.frequency.exponentialRampToValueAtTime(opening ? 130 : 88, now + 0.09);
    latchEnv.gain.setValueAtTime(0.0001, now);
    latchEnv.gain.linearRampToValueAtTime(0.18, now + 0.012);
    latchEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    latch.connect(latchEnv);
    latchEnv.connect(this.sfxGain);
    latch.start(now);
    latch.stop(now + 0.14);

    // 2. Soft wooden door air-whoosh
    const dur = opening ? 0.34 : 0.24;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(opening ? 480 : 760, now + 0.04);
    filter.frequency.exponentialRampToValueAtTime(opening ? 980 : 380, now + dur);
    filter.Q.value = 2.0;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.0001, now + 0.03);
    nEnv.gain.linearRampToValueAtTime(0.13, now + 0.12);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(filter);
    filter.connect(nEnv);
    nEnv.connect(this.sfxGain);
    noise.start(now + 0.03);

    // 3. Delicate warm harp notes revealing the crochet collection (or settling shut)
    const notes = opening ? [392.0, 493.88, 587.33, 783.99] : [587.33, 392.0];
    notes.forEach((freq, idx) => {
      const t = now + (opening ? 0.1 + idx * 0.075 : 0.08 + idx * 0.06);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(opening ? 0.075 : 0.06, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(t);
      o.stop(t + 0.58);
    });
  }
}

export const audioEngine = new CrochetAudioEngine();
