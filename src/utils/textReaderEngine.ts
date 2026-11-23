/**
 * Natural Neutral Masculine Spanish Text-to-Speech Reader Engine.
 * - Strictly selects an unmistakable, calm, neutral adult MALE Spanish voice
 *   (prioritizing Studio/Neural male voices like Alonso, Jorge, Juan, Diego, Carlos,
 *   Álvaro, Pablo, then macOS adult baritone Reed / Rocko, while explicitly avoiding
 *   female voices including Chrome's "Google español", Mónica, Paulina, etc.).
 * - Waits for browser voices to finish loading before speaking so it NEVER falls back
 *   to the OS/browser default female voice on first click.
 * - Uses sentence-chunked playback with word-level offset tracking so Play, Pause,
 *   Resume, Restart, voice switching, and interactive Time-Bar Scrubbing work reliably.
 */

export type ReaderStatus = 'idle' | 'playing' | 'paused' | 'ended';

export interface VoiceOption {
  voiceURI: string;
  label: string;
  lang: string;
  isMale: boolean;
}

export interface TextReaderState {
  active: boolean;
  status: ReaderStatus;
  elementId: string | null;
  text: string;
  excerpt: string;
  currentTime: number;
  duration: number;
  progress: number;
  charIndex: number;
  voiceName: string;
  voiceURI: string;
  availableVoices: VoiceOption[];
  rate: number;
  supported: boolean;
}

type Listener = (state: TextReaderState) => void;

/** Tier 1: Natural / Studio / Neural adult male Spanish voices */
const NATURAL_MALE_VOICE_NAMES = [
  'alonso',
  'jorge',
  'juan',
  'carlos',
  'diego',
  'pablo',
  'raul',
  'raúl',
  'emilio',
  'tomas',
  'tomás',
  'andres',
  'andrés',
  'alvaro',
  'álvaro',
  'enrique',
  'dario',
  'darío',
  'rodrigo',
  'mateo',
  'santiago',
  'sebastian',
  'sebastián',
  'martin',
  'martín',
  'gerardo',
  'ramon',
  'ramón',
  'gonzalo',
  'nicolas',
  'nicolás',
  'sergio',
  'miguel',
  'antonio',
  'fernando',
  'hector',
  'héctor',
  'javier',
  'luis',
  'pedro',
  'alejandro',
  'eduardo',
  'ricardo',
  'gabriel',
  'male',
  'hombre',
  'masculin',
];

/** Tier 2: macOS built-in adult male Spanish voices (ordered by masculinity & warmth) */
const BUILTIN_MALE_BARITONE = ['reed'];
const BUILTIN_MALE_ALT = ['rocko'];
const BUILTIN_MALE_LIGHT = ['eddy'];

/** Explicitly known FEMALE Spanish voices (including Chrome's built-in Google español!) */
const FEMALE_VOICE_NAMES = [
  'google español',
  'google espanol',
  'google spanish',
  'monica',
  'mónica',
  'paulina',
  'elena',
  'helena',
  'laura',
  'lucia',
  'lucía',
  'sofia',
  'sofía',
  'sabina',
  'dalia',
  'paloma',
  'salome',
  'salomé',
  'catalina',
  'marisol',
  'jimena',
  'andrea',
  'camila',
  'valeria',
  'valentina',
  'ximena',
  'isabella',
  'conchita',
  'penelope',
  'mia',
  'carmen',
  'angelica',
  'angélica',
  'francisca',
  'soledad',
  'elvia',
  'esperanza',
  'elvira',
  'estrella',
  'triana',
  'vera',
  'abril',
  'irene',
  'lia',
  'lía',
  'flo',
  'sandy',
  'shelley',
  'grandma',
  'female',
  'mujer',
  'femenin',
];

const NOVELTY_VOICE_NAMES = [
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'good news',
  'jester',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'junior',
  'grandpa',
];

type VoiceTier = 'natural-male' | 'baritone-male' | 'alt-male' | 'light-male' | 'other';

function classifySpanishVoice(voice: SpeechSynthesisVoice): {
  score: number;
  isSpanish: boolean;
  isMale: boolean;
  tier: VoiceTier;
} {
  const name = voice.name.toLowerCase();
  const lang = (voice.lang || '').toLowerCase().replace('_', '-');
  const isSpanish = lang === 'es' || lang.startsWith('es-');

  if (!isSpanish) {
    return { score: -1000, isSpanish: false, isMale: false, tier: 'other' };
  }

  let score = 0;

  // Neutral Spanish locale preference (MX / 419 / US / CO slightly ahead of ES)
  if (lang === 'es-mx' || lang === 'es-419' || lang === 'es-us' || lang === 'es-co') {
    score += 120;
  } else {
    score += 110;
  }

  // Strongly penalize novelty / robotic / elderly voices
  if (NOVELTY_VOICE_NAMES.some((n) => name.includes(n))) {
    return { score: -500, isSpanish: true, isMale: false, tier: 'other' };
  }

  const isFemale = FEMALE_VOICE_NAMES.some((f) => name.includes(f));
  if (isFemale) {
    return { score: -250 + score, isSpanish: true, isMale: false, tier: 'other' };
  }

  const isNaturalMale = NATURAL_MALE_VOICE_NAMES.some((m) => name.includes(m));
  const isBaritone = BUILTIN_MALE_BARITONE.some((m) => name.includes(m));
  const isAltMale = BUILTIN_MALE_ALT.some((m) => name.includes(m));
  const isLightMale = BUILTIN_MALE_LIGHT.some((m) => name.includes(m));

  let tier: VoiceTier = 'other';
  let isMale = false;

  if (isNaturalMale) {
    tier = 'natural-male';
    isMale = true;
    score += 300;
    if (
      name.includes('natural') ||
      name.includes('neural') ||
      name.includes('premium') ||
      name.includes('enhanced') ||
      name.includes('online')
    ) {
      score += 60;
    }
    if (
      name.includes('alonso') ||
      name.includes('jorge') ||
      name.includes('juan') ||
      name.includes('diego') ||
      name.includes('carlos') ||
      name.includes('alvaro') ||
      name.includes('álvaro')
    ) {
      score += 25;
    }
  } else if (isBaritone) {
    // macOS Reed: deep, clear, unmistakable adult male voice!
    tier = 'baritone-male';
    isMale = true;
    score += 210;
  } else if (isAltMale) {
    // macOS Rocko: adult male voice
    tier = 'alt-male';
    isMale = true;
    score += 165;
  } else if (isLightMale) {
    // macOS Eddy: lighter male voice, kept strictly below Reed and Rocko
    tier = 'light-male';
    isMale = true;
    score += 110;
  }

  return { score, isSpanish: true, isMale, tier };
}

function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  const clean = voice.name
    .replace(/Microsoft\s+/i, '')
    .replace(/\s+Online\s*\(Natural\)/i, '')
    .replace(/\s*\(Enhanced\)|\s*\(Premium\)/i, '')
    .replace(/Spanish \(Mexico\)/i, 'Español MX')
    .replace(/Spanish \(Spain\)/i, 'Español ES')
    .replace(/Spanish \(United States\)/i, 'Español US')
    .trim();
  return clean || 'Voz masculina';
}

function getPreferredPitchForTier(tier: VoiceTier): number {
  switch (tier) {
    case 'natural-male':
      return 0.9;
    case 'baritone-male':
      // Reed sounds unmistakably warm, deep & neutral masculine at 0.82
      return 0.82;
    case 'alt-male':
      return 0.8;
    case 'light-male':
      // Lower pitch so Eddy also sounds clearly adult male
      return 0.72;
    default:
      // Worst-case fallback if OS has zero male voices: deepen clearly
      return 0.6;
  }
}

export function pickNeutralMaleSpanishVoice(preferredURI?: string): {
  voice: SpeechSynthesisVoice | null;
  tier: VoiceTier;
  options: VoiceOption[];
} {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, tier: 'other', options: [] };
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { voice: null, tier: 'other', options: [] };

  const ranked = voices
    .map((v) => ({ voice: v, ...classifySpanishVoice(v) }))
    .filter((item) => item.isSpanish && item.score > -400)
    .sort((a, b) => b.score - a.score);

  // Only list male voices in the quick switcher when male voices exist
  const maleOnly = ranked.filter((item) => item.isMale);
  const selectable = maleOnly.length > 0 ? maleOnly : ranked;

  const options: VoiceOption[] = selectable.map((item) => ({
    voiceURI: item.voice.voiceURI,
    label: formatVoiceLabel(item.voice),
    lang: item.voice.lang,
    isMale: item.isMale,
  }));

  if (preferredURI) {
    const manual = selectable.find((item) => item.voice.voiceURI === preferredURI);
    if (manual) {
      return { voice: manual.voice, tier: manual.tier, options };
    }
  }

  const best = selectable[0] || null;
  return {
    voice: best ? best.voice : null,
    tier: best ? best.tier : 'other',
    options,
  };
}

interface TextChunk {
  start: number;
  end: number;
  text: string;
}

/**
 * Splits text into clean, natural chunks (<= 210 chars) on sentence/clause/word
 * boundaries while preserving exact global character offsets.
 */
function buildReadingChunks(fullText: string, startChar: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  const len = fullText.length;
  let pos = Math.max(0, Math.min(len, startChar));

  while (pos < len && /\s/.test(fullText[pos])) pos++;

  const MAX_CHUNK = 210;
  while (pos < len) {
    const remaining = len - pos;
    if (remaining <= MAX_CHUNK) {
      const slice = fullText.slice(pos).trimEnd();
      if (slice.trim().length > 0) {
        chunks.push({ start: pos, end: len, text: slice });
      }
      break;
    }

    const windowEnd = pos + MAX_CHUNK;
    const windowStr = fullText.slice(pos, windowEnd);

    let cut = -1;
    const sentenceMatches = [...windowStr.matchAll(/[.!?\n]+(?:\s+|$)/g)];
    if (sentenceMatches.length > 0) {
      const last = sentenceMatches[sentenceMatches.length - 1];
      if ((last.index ?? 0) >= 35) {
        cut = (last.index ?? 0) + last[0].length;
      }
    }
    if (cut === -1) {
      const clauseMatches = [...windowStr.matchAll(/[,;:]\s+/g)];
      if (clauseMatches.length > 0) {
        const last = clauseMatches[clauseMatches.length - 1];
        if ((last.index ?? 0) >= 45) {
          cut = (last.index ?? 0) + last[0].length;
        }
      }
    }
    if (cut === -1) {
      const lastSpace = windowStr.lastIndexOf(' ');
      cut = lastSpace > 20 ? lastSpace + 1 : MAX_CHUNK;
    }

    const rawSlice = fullText.slice(pos, pos + cut);
    if (rawSlice.trim().length > 0) {
      chunks.push({ start: pos, end: pos + cut, text: rawSlice.trimEnd() });
    }
    pos += cut;
    while (pos < len && /\s/.test(fullText[pos])) pos++;
  }

  return chunks;
}

function snapToWordStart(text: string, approxIndex: number): number {
  const clamped = Math.max(0, Math.min(text.length, Math.round(approxIndex)));
  if (clamped === 0 || clamped >= text.length) return clamped;
  if (/\s/.test(text[clamped - 1])) return clamped;
  let i = clamped;
  while (i > 0 && !/\s/.test(text[i - 1])) {
    i--;
  }
  return i;
}

function estimateDurationSec(text: string, rate: number): number {
  const clean = text.trim();
  if (!clean) return 0;
  const charsPerSec = 14.0 * Math.max(0.5, rate);
  return Math.max(1.5, clean.length / charsPerSec);
}

function makeExcerpt(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 44) return clean;
  return `${clean.slice(0, 42)}…`;
}

class TextReaderEngine {
  private listeners = new Set<Listener>();
  private state: TextReaderState;
  private playbackToken = 0;
  private timerId: number | null = null;
  private lastTickAt = 0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private selectedVoiceTier: VoiceTier = 'other';
  private preferredVoiceURI: string | undefined = undefined;

  constructor() {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    this.state = {
      active: false,
      status: 'idle',
      elementId: null,
      text: '',
      excerpt: '',
      currentTime: 0,
      duration: 0,
      progress: 0,
      charIndex: 0,
      voiceName: 'Voz masculina',
      voiceURI: '',
      availableVoices: [],
      rate: 1.0,
      supported,
    };

    if (supported) {
      this.refreshVoice();
      try {
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
          this.refreshVoice();
        });
      } catch {
        // ignore
      }
    }
  }

  private refreshVoice(): void {
    const picked = pickNeutralMaleSpanishVoice(this.preferredVoiceURI);
    this.selectedVoice = picked.voice;
    this.selectedVoiceTier = picked.tier;

    const nextName = picked.voice ? formatVoiceLabel(picked.voice) : 'Voz masculina';
    const nextURI = picked.voice?.voiceURI || '';
    if (
      this.state.voiceName !== nextName ||
      this.state.voiceURI !== nextURI ||
      this.state.availableVoices.length !== picked.options.length
    ) {
      this.state = {
        ...this.state,
        voiceName: nextName,
        voiceURI: nextURI,
        availableVoices: picked.options,
      };
      this.emit();
    }
  }

  /** Wait briefly for Chrome/WebKit async voices list so we never fall back to female default */
  private ensureVoicesLoaded(timeoutMs = 450): Promise<void> {
    if (!this.state.supported) return Promise.resolve();
    if (window.speechSynthesis.getVoices().length > 0) {
      this.refreshVoice();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.refreshVoice();
        resolve();
      };
      const timer = window.setTimeout(finish, timeoutMs);
      const onChanged = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
          window.clearTimeout(timer);
          window.speechSynthesis.removeEventListener?.('voiceschanged', onChanged);
          finish();
        }
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', onChanged);
    });
  }

  public getState(): TextReaderState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.state;
    this.listeners.forEach((fn) => fn(snapshot));
  }

  private clearTimer(): void {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startTimer(): void {
    this.clearTimer();
    if (typeof window === 'undefined') return;
    this.lastTickAt = performance.now();
    this.timerId = window.setInterval(() => {
      if (this.state.status !== 'playing') return;
      const now = performance.now();
      const dt = (now - this.lastTickAt) / 1000;
      this.lastTickAt = now;

      const dur = Math.max(0.5, this.state.duration);
      const nextTime = Math.min(dur * 0.992, this.state.currentTime + dt);
      const nextProgress = Math.max(0, Math.min(0.995, nextTime / dur));
      const approxChar = Math.round(nextProgress * this.state.text.length);

      this.state = {
        ...this.state,
        currentTime: nextTime,
        progress: nextProgress,
        charIndex: Math.max(this.state.charIndex, approxChar),
      };
      this.emit();
    }, 80);
  }

  private cancelSpeechOnly(): void {
    this.playbackToken++;
    this.clearTimer();
    if (this.state.supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public selectVoiceByURI(uri: string): void {
    this.preferredVoiceURI = uri;
    this.refreshVoice();
    if (this.state.active && this.state.status === 'playing') {
      this.speakFromChar(snapToWordStart(this.state.text, this.state.charIndex));
    }
  }

  public playElement(elementId: string, rawText: string): boolean {
    const cleanText = rawText.trim();
    if (!cleanText || !this.state.supported) return false;

    if (this.state.active && this.state.elementId === elementId && this.state.text === cleanText) {
      if (this.state.status === 'playing') {
        this.pause();
        return true;
      }
      if (this.state.status === 'paused') {
        this.resume();
        return true;
      }
    }

    const duration = estimateDurationSec(cleanText, this.state.rate);
    this.state = {
      ...this.state,
      active: true,
      status: 'playing',
      elementId,
      text: cleanText,
      excerpt: makeExcerpt(cleanText),
      currentTime: 0,
      duration,
      progress: 0,
      charIndex: 0,
    };
    this.emit();
    this.speakFromChar(0);
    return true;
  }

  public pause(): void {
    if (!this.state.active || this.state.status !== 'playing') return;
    this.cancelSpeechOnly();
    this.state = {
      ...this.state,
      status: 'paused',
    };
    this.emit();
  }

  public resume(): void {
    if (!this.state.active || !this.state.text) return;
    if (this.state.status === 'playing') return;
    const startChar =
      this.state.status === 'ended' || this.state.charIndex >= this.state.text.length - 2
        ? 0
        : snapToWordStart(this.state.text, this.state.charIndex);

    if (startChar === 0) {
      this.state = {
        ...this.state,
        status: 'playing',
        currentTime: 0,
        progress: 0,
        charIndex: 0,
      };
    } else {
      this.state = {
        ...this.state,
        status: 'playing',
        charIndex: startChar,
      };
    }
    this.emit();
    this.speakFromChar(startChar);
  }

  public togglePlayPause(): void {
    if (!this.state.active) return;
    if (this.state.status === 'playing') {
      this.pause();
    } else {
      this.resume();
    }
  }

  public restart(): void {
    if (!this.state.active || !this.state.text) return;
    this.state = {
      ...this.state,
      status: 'playing',
      currentTime: 0,
      progress: 0,
      charIndex: 0,
    };
    this.emit();
    this.speakFromChar(0);
  }

  public seekToProgress(norm: number): void {
    if (!this.state.active || !this.state.text) return;
    const clamped = Math.max(0, Math.min(1, norm));
    const targetChar = snapToWordStart(
      this.state.text,
      Math.round(clamped * this.state.text.length)
    );
    const actualProgress =
      this.state.text.length > 0 ? targetChar / this.state.text.length : 0;
    const targetTime = actualProgress * this.state.duration;
    const wasPlaying = this.state.status === 'playing';

    this.cancelSpeechOnly();

    if (clamped >= 0.99) {
      this.state = {
        ...this.state,
        status: 'ended',
        currentTime: this.state.duration,
        progress: 1,
        charIndex: this.state.text.length,
      };
      this.emit();
      return;
    }

    this.state = {
      ...this.state,
      status: wasPlaying ? 'playing' : 'paused',
      currentTime: targetTime,
      progress: actualProgress,
      charIndex: targetChar,
    };
    this.emit();

    if (wasPlaying) {
      this.speakFromChar(targetChar);
    }
  }

  public setRate(rate: number): void {
    const nextRate = Math.max(0.75, Math.min(1.4, rate));
    if (Math.abs(nextRate - this.state.rate) < 0.01) return;
    const wasPlaying = this.state.status === 'playing';
    const curProgress = this.state.progress;
    const nextDuration = estimateDurationSec(this.state.text, nextRate);
    this.state = {
      ...this.state,
      rate: nextRate,
      duration: nextDuration,
      currentTime: curProgress * nextDuration,
    };
    this.emit();
    if (this.state.active && wasPlaying) {
      this.speakFromChar(snapToWordStart(this.state.text, this.state.charIndex));
    }
  }

  public stop(): void {
    this.cancelSpeechOnly();
    this.state = {
      ...this.state,
      active: false,
      status: 'idle',
      elementId: null,
      text: '',
      excerpt: '',
      currentTime: 0,
      duration: 0,
      progress: 0,
      charIndex: 0,
    };
    this.emit();
  }

  private speakFromChar(startChar: number): void {
    if (!this.state.supported) return;
    this.cancelSpeechOnly();

    const token = ++this.playbackToken;
    const fullText = this.state.text;
    const chunks = buildReadingChunks(fullText, startChar);

    if (chunks.length === 0) {
      this.state = {
        ...this.state,
        status: 'ended',
        currentTime: this.state.duration,
        progress: 1,
        charIndex: fullText.length,
      };
      this.emit();
      return;
    }

    void this.ensureVoicesLoaded().then(() => {
      if (token !== this.playbackToken) return;

      this.startTimer();

      const speakChunkIndex = (idx: number) => {
        if (token !== this.playbackToken) return;
        if (idx >= chunks.length) {
          this.clearTimer();
          this.state = {
            ...this.state,
            status: 'ended',
            currentTime: this.state.duration,
            progress: 1,
            charIndex: fullText.length,
          };
          this.emit();
          return;
        }

        const chunk = chunks[idx];
        const utt = new SpeechSynthesisUtterance(chunk.text);
        if (this.selectedVoice) {
          utt.voice = this.selectedVoice;
          utt.lang = this.selectedVoice.lang || 'es-MX';
        } else {
          utt.lang = 'es-MX';
        }

        // Warm, steady, unmistakably adult male voice prosody
        const baseRate = this.selectedVoiceTier === 'natural-male' ? 0.96 : 0.92;
        utt.rate = Number((baseRate * this.state.rate).toFixed(2));
        utt.pitch = getPreferredPitchForTier(this.selectedVoiceTier);
        utt.volume = 1;

        utt.onboundary = (ev) => {
          if (token !== this.playbackToken) return;
          const globalChar = Math.min(fullText.length, chunk.start + (ev.charIndex || 0));
          const ratio = fullText.length > 0 ? globalChar / fullText.length : 0;
          const syncedTime = ratio * this.state.duration;
          this.lastTickAt = performance.now();
          this.state = {
            ...this.state,
            charIndex: globalChar,
            progress: ratio,
            currentTime: syncedTime,
          };
          this.emit();
        };

        utt.onend = () => {
          if (token !== this.playbackToken) return;
          const ratio = fullText.length > 0 ? chunk.end / fullText.length : 1;
          this.state = {
            ...this.state,
            charIndex: chunk.end,
            progress: Math.min(1, ratio),
            currentTime: Math.min(this.state.duration, ratio * this.state.duration),
          };
          this.emit();
          speakChunkIndex(idx + 1);
        };

        utt.onerror = (ev) => {
          if (token !== this.playbackToken) return;
          if (ev.error === 'interrupted' || ev.error === 'canceled') return;
          speakChunkIndex(idx + 1);
        };

        try {
          window.speechSynthesis.speak(utt);
        } catch {
          this.clearTimer();
          this.state = { ...this.state, status: 'paused' };
          this.emit();
        }
      };

      speakChunkIndex(0);
    });
  }
}

export const textReaderEngine = new TextReaderEngine();

export function formatReaderTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
