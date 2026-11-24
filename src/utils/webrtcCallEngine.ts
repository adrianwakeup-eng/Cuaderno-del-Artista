// Real-time APK-to-APK, Desktop & Web Audio/Video Call Engine for Atelier Members.
// Primary signaling: PeerJS Cloud (0.peerjs.com over secure WSS) using simple 6-digit numeric room codes
// so two Android APK users (e.g. Samsung Galaxy Note 9 <-> another Android phone) connect in seconds
// with zero server setup. Automatic fallback: Zero-Server direct WebRTC P2P invite token.

import Peer, { type MediaConnection } from 'peerjs';

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
  signalingMode: 'peerjs' | 'p2p-manual';
  manualLocalToken: string;
  statusNote: string | null;
  startedAtMs: number | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const PEER_ID_PREFIX = 'cuaderno-atelier-';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 8,
};

function generateNumericRoomCode(): string {
  // 6 easy-to-type numeric digits for Samsung Galaxy Note 9 / mobile keypads (e.g. "482915")
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

function normalizeRoomCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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
  private peer: Peer | null = null;
  private activeMediaConn: MediaConnection | null = null;
  private manualPc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private wakeLock: { release?: () => Promise<void> } | null = null;

  private state: CallSnapshot = {
    status: 'idle',
    mode: 'video',
    roomCode: '',
    peerName: 'Integrante del Taller',
    micMuted: false,
    cameraOff: false,
    facingMode: 'user',
    screenSharing: false,
    signalingMode: 'peerjs',
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

  private async requestWakeLock() {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      if (nav.wakeLock) {
        this.wakeLock = await nav.wakeLock.request('screen');
      }
    } catch {
      // ignore if wakeLock unsupported
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock?.release) {
      void this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
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
              width: { ideal: 960, max: 1280 },
              height: { ideal: 720, max: 960 },
              frameRate: { ideal: 24, max: 30 },
            }
          : false,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  private getActivePeerConnection(): RTCPeerConnection | null {
    if (this.activeMediaConn) {
      return (this.activeMediaConn as unknown as { peerConnection?: RTCPeerConnection })
        .peerConnection ?? null;
    }
    return this.manualPc;
  }

  private bindMediaConnection(call: MediaConnection) {
    this.activeMediaConn = call;

    call.on('stream', (remoteStream) => {
      // Create a fresh MediaStream wrapper so React & Android WebView ALWAYS detect track arrival & play()!
      const freshRemote = new MediaStream(remoteStream.getTracks());
      this.patch({
        remoteStream: freshRemote,
        status: 'connected',
        startedAtMs: this.state.startedAtMs ?? Date.now(),
        statusNote: 'Conectado en vivo con el integrante',
      });
    });

    call.on('close', () => {
      if (this.state.status !== 'idle') {
        this.patch({
          statusNote: 'El otro integrante finalizó la llamada.',
          remoteStream: null,
        });
      }
    });

    call.on('error', () => {
      this.patch({
        statusNote: 'Interrupción de señal con el integrante. Puedes volver a conectar.',
      });
    });
  }

  private createPeerWithTimeout(peerId?: string, timeoutMs = 6500): Promise<Peer> {
    return new Promise((resolve, reject) => {
      const peer = peerId
        ? new Peer(peerId, { secure: true, config: RTC_CONFIG, debug: 0 })
        : new Peer({ secure: true, config: RTC_CONFIG, debug: 0 });

      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            peer.destroy();
          } catch {
            // ignore
          }
          reject(new Error('PeerJS timeout'));
        }
      }, timeoutMs);

      peer.once('open', () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(peer);
        }
      });

      peer.once('error', (err) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          try {
            peer.destroy();
          } catch {
            // ignore
          }
          reject(err);
        }
      });
    });
  }

  /** Start a new Audio or Video Call room (instant 6-digit code via PeerJS Cloud, automatic P2P fallback) */
  public async startCallRoom(mode: CallMode, peerName: string): Promise<void> {
    this.endCall(false);
    const code = generateNumericRoomCode();
    this.patch({
      status: 'preparing',
      mode,
      roomCode: code,
      peerName: peerName || 'Integrante del Taller',
      micMuted: false,
      cameraOff: mode === 'audio',
      facingMode: 'user',
      screenSharing: false,
      signalingMode: 'peerjs',
      manualLocalToken: '',
      statusNote: mode === 'video' ? 'Activando cámara y micrófono...' : 'Activando micrófono...',
      startedAtMs: null,
      localStream: null,
      remoteStream: null,
    });

    try {
      this.localStream = await this.acquireMedia(mode, 'user');
      this.patch({ localStream: new MediaStream(this.localStream.getTracks()) });
      void this.requestWakeLock();
    } catch {
      this.patch({
        status: 'error',
        statusNote:
          'Permite el acceso al micrófono y la cámara en tu celular para iniciar la videollamada.',
      });
      return;
    }

    // 1. Primary Instant Signaling via PeerJS Cloud (works APK <-> APK across any two phones!)
    try {
      const peer = await this.createPeerWithTimeout(`${PEER_ID_PREFIX}${code}`, 6500);
      this.peer = peer;

      peer.on('call', (incomingCall) => {
        if (!this.localStream) return;
        this.patch({
          status: 'connecting',
          statusNote: 'Integrante conectándose a tu sala...',
        });
        incomingCall.answer(this.localStream);
        this.bindMediaConnection(incomingCall);
      });

      peer.on('disconnected', () => {
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {
            // ignore
          }
        }
      });

      this.patch({
        status: 'waiting',
        signalingMode: 'peerjs',
        statusNote: `Sala ${code} lista en vivo. El otro usuario de la APK solo debe pulsar "Unirse" y escribir ${code}.`,
      });
      return;
    } catch {
      // PeerJS broker unreachable -> Seamless fallback to zero-server manual P2P invite token!
    }

    // 2. Fallback: Zero-server direct WebRTC P2P offer token
    try {
      const pc = this.setupManualPeerConnection();
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode === 'video',
      });
      await pc.setLocalDescription(offer);
      await waitForIceComplete(pc);
      const token = encodeToken({ v: 1, mode, code, sdp: pc.localDescription?.toJSON() });
      this.patch({
        status: 'waiting',
        signalingMode: 'p2p-manual',
        manualLocalToken: token,
        statusNote:
          'Modo directo sin servidor: copia el código de invitación y envíaselo al otro integrante.',
      });
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'No se pudo iniciar la conexión WebRTC. Revisa tu conexión a internet.',
      });
    }
  }

  /** Join an existing call room from another APK / device by typing the 6-digit code (or pasting P2P token) */
  public async joinCall(codeOrToken: string, preferredMode: CallMode, myName: string): Promise<void> {
    const clean = codeOrToken.trim();
    if (!clean) return;

    this.endCall(false);
    const isManualToken = clean.length > 24;
    const decoded = isManualToken
      ? decodeToken<{ mode?: CallMode; code?: string; sdp?: RTCSessionDescriptionInit }>(clean)
      : null;

    const mode: CallMode = decoded?.mode || preferredMode;
    const roomCode = decoded?.code || normalizeRoomCode(clean);

    this.patch({
      status: 'connecting',
      mode,
      roomCode,
      peerName: myName || 'Integrante',
      micMuted: false,
      cameraOff: mode === 'audio',
      facingMode: 'user',
      screenSharing: false,
      signalingMode: isManualToken ? 'p2p-manual' : 'peerjs',
      manualLocalToken: '',
      statusNote: `Conectando con la sala ${roomCode}...`,
      startedAtMs: null,
      localStream: null,
      remoteStream: null,
    });

    try {
      this.localStream = await this.acquireMedia(mode, 'user');
      this.patch({ localStream: new MediaStream(this.localStream.getTracks()) });
      void this.requestWakeLock();
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'Permite el micrófono y la cámara en tu celular para unirte a la llamada.',
      });
      return;
    }

    // Branch A: Direct Manual P2P Token
    if (decoded?.sdp) {
      try {
        const pc = this.setupManualPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(decoded.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceComplete(pc);
        const answerToken = encodeToken({ v: 1, sdp: pc.localDescription?.toJSON() });
        this.patch({
          status: 'waiting',
          signalingMode: 'p2p-manual',
          manualLocalToken: answerToken,
          statusNote: 'Envía este código de respuesta a quien creó la sala para enlazar al instante.',
        });
      } catch {
        this.patch({ status: 'error', statusNote: 'Código de invitación P2P inválido.' });
      }
      return;
    }

    // Branch B: Instant 6-digit PeerJS Cloud Room Call!
    try {
      const peer = await this.createPeerWithTimeout(undefined, 6500);
      this.peer = peer;

      const mediaCall = peer.call(`${PEER_ID_PREFIX}${roomCode}`, this.localStream);
      if (!mediaCall) {
        this.patch({
          status: 'error',
          statusNote: `No se pudo marcar a la sala ${roomCode}. Verifica el número.`,
        });
        return;
      }

      this.bindMediaConnection(mediaCall);

      peer.on('error', (err) => {
        const msg = String(err?.type || err?.message || '');
        if (msg.includes('peer-unavailable')) {
          this.patch({
            status: 'error',
            statusNote: `No se encontró la sala ${roomCode}. Pide al otro integrante que verifique el código.`,
          });
        }
      });

      this.patch({
        status: 'connecting',
        signalingMode: 'peerjs',
        statusNote: `Llamando a la sala ${roomCode}...`,
      });
    } catch {
      this.patch({
        status: 'error',
        statusNote: 'No se pudo conectar al servidor de señalización. Verifica tu conexión a internet.',
      });
    }
  }

  private setupManualPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    const remote = new MediaStream();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remote.getTracks().some((t) => t.id === track.id)) {
          remote.addTrack(track);
        }
      });
      this.patch({
        remoteStream: new MediaStream(remote.getTracks()),
        status: 'connected',
        startedAtMs: this.state.startedAtMs ?? Date.now(),
        statusNote: 'Conectado en vivo P2P',
      });
    };

    this.manualPc = pc;
    return pc;
  }

  /** Complete a manual P2P call on the host side by pasting the guest's answer token */
  public async applyManualAnswerToken(answerToken: string): Promise<void> {
    if (!this.manualPc) return;
    const decoded = decodeToken<{ sdp?: RTCSessionDescriptionInit }>(answerToken);
    if (!decoded?.sdp) {
      this.patch({ statusNote: 'El código de respuesta no es válido.' });
      return;
    }
    try {
      await this.manualPc.setRemoteDescription(new RTCSessionDescription(decoded.sdp));
      this.patch({
        status: 'connecting',
        statusNote: 'Enlazando audio y video P2P...',
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

  /** Switch between Front & Rear camera (great for showing crochet stitches on Samsung Galaxy Note 9!) */
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

      const pc = this.getActivePeerConnection();
      const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
      this.patch({
        facingMode: nextFacing,
        localStream: new MediaStream(this.localStream.getTracks()),
      });
    } catch {
      this.patch({ statusNote: 'Solo hay una cámara disponible en este dispositivo.' });
    }
  }

  public async toggleScreenShare(): Promise<void> {
    const pc = this.getActivePeerConnection();
    if (!pc || !this.localStream) return;
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
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
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
    this.releaseWakeLock();

    if (this.activeMediaConn) {
      try {
        this.activeMediaConn.close();
      } catch {
        // ignore
      }
      this.activeMediaConn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    if (this.manualPc) {
      try {
        this.manualPc.close();
      } catch {
        // ignore
      }
      this.manualPc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

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
