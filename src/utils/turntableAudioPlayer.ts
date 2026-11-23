// Persistent background audio & voice-note player for the Cover Screen Luxury Gold Turntable.
// Stores imported MP3s and recorded voice notes in IndexedDB so they survive page reloads,
// and keeps audio playing seamlessly in the background even when closing the sheet music
// popover or opening the notebook studio.

export type TurntableTrackKind = 'voice' | 'mp3';

export interface TurntableTrackMeta {
  id: string;
  name: string;
  kind: TurntableTrackKind;
  mimeType: string;
  durationSec: number;
  createdAt: number;
  sizeBytes: number;
}

interface StoredTurntableTrack extends TurntableTrackMeta {
  blob: Blob;
}

export interface TurntablePlayerSnapshot {
  tracks: TurntableTrackMeta[];
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  isRecording: boolean;
  recordingSec: number;
  statusMessage: string | null;
}

const DB_NAME = 'CuadernoTurntableAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openTurntableDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Error abriendo IndexedDB'));
  });
}

async function dbGetAllTracks(): Promise<StoredTurntableTrack[]> {
  const db = await openTurntableDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result as StoredTurntableTrack[]) || [];
      list.sort((a, b) => b.createdAt - a.createdAt);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbPutTrack(record: StoredTurntableTrack): Promise<void> {
  const db = await openTurntableDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteTrack(id: string): Promise<void> {
  const db = await openTurntableDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function probeAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';
    const done = (sec: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(sec) && sec > 0 ? sec : 0);
    };
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration !== Infinity) {
        done(audio.duration);
      } else {
        // WebM MediaRecorder blobs sometimes report Infinity until seeked
        audio.currentTime = 1e6;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          done(audio.duration);
        };
      }
    };
    audio.onerror = () => done(0);
    audio.src = url;
    window.setTimeout(() => done(0), 2200);
  });
}

class TurntableAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private blobs = new Map<string, Blob>();
  private objectUrls = new Map<string, string>();
  private tracks: TurntableTrackMeta[] = [];
  private currentTrackId: string | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private volume = 0.85;
  private isLooping = false;
  private isRecording = false;
  private recordingSec = 0;
  private statusMessage: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private recordTimer: number | null = null;
  private recordStartMs = 0;
  private hydrated = false;
  private listeners = new Set<(snap: TurntablePlayerSnapshot) => void>();

  public async ensureHydrated(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const stored = await dbGetAllTracks();
      this.tracks = stored.map(({ blob, ...meta }) => {
        this.blobs.set(meta.id, blob);
        return meta;
      });
      if (this.tracks.length > 0 && !this.currentTrackId) {
        this.currentTrackId = this.tracks[0].id;
        this.duration = this.tracks[0].durationSec;
      }
      this.emit();
    } catch {
      // Fallback to in-memory only if storage is blocked
    }
  }

  public getSnapshot(): TurntablePlayerSnapshot {
    return {
      tracks: [...this.tracks],
      currentTrackId: this.currentTrackId,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isLooping: this.isLooping,
      isRecording: this.isRecording,
      recordingSec: this.recordingSec,
      statusMessage: this.statusMessage,
    };
  }

  public subscribe(listener: (snap: TurntablePlayerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    void this.ensureHydrated();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private setStatus(msg: string | null) {
    this.statusMessage = msg;
    this.emit();
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const el = new Audio();
      el.preload = 'auto';
      el.volume = this.volume;

      el.addEventListener('timeupdate', () => {
        this.currentTime = el.currentTime || 0;
        if (Number.isFinite(el.duration) && el.duration > 0) {
          this.duration = el.duration;
        }
        this.emit();
      });

      el.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(el.duration) && el.duration > 0) {
          this.duration = el.duration;
          this.emit();
        }
      });

      el.addEventListener('play', () => {
        this.isPlaying = true;
        this.emit();
      });

      el.addEventListener('pause', () => {
        this.isPlaying = false;
        this.emit();
      });

      el.addEventListener('ended', () => {
        if (this.isLooping && this.currentTrackId) {
          el.currentTime = 0;
          void el.play().catch(() => {});
          return;
        }
        // Automatically advance to the next track in the sheet-music playlist
        if (this.tracks.length > 1 && this.currentTrackId) {
          const idx = this.tracks.findIndex((t) => t.id === this.currentTrackId);
          const next = this.tracks[(idx + 1) % this.tracks.length];
          if (next) {
            void this.playTrack(next.id);
            return;
          }
        }
        this.isPlaying = false;
        this.currentTime = 0;
        this.emit();
      });

      this.audio = el;
    }
    return this.audio;
  }

  private getObjectUrl(id: string): string | null {
    const existing = this.objectUrls.get(id);
    if (existing) return existing;
    const blob = this.blobs.get(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    this.objectUrls.set(id, url);
    return url;
  }

  public async playTrack(id: string): Promise<void> {
    const track = this.tracks.find((t) => t.id === id);
    if (!track) return;
    const url = this.getObjectUrl(id);
    if (!url) return;

    const el = this.ensureAudio();
    const sameTrack = this.currentTrackId === id && el.src === url;
    this.currentTrackId = id;

    if (!sameTrack) {
      el.src = url;
      el.currentTime = 0;
      this.currentTime = 0;
      this.duration = track.durationSec || 0;
    }
    el.volume = this.volume;

    try {
      await el.play();
      this.isPlaying = true;
      this.setStatus(null);
    } catch {
      this.isPlaying = false;
      this.setStatus('Toca reproducir nuevamente para iniciar el audio.');
    }
  }

  public togglePlayPause(): void {
    const el = this.ensureAudio();
    if (this.isPlaying) {
      el.pause();
      this.isPlaying = false;
      this.emit();
      return;
    }
    if (this.currentTrackId) {
      void this.playTrack(this.currentTrackId);
    } else if (this.tracks.length > 0) {
      void this.playTrack(this.tracks[0].id);
    }
  }

  public pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.emit();
  }

  public nextTrack(): void {
    if (this.tracks.length === 0) return;
    const idx = this.tracks.findIndex((t) => t.id === this.currentTrackId);
    const next = this.tracks[(idx + 1) % this.tracks.length];
    if (next) void this.playTrack(next.id);
  }

  public prevTrack(): void {
    if (this.tracks.length === 0) return;
    const idx = this.tracks.findIndex((t) => t.id === this.currentTrackId);
    const prev = this.tracks[(idx - 1 + this.tracks.length) % this.tracks.length];
    if (prev) void this.playTrack(prev.id);
  }

  public seek(sec: number): void {
    const el = this.ensureAudio();
    const target = Math.max(0, Math.min(this.duration || 0, sec));
    if (Number.isFinite(target)) {
      el.currentTime = target;
      this.currentTime = target;
      this.emit();
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.emit();
  }

  public toggleLoop(): void {
    this.isLooping = !this.isLooping;
    this.emit();
  }

  public async addAudioFiles(files: FileList | File[]): Promise<void> {
    const list = Array.from(files);
    if (list.length === 0) return;

    let firstAddedId: string | null = null;

    for (const file of list) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Pista MP3';
      const durationSec = await probeAudioDuration(file);
      const id = `mp3-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const meta: TurntableTrackMeta = {
        id,
        name: cleanName,
        kind: 'mp3',
        mimeType: file.type || 'audio/mpeg',
        durationSec,
        createdAt: Date.now(),
        sizeBytes: file.size,
      };

      this.blobs.set(id, file);
      this.tracks = [meta, ...this.tracks];
      if (!firstAddedId) firstAddedId = id;

      try {
        await dbPutTrack({ ...meta, blob: file });
      } catch {
        // Keep in memory if quota is exceeded
      }
    }

    this.setStatus(
      list.length === 1
        ? 'Archivo MP3 añadido a la partitura.'
        : `${list.length} archivos de audio añadidos.`
    );

    if (firstAddedId) {
      await this.playTrack(firstAddedId);
    }
  }

  public async startVoiceRecording(): Promise<void> {
    if (this.isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.setStatus('Tu navegador no soporta grabación de notas de voz.');
      return;
    }

    // Pause background playback cleanly while capturing voice
    if (this.isPlaying) {
      this.pause();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      this.recordedChunks = [];

      const preferredTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      const mimeType =
        preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          this.recordedChunks.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: finalMime });
        const elapsedSec = Math.max(1, (Date.now() - this.recordStartMs) / 1000);
        this.cleanupRecorderResources();

        if (blob.size < 200) {
          this.setStatus('Nota de voz demasiado corta.');
          return;
        }

        const voiceCount = this.tracks.filter((t) => t.kind === 'voice').length + 1;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const id = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        void probeAudioDuration(blob).then(async (probed) => {
          const meta: TurntableTrackMeta = {
            id,
            name: `Nota de voz #${voiceCount} · ${hh}:${mm}`,
            kind: 'voice',
            mimeType: finalMime,
            durationSec: probed > 0.3 ? probed : elapsedSec,
            createdAt: Date.now(),
            sizeBytes: blob.size,
          };
          this.blobs.set(id, blob);
          this.tracks = [meta, ...this.tracks];
          this.currentTrackId = id;
          this.duration = meta.durationSec;
          try {
            await dbPutTrack({ ...meta, blob });
          } catch {
            // Keep in memory
          }
          this.setStatus('Nota de voz guardada en tu partitura.');
        });
      };

      this.mediaRecorder = recorder;
      this.isRecording = true;
      this.recordingSec = 0;
      this.recordStartMs = Date.now();
      recorder.start(250);

      this.recordTimer = window.setInterval(() => {
        this.recordingSec = (Date.now() - this.recordStartMs) / 1000;
        this.emit();
      }, 150);

      this.setStatus('Grabando nota de voz...');
    } catch {
      this.cleanupRecorderResources();
      this.setStatus('Permite el acceso al micrófono para grabar una nota de voz.');
    }
  }

  public stopVoiceRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;
    try {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch {
      this.cleanupRecorderResources();
    }
  }

  private cleanupRecorderResources() {
    if (this.recordTimer !== null) {
      window.clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.isRecording = false;
    this.recordingSec = 0;
    this.emit();
  }

  public async deleteTrack(id: string): Promise<void> {
    if (this.currentTrackId === id) {
      this.pause();
      this.currentTrackId = null;
      this.currentTime = 0;
      this.duration = 0;
    }
    const url = this.objectUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(id);
    }
    this.blobs.delete(id);
    this.tracks = this.tracks.filter((t) => t.id !== id);
    if (!this.currentTrackId && this.tracks.length > 0) {
      this.currentTrackId = this.tracks[0].id;
      this.duration = this.tracks[0].durationSec;
    }
    try {
      await dbDeleteTrack(id);
    } catch {
      // ignore
    }
    this.emit();
  }
}

export const turntableAudioPlayer = new TurntableAudioPlayer();

export function formatAudioTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
