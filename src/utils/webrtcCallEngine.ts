// Real-time WebRTC Audio & Video Call Engine for Atelier Members.
// Uses Firebase Firestore signaling (6-digit room codes) with automatic zero-server P2P invite-code fallback
// so members can converse by audio or HD video across Android (Samsung Galaxy Note 9), Windows .exe & Web.

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export type CallMode = 'audio' | 'video';
export type CallStatus =
  | 'idle'
  | 'preparing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'error';

export interface CallSnapshot {
  status: CallStatus;
  mode: CallMode;
  roomCode: string;
  peerName: string;
  micMuted: boolean;
  cameraOff: boolean;
  facingMode: 'user' | 'environment';
  screenSharing: boolean;
  signalingMode: 'firestore' | 'p2p-manual';
  manualLocalToken: string;
  statusNote: string | null;
  startedAtMs: number | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 8,
};

function getDbSafe() {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getFirestore(app);
  } catch {
    return null;
  }
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function encodeToken(obj: unknown): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch {
    return '';
  }
}

function decodeToken<T>(token: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(token.trim())))) as T;
  } catch {
    return null;
  }
}

function waitForIceComplete(pc: RTCPeerConnection, timeoutMs = 2400): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }, timeoutMs);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

export class AtelierWebRtcCallEngine {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubscribers: Unsubscribe[] = [];

  private state: CallSnapshot = {
    status: 'idle',
    mode: 'video',
    roomCode: '',
    peerName: 'Integrante del Taller',
    micMuted: false,
    cameraOff: false,
    facingMode: 'user',
    screenSharing: false,
    signalingMode: 'firestore',
    manualLocalToken: '',
    statusNote: null,
    startedAtMs: null,
    localStream: null,
    remoteStream: null,
  };

  private listeners = new Set<(snap: CallSnapshot) => void>();

  public getSnapshot(): CallSnapshot {
    return { ...this.state };
  }

  public subscribe(fn: (snap: CallSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private patch(partial: Partial<CallSnapshot>) {
    this.state = { ...this.state, ...partial };
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private async acquireMedia(mode: CallMode, facing: 'user' | 'environment'): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Tu dispositivo no permite acceso a cámara o micrófono en este contexto.');
    }
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        mode === 'video'
          ? {
              facingMode: { ideal: facing },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
            }
          : false,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  private setupPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    const remote = new MediaStream();
    this.remoteStream = remote;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remote.addTrack(track);
      });
      this.patch({
        remoteStream: remote,
        status: 'connected',
        startedAtMs: this.state.startedAtMs ?? Date.now(),
        statusNote: 'Conectado en vivo',
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.patch({
          status: 'connected',
          startedAtMs: this.state.startedAtMs ?? Date.now(),
          statusNote: 'Llamada activa en vivo',
        });
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.patch({ statusNote: 'Reconectando señal con el integrante...' });
      }
    };

    this.pc = pc;
    this.patch({ localStream: this.localStream, remoteStream: remote });
    return pc;
  }

  /** Start a new Audio or Video Call room and wait for another member to join */
  public async startCallRoom(mode: CallMode, peerName: string): Promise<void> {
    this.endCall(false);
    const code = generateRoomCode();
    this.patch({
      status: 'preparing',
      mode,
      roomCode: code,
      peerName: peerName || 'Integrante del Taller',
      micMuted: false,
      cameraOff: mode === 'audio',
      facingMode: 'user',
      screenSharing: false,
      manualLocalToken: '',
      statusNote: mode === 'video' ? 'Activando cámara y micrófono...' : 'Activando micrófono...',
      startedAtMs: null,
    });

    try {
      this.localStream = await this.acquireMedia(mode, 'user');
    } catch {
      this.patch({
        status: 'error',
        statusNote:
          'Permite acceso al micrófono y/o cámara en tu celular o navegador para iniciar la llamada.',
      });
      return;
    }

    const pc = this.setupPeerConnection();
    const db = getDbSafe();

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode === 'video',
      });
      await pc.setLocalDescription(offer);

      if (db) {
        try {
          const roomRef = doc(db, 'atelier_calls', code);
          const callerCandidates = collection(roomRef, 'callerCandidates');
          const calleeCandidates = collection(roomRef, 'calleeCandidates');

          pc.onicecandidate = (ev) => {
            if (ev.candidate) {
              void addDoc(callerCandidates, ev.candidate.toJSON()).catch(() => {});
            }
          };

          await setDoc(roomRef, {
            mode,
            hostName: peerName,
            createdAt: Date.now(),
            offer: { type: offer.type, sdp: offer.sdp },
          });

          const unsubRoom = onSnapshot(roomRef, async (snap) => {
            const data = snap.data();
            if (data?.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
          });
          const unsubCallee = onSnapshot(calleeCandidates, (snap) => {
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                void pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
              }
            });
          });
          this.unsubscribers.push(unsubRoom, unsubCallee);

          this.patch({
            status: 'waiting',
            signalingMode: 'firestore',
            statusNote: `Sala ${code} lista. Comparte el código con el integrante para conectarse.`,
          });
          return;
        } catch {
          // Firestore signaling unavailable -> fall back seamlessly to Zero-Server P2P Invite Token
        }
      }

      // Zero-server WebRTC direct invite token fallback
      await waitForIceComplete(pc);
      const token = encodeToken({
        v: 1,
        mode,
        code,
        sdp: pc.localDescription?.toJSON(),
      });
      this.patch({
        status: 'waiting',
        signalingMode: 'p2p-manual',
        manualLocalToken: token,
        statusNote:
          'Sala P2P directa lista. Copia el código de invitación y envíalo al integrante.',
      });
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'No se pudo inicializar la conexión WebRTC.',
      });
    }
  }

  /** Join an existing call room by 6-digit code OR pasted P2P invite token */
  public async joinCall(codeOrToken: string, preferredMode: CallMode, myName: string): Promise<void> {
    const clean = codeOrToken.trim();
    if (!clean) return;

    this.endCall(false);
    const isManualToken = clean.length > 24;
    const decoded = isManualToken
      ? decodeToken<{ mode?: CallMode; code?: string; sdp?: RTCSessionDescriptionInit }>(clean)
      : null;

    const mode: CallMode = decoded?.mode || preferredMode;
    const roomCode = decoded?.code || clean.toUpperCase();

    this.patch({
      status: 'connecting',
      mode,
      roomCode,
      peerName: myName || 'Integrante',
      micMuted: false,
      cameraOff: mode === 'audio',
      facingMode: 'user',
      screenSharing: false,
      manualLocalToken: '',
      statusNote: 'Conectando a la sala de llamada...',
      startedAtMs: null,
    });

    try {
      this.localStream = await this.acquireMedia(mode, 'user');
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'Permite el micrófono/cámara para unirte a la llamada.',
      });
      return;
    }

    const pc = this.setupPeerConnection();

    // Branch A: Direct P2P Token
    if (decoded?.sdp) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(decoded.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceComplete(pc);
        const answerToken = encodeToken({ v: 1, sdp: pc.localDescription?.toJSON() });
        this.patch({
          status: 'waiting',
          signalingMode: 'p2p-manual',
          manualLocalToken: answerToken,
          statusNote:
            'Copia este código de respuesta y envíaselo a quien inició la llamada para conectar al instante.',
        });
      } catch {
        this.patch({ status: 'error', statusNote: 'Código de invitación inválido.' });
      }
      return;
    }

    // Branch B: 6-digit Firestore Room Code
    const db = getDbSafe();
    if (!db) {
      this.patch({
        status: 'error',
        statusNote: 'Usa un código de invitación P2P completo para conectar sin servidor.',
      });
      return;
    }

    try {
      const roomRef = doc(db, 'atelier_calls', roomCode);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        this.patch({
          status: 'error',
          statusNote: `No se encontró la sala "${roomCode}". Verifica el código.`,
        });
        return;
      }

      const data = roomSnap.data();
      const callerCandidates = collection(roomRef, 'callerCandidates');
      const calleeCandidates = collection(roomRef, 'calleeCandidates');

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          void addDoc(calleeCandidates, ev.candidate.toJSON()).catch(() => {});
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(roomRef, {
        answer: { type: answer.type, sdp: answer.sdp },
        guestName: myName,
      });

      const unsubCaller = onSnapshot(callerCandidates, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            void pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
          }
        });
      });
      this.unsubscribers.push(unsubCaller);

      this.patch({
        status: 'connected',
        signalingMode: 'firestore',
        startedAtMs: Date.now(),
        statusNote: `Conectado a la sala ${roomCode}`,
      });
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'No se pudo conectar a la sala. Intenta con el código de invitación P2P.',
      });
    }
  }

  /** Complete a manual P2P call on the host side by pasting the guest's answer token */
  public async applyManualAnswerToken(answerToken: string): Promise<void> {
    if (!this.pc) return;
    const decoded = decodeToken<{ sdp?: RTCSessionDescriptionInit }>(answerToken);
    if (!decoded?.sdp) {
      this.patch({ statusNote: 'El código de respuesta no es válido.' });
      return;
    }
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(decoded.sdp));
      this.patch({
        status: 'connected',
        startedAtMs: Date.now(),
        statusNote: 'Conectado en vivo P2P',
      });
    } catch {
      this.patch({ statusNote: 'No se pudo aplicar la respuesta P2P.' });
    }
  }

  public toggleMic(): void {
    const next = !this.state.micMuted;
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    this.patch({ micMuted: next });
  }

  public toggleCamera(): void {
    const next = !this.state.cameraOff;
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    this.patch({ cameraOff: next });
  }

  /** Switch between Front & Rear camera (great for showing crochet stitches on Galaxy Note 9!) */
  public async switchCamera(): Promise<void> {
    if (this.state.mode !== 'video' || !this.localStream) return;
    const nextFacing = this.state.facingMode === 'user' ? 'environment' : 'user';
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
      });
      const newTrack = fresh.getVideoTracks()[0];
      if (!newTrack) return;

      const oldTrack = this.localStream.getVideoTracks()[0];
      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      newTrack.enabled = !this.state.cameraOff;

      const sender = this.pc?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
      this.patch({ facingMode: nextFacing, localStream: new MediaStream(this.localStream.getTracks()) });
    } catch {
      this.patch({ statusNote: 'Solo hay una cámara disponible en este dispositivo.' });
    }
  }

  public async toggleScreenShare(): Promise<void> {
    if (!this.pc || !this.localStream) return;
    const mediaDevices = navigator.mediaDevices as MediaDevices & {
      getDisplayMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
    };
    if (!mediaDevices?.getDisplayMedia) {
      this.patch({ statusNote: 'Compartir pantalla está disponible en escritorio.' });
      return;
    }

    if (this.state.screenSharing) {
      await this.switchCamera();
      this.patch({ screenSharing: false });
      return;
    }

    try {
      const screenStream = await mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;
      const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
      screenTrack.onended = () => {
        this.patch({ screenSharing: false });
      };
      this.patch({ screenSharing: true, statusNote: 'Compartiendo pantalla del cuaderno' });
    } catch {
      // User cancelled screen picker
    }
  }

  public endCall(resetStatus = true): void {
    this.unsubscribers.forEach((u) => {
      try {
        u();
      } catch {
        // ignore
      }
    });
    this.unsubscribers = [];

    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;

    if (resetStatus) {
      this.patch({
        status: 'idle',
        roomCode: '',
        micMuted: false,
        cameraOff: false,
        screenSharing: false,
        manualLocalToken: '',
        statusNote: null,
        startedAtMs: null,
        localStream: null,
        remoteStream: null,
      });
    }
  }
}

export const atelierCallEngine = new AtelierWebRtcCallEngine();
