/**
 * Natural Neutral Masculine Spanish Text-to-Speech Reader Engine.
 * - Automatically chooses the most pleasant, neutral masculine Spanish voice available
 *   on macOS, Windows, Edge, Chrome, Safari, or Electron.
 * - Uses sentence-chunked playback with word-level offset tracking so Play, Pause,
 *   Resume, Restart, and interactive Time-Bar Scrubbing work reliably without
 *   browser speechSynthesis pause/15s-cutoff bugs.
 */

export type ReaderStatus = 'idle' | 'playing' | 'paused' | 'ended';

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
  rate: number;
  supported: boolean;
}

type Listener = (state: TextReaderState) => void;

const MALE_VOICE_NAMES = [
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
  'eddy',
  'reed',
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
  'male',
  'hombre',
  'masculin',
];

const FEMALE_VOICE_NAMES = [
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
  'rocko',
];

function scoreSpanishMaleVoice(voice: SpeechSynthesisVoice): {
  score: number;
  isLikelyMale: boolean;
} {
  const name = voice.name.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();

  let score = 0;

  // Language preference: neutral Spanish first
  if (lang === 'es-419' || lang === 'es-mx' || lang === 'es-us' || lang === 'es-co') {
    score += 120;
  } else if (lang === 'es-es' || lang === 'es-ar' || lang === 'es-cl' || lang.startsWith('es')) {
    score += 108;
  } else {
    // Non-Spanish voice heavily penalized
    score -= 200;
  }

  // Explicitly avoid novelty / robotic voices
  if (NOVELTY_VOICE_NAMES.some((n) => name.includes(n))) {
    score -= 250;
  }

  // Gender classification
  const matchesMale = MALE_VOICE_NAMES.some((m) => name.includes(m));
  const matchesFemale = FEMALE_VOICE_NAMES.some((f) => name.includes(f));

  if (matchesMale && !matchesFemale) {
    score += 140;
  } else if (matchesFemale) {
    score -= 95;
  }

  // Prefer natural, neural, enhanced, premium studio-grade voices
  if (
    name.includes('natural') ||
    name.includes('neural') ||
    name.includes('premium') ||
    name.includes('enhanced') ||
    name.includes('online')
  ) {
    score += 45;
  }
  if (name.includes('google') || name.includes('microsoft') || name.includes('siri')) {
    score += 18;
  }
  // Prefer especially pleasant, warm neutral Spanish male voices
  if (
    name.includes('alonso') ||
    name.includes('jorge') ||
    name.includes('juan') ||
    name.includes('diego') ||
    name.includes('carlos') ||
    name.includes('alvaro') ||
    name.includes('álvaro')
  ) {
    score += 24;
  }

  return { score, isLikelyMale: matchesMale && !matchesFemale };
}

export function pickNeutralMaleSpanishVoice(): {
  voice: SpeechSynthesisVoice | null;
  isLikelyMale: boolean;
} {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, isLikelyMale: false };
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { voice: null, isLikelyMale: false };

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  let bestMale = false;

  for (const v of voices) {
    const { score, isLikelyMale } = scoreSpanishMaleVoice(v);
    if (score > bestScore) {
      bestScore = score;
      best = v;
      bestMale = isLikelyMale;
    }
  }
  return { voice: best, isLikelyMale: bestMale };
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

  // Skip leading whitespace
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

    // Prefer sentence ending (. ! ? \n), then clause (, ; :), then word space
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

/** Snap any target character index to the beginning of its word so seeking never cuts mid-word */
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
  // Natural Spanish reading pace ≈ 14.5 chars/sec at 1.0x (≈ 145–155 wpm)
  const charsPerSec = 14.5 * Math.max(0.5, rate);
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
  private selectedVoiceIsMale = false;

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
      voiceName: 'Voz masculina neutral',
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
        // ignore older browsers
      }
    }
  }

  private refreshVoice(): void {
    const picked = pickNeutralMaleSpanishVoice();
    this.selectedVoice = picked.voice;
    this.selectedVoiceIsMale = picked.isLikelyMale;
    const cleanName = picked.voice
      ? picked.voice.name
          .replace(/Microsoft\s+/i, '')
          .replace(/\s+Online\s*\(Natural\)/i, '')
          .replace(/\s*\(Enhanced\)|\s*\(Premium\)/i, '')
          .trim()
      : 'Voz masculina neutral';
    if (this.state.voiceName !== cleanName) {
      this.state = { ...this.state, voiceName: cleanName };
      this.emit();
    }
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

  /** Speak a text box from the beginning (or toggle pause/resume if it's already active) */
  public playElement(elementId: string, rawText: string): boolean {
    const cleanText = rawText.trim();
    if (!cleanText || !this.state.supported) return false;

    // If clicking the exact same element that is currently playing -> pause it
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

    this.refreshVoice();
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

  /** Jump to any normalized position (0..1) or timestamp along the time control bar */
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

    if (!this.selectedVoice) {
      this.refreshVoice();
    }

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
        utt.lang = this.selectedVoice.lang || 'es-ES';
      } else {
        utt.lang = 'es-ES';
      }
      // Pleasant, calm, neutral masculine timbre & steady articulation
      utt.rate = Number((0.96 * this.state.rate).toFixed(2));
      utt.pitch = this.selectedVoiceIsMale ? 0.94 : 0.8;
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
        // Skip failed chunk gracefully or end
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
  }
}

export const textReaderEngine = new TextReaderEngine();

export function formatReaderTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
