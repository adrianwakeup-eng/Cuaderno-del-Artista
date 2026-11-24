import React, { useEffect, useRef, useState } from 'react';
import {
  BookPlus,
  Check,
  Copy,
  Download,
  FileText,
  Film,
  Heart,
  ImagePlus,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneOff,
  ScreenShare,
  Send,
  SwitchCamera,
  Trash2,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import {
  DEFAULT_COMMUNITY_MEMBERS,
  deleteCommunityPost,
  formatFileSize,
  getCommunityAttachmentBlob,
  loadCommunityPosts,
  loadMyCommunityProfile,
  saveCommunityPost,
  saveMyCommunityProfile,
  type CommunityAttachmentMeta,
  type CommunityMember,
  type CommunityPost,
} from '../utils/communityStorage';
import {
  atelierCallEngine,
  type CallMode,
  type CallSnapshot,
} from '../utils/webrtcCallEngine';

interface CommunityHubViewProps {
  onPinPhotoToNotebook?: (dataUrl: string, title: string) => void;
  onNotify?: (msg: string) => void;
  onReturnToNotebook?: () => void;
}

interface PendingDraftAttachment {
  id: string;
  kind: 'image' | 'video' | 'file';
  name: string;
  mimeType: string;
  sizeBytes: number;
  file: File;
  previewUrl: string;
}

function formatCallDuration(startedAtMs: number | null, nowMs: number): string {
  if (!startedAtMs) return '00:00';
  const totalSec = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatRelativeTime(ts: number): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr} h`;
  return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({
  onPinPhotoToNotebook,
  onNotify,
  onReturnToNotebook,
}) => {
  const [profile, setProfile] = useState(() => loadMyCommunityProfile());
  const [editingProfile, setEditingProfile] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>(DEFAULT_COMMUNITY_MEMBERS);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Publications state
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [draftText, setDraftText] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<PendingDraftAttachment[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  // Live Audio/Video Call state
  const [callSnap, setCallSnap] = useState<CallSnapshot>(() => atelierCallEngine.getSnapshot());
  const [joinInput, setJoinInput] = useState('');
  const [manualAnswerInput, setManualAnswerInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [showJoinBox, setShowJoinBox] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    void loadCommunityPosts().then(({ posts: loaded, blobUrls: urls }) => {
      if (!alive) return;
      setPosts(loaded);
      setBlobUrls(urls);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return atelierCallEngine.subscribe(setCallSnap);
  }, []);

  useEffect(() => {
    if (callSnap.status !== 'connected' || !callSnap.startedAtMs) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [callSnap.status, callSnap.startedAtMs]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = callSnap.localStream;
      if (callSnap.localStream) {
        void localVideoRef.current.play().catch(() => {});
      }
    }
  }, [callSnap.localStream, callSnap.status, callSnap.mode]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callSnap.remoteStream;
      if (callSnap.remoteStream) {
        void remoteVideoRef.current.play().catch(() => {});
      }
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = callSnap.remoteStream;
      if (callSnap.remoteStream) {
        void remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [callSnap.remoteStream, callSnap.status, callSnap.mode]);

  const handleSelectMediaFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const added: PendingDraftAttachment[] = files.map((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: isVideo ? 'video' : isImage ? 'image' : 'file',
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
    audioEngine.playStitchClick();
    setDraftAttachments((prev) => [...prev, ...added]);
  };

  const handleSelectGenericFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const added: PendingDraftAttachment[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'file',
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    audioEngine.playStitchClick();
    setDraftAttachments((prev) => [...prev, ...added]);
  };

  const handleRemoveDraftAttachment = (id: string) => {
    setDraftAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handlePublishPost = async () => {
    const text = draftText.trim();
    if (!text && draftAttachments.length === 0) {
      onNotify?.('Escribe un mensaje o adjunta una foto, video o archivo.');
      return;
    }
    setPublishing(true);
    audioEngine.playSaveChime();

    const attachmentsMeta: CommunityAttachmentMeta[] = draftAttachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
    }));

    const newPost: CommunityPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: profile.name,
      authorRole: profile.role,
      text,
      createdAt: Date.now(),
      attachments: attachmentsMeta,
      likes: 0,
      likedByMe: false,
      comments: [],
    };

    const newUrls: Record<string, string> = {};
    const blobsToStore: Array<{ id: string; blob: Blob }> = [];
    for (const a of draftAttachments) {
      newUrls[a.id] = a.previewUrl;
      blobsToStore.push({ id: a.id, blob: a.file });
    }

    setBlobUrls((prev) => ({ ...prev, ...newUrls }));
    setPosts((prev) => [newPost, ...prev]);
    setDraftText('');
    setDraftAttachments([]);
    setPublishing(false);

    await saveCommunityPost(newPost, blobsToStore);
    onNotify?.('Publicación compartida en el taller.');
  };

  const handleToggleLike = (post: CommunityPost) => {
    audioEngine.playYarnPluck(4);
    const updated: CommunityPost = {
      ...post,
      likedByMe: !post.likedByMe,
      likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)),
    };
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    void saveCommunityPost(updated);
  };

  const handleAddComment = (post: CommunityPost) => {
    const text = (commentDrafts[post.id] || '').trim();
    if (!text) return;
    audioEngine.playStitchClick();
    const updated: CommunityPost = {
      ...post,
      comments: [
        ...post.comments,
        {
          id: `c-${Date.now()}`,
          authorName: profile.name,
          text,
          createdAt: Date.now(),
        },
      ],
    };
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
    setExpandedComments((prev) => ({ ...prev, [post.id]: true }));
    void saveCommunityPost(updated);
  };

  const handleDeletePost = (post: CommunityPost) => {
    audioEngine.playStitchClick();
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    void deleteCommunityPost(post);
    onNotify?.('Publicación eliminada.');
  };

  const handleDownloadAttachment = async (att: CommunityAttachmentMeta) => {
    audioEngine.playSaveChime();
    const blob = await getCommunityAttachmentBlob(att.id);
    const url = blob ? URL.createObjectURL(blob) : blobUrls[att.id] || att.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (blob) window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    onNotify?.(`Descargando ${att.name}`);
  };

  const handlePinImageToNotebook = async (att: CommunityAttachmentMeta) => {
    if (!onPinPhotoToNotebook) return;
    const url = blobUrls[att.id] || att.url;
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onPinPhotoToNotebook(reader.result, att.name);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      onPinPhotoToNotebook(url, att.name);
    }
  };

  const handleStartCall = (mode: CallMode, targetName?: string) => {
    audioEngine.playToggleChime(true);
    void atelierCallEngine.startCallRoom(mode, targetName || profile.name);
  };

  const handleCopyCallCode = async () => {
    const payload =
      callSnap.signalingMode === 'p2p-manual' && callSnap.manualLocalToken
        ? callSnap.manualLocalToken
        : callSnap.roomCode;
    if (!payload) return;

    // On Android / Samsung Galaxy Note 9, also offer native Share sheet (WhatsApp, Telegram, SMS) if available
    const shareText =
      callSnap.signalingMode === 'p2p-manual'
        ? payload
        : `Únete a mi ${callSnap.mode === 'video' ? 'videollamada' : 'llamada'} en Cuaderno del Artista. Código de sala: ${callSnap.roomCode}`;

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // ignore
    }
    try {
      if (typeof navigator.share === 'function' && /Android/i.test(navigator.userAgent)) {
        await navigator.share({
          title: 'Llamada en Cuaderno del Artista',
          text: shareText,
        });
      }
    } catch {
      // user dismissed Android share sheet — code is already copied!
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
    onNotify?.(
      callSnap.signalingMode === 'p2p-manual'
        ? 'Código de invitación P2P copiado.'
        : `Código de sala ${callSnap.roomCode} copiado.`
    );
  };

  const handleAddMember = () => {
    const clean = newMemberName.trim();
    if (!clean) return;
    const palette = ['#b8732a', '#2b7a57', '#265c94', '#8f2d49', '#6e4296'];
    setMembers((prev) => [
      {
        id: `mem-${Date.now()}`,
        name: clean,
        role: 'Integrante Invitado',
        specialty: 'Crochet y Diseño',
        status: 'online',
        avatarColor: palette[prev.length % palette.length],
      },
      ...prev,
    ]);
    setNewMemberName('');
    setShowAddMember(false);
    audioEngine.playYarnPluck(5);
    onNotify?.(`${clean} añadido a los integrantes.`);
  };

  const isCallActive = callSnap.status !== 'idle' && callSnap.status !== 'ended';

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-3 sm:p-5 pb-24 lg:pb-6 safe-top bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.48)_0%,rgba(22,11,5,0.96)_85%)]">
      {/* Hidden native pickers for Photo/Video & Files */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleSelectMediaFiles}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.json,.zip,.mp3,.wav,.svg,.png,.jpg,.jpeg,.webp,.xlsx,.csv,*/*"
        multiple
        onChange={handleSelectGenericFiles}
        className="hidden"
      />

      <div className="max-w-6xl mx-auto space-y-4">
        {/* TOP HEADER BAR */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#b98241]/35">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl text-[#f9e4bc] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#f2c464] shrink-0" />
              <span className="truncate">Comunidad del Taller · Llamadas y Publicaciones</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#d6b688]">
              Conversa por audio y video en vivo con los integrantes y comparte fotos, videos o archivos de crochet
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleStartCall('audio')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#2b7a54] to-[#1a5237] hover:brightness-110 border border-[#8ce0b3]/60 text-xs font-semibold text-white shadow cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Llamada Audio</span>
            </button>
            <button
              type="button"
              onClick={() => handleStartCall('video')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 border border-[#ffe4a6]/70 text-xs font-semibold text-white shadow cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videollamada</span>
            </button>
            <button
              type="button"
              onClick={() => setShowJoinBox((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#341c0d] hover:bg-[#4b2914] border border-[#c8964f]/55 text-xs font-medium text-[#ffebc2] cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#f3c668]" />
              <span>Unirse</span>
            </button>
            {onReturnToNotebook && (
              <button
                type="button"
                onClick={onReturnToNotebook}
                className="px-3 py-1.5 rounded-xl bg-[#241208] hover:bg-[#3a1f0f] border border-[#b98241]/45 text-xs text-[#e8cfab] cursor-pointer"
              >
                Volver
              </button>
            )}
          </div>
        </header>

        {/* JOIN EXISTING ROOM BAR */}
        {showJoinBox && (
          <div className="rounded-2xl leather-panel bg-[#241208]/95 border border-[#d6a25e]/55 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-xl">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Pega el código de sala (ej. A4K9P2) o código de invitación P2P..."
              className="flex-1 rounded-xl bg-[#150a04] border border-[#b98241]/50 px-3 py-2 text-xs text-[#fae8c7] placeholder:text-[#9c784d] focus:outline-none focus:border-[#f0c06c]"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  void atelierCallEngine.joinCall(joinInput, 'audio', profile.name);
                  setShowJoinBox(false);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#256b49] hover:bg-[#2f8259] text-xs font-semibold text-white cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Entrar Audio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void atelierCallEngine.joinCall(joinInput, 'video', profile.name);
                  setShowJoinBox(false);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-semibold text-white cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Entrar Video</span>
              </button>
            </div>
          </div>
        )}

        {/* LIVE AUDIO / VIDEO CALL STAGE */}
        {isCallActive && (
          <section className="rounded-2xl border-2 border-[#e3b361]/80 bg-gradient-to-b from-[#231107] via-[#190c05] to-[#120803] p-3 sm:p-4 shadow-[0_18px_46px_rgba(0,0,0,0.72)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse" />
                <h3 className="font-display text-sm sm:text-base text-[#ffebc2]">
                  {callSnap.mode === 'video' ? 'Videollamada del Taller' : 'Llamada de Audio del Taller'} ·{' '}
                  <span className="font-mono-tab text-[#f5cb75]">{callSnap.roomCode}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#3d210d] border border-[#d6a25e]/45 text-[10px] font-mono-tab text-[#fae4b7]">
                  {formatCallDuration(callSnap.startedAtMs, nowTick)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleCopyCallCode()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3a1f0e] hover:bg-[#522c15] border border-[#e3b361]/55 text-[11px] font-semibold text-[#ffebc2] cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#86efac]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#f4c668]" />
                    <span>
                      {callSnap.signalingMode === 'p2p-manual'
                        ? 'Copiar código de invitación'
                        : `Copiar sala ${callSnap.roomCode}`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {callSnap.statusNote && (
              <p className="text-xs text-[#e4c694] bg-[#2a1509]/85 border border-[#b98241]/30 rounded-lg px-3 py-1.5">
                {callSnap.statusNote}
              </p>
            )}

            {/* Video Canvas OR Warm Audio Call Visualizer */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            {callSnap.mode === 'video' ? (
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[420px] rounded-xl overflow-hidden bg-[#0e0703] border border-[#c8964f]/45">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {callSnap.status !== 'connected' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#140a04]/75">
                    <Video className="w-10 h-10 text-[#f3c668] mb-2 animate-pulse" />
                    <p className="font-editorial text-base text-[#ffebc2]">
                      Esperando a que el integrante se una a la sala {callSnap.roomCode}
                    </p>
                    <p className="text-[11px] text-[#cfa770] mt-1">
                      Tu cámara ya está activa en la esquina inferior
                    </p>
                  </div>
                )}

                {/* Picture-in-Picture Local Camera */}
                <div className="absolute right-2.5 bottom-2.5 w-28 sm:w-40 aspect-[3/4] sm:aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#f2c464] bg-[#1a0d05] shadow-2xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${
                      callSnap.facingMode === 'user' ? '-scale-x-100' : ''
                    } ${callSnap.cameraOff ? 'opacity-20' : 'opacity-100'}`}
                  />
                  {callSnap.cameraOff && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#f5ddb2]">
                      Cámara apagada
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[radial-gradient(circle_at_center,rgba(145,92,34,0.35),rgba(18,9,4,0.95))] border border-[#c8964f]/45 py-8 px-4 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#d1974c] to-[#874d19] border-2 border-[#ffe5a8] flex items-center justify-center shadow-[0_0_32px_rgba(245,198,104,0.45)] animate-pulse">
                  <PhoneCall className="w-9 h-9 text-white" />
                </div>
                <div>
                  <p className="font-display text-base text-[#fff1ce]">{callSnap.peerName}</p>
                  <p className="text-xs text-[#d9b885]">
                    {callSnap.status === 'connected'
                      ? 'Conversación de audio en vivo activa'
                      : `Esperando conexión en sala ${callSnap.roomCode}...`}
                  </p>
                </div>
              </div>
            )}

            {/* Zero-server P2P Manual Answer Box (only shown when Firestore signaling fell back to P2P token) */}
            {callSnap.signalingMode === 'p2p-manual' && callSnap.status === 'waiting' && (
              <div className="rounded-xl bg-[#1a0d05] border border-[#b98241]/40 p-2.5 space-y-2">
                <p className="text-[11px] text-[#e7c792]">
                  Cuando el otro integrante te envíe su código de respuesta, pégalo aquí para enlazar audio y video:
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={manualAnswerInput}
                    onChange={(e) => setManualAnswerInput(e.target.value)}
                    placeholder="Pegar código de respuesta del integrante..."
                    className="flex-1 rounded-lg bg-[#110803] border border-[#b98241]/45 px-2.5 py-1.5 text-[11px] text-[#fae8c7]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void atelierCallEngine.applyManualAnswerToken(manualAnswerInput);
                      setManualAnswerInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2b7a54] text-xs font-semibold text-white cursor-pointer"
                  >
                    Conectar
                  </button>
                </div>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => atelierCallEngine.toggleMic()}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                  callSnap.micMuted
                    ? 'bg-[#7a202a] border-[#f498a2] text-white'
                    : 'bg-[#361d0e] border-[#c8964f]/60 text-[#ffebc2] hover:bg-[#4e2a14]'
                }`}
              >
                {callSnap.micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{callSnap.micMuted ? 'Silenciado' : 'Micrófono'}</span>
              </button>

              {callSnap.mode === 'video' && (
                <>
                  <button
                    type="button"
                    onClick={() => atelierCallEngine.toggleCamera()}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                      callSnap.cameraOff
                        ? 'bg-[#7a202a] border-[#f498a2] text-white'
                        : 'bg-[#361d0e] border-[#c8964f]/60 text-[#ffebc2] hover:bg-[#4e2a14]'
                    }`}
                  >
                    {callSnap.cameraOff ? (
                      <VideoOff className="w-4 h-4" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                    <span>{callSnap.cameraOff ? 'Cámara Off' : 'Cámara'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void atelierCallEngine.switchCamera()}
                    title="Cambiar entre cámara frontal y trasera (ideal para mostrar tus tejidos en celular)"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold bg-[#361d0e] hover:bg-[#4e2a14] border border-[#c8964f]/60 text-[#ffebc2] cursor-pointer"
                  >
                    <SwitchCamera className="w-4 h-4" />
                    <span className="hidden sm:inline">Voltear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void atelierCallEngine.toggleScreenShare()}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold bg-[#361d0e] hover:bg-[#4e2a14] border border-[#c8964f]/60 text-[#ffebc2] cursor-pointer"
                  >
                    <ScreenShare className="w-4 h-4" />
                    <span>{callSnap.screenSharing ? 'Dejar pantalla' : 'Pantalla'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  audioEngine.playToggleChime(false);
                  atelierCallEngine.endCall();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#b91c1c] hover:bg-[#dc2626] border border-[#fca5a5]/70 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Colgar</span>
              </button>
            </div>
          </section>
        )}

        {/* MAIN 2-COLUMN BODY: Publications Feed (Left/Main) + Members Call Directory (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* PUBLICATIONS COMPOSER + FEED */}
          <div className="lg:col-span-8 space-y-4">
            {/* RICH PUBLICATION COMPOSER */}
            <section className="rounded-2xl parchment-page border-2 border-[#b48344]/80 p-3.5 sm:p-4 text-[#3e200d] shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-b from-[#c98a36] to-[#874d19] text-white font-display font-bold flex items-center justify-center shrink-0 shadow">
                    {profile.name.slice(0, 1).toUpperCase()}
                  </span>
                  {editingProfile ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Tu nombre"
                        className="px-2 py-1 rounded-lg bg-white/85 border border-[#b48344]/60 text-xs font-semibold text-[#3a1c0a]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          saveMyCommunityProfile(profile.name, profile.role);
                          setEditingProfile(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#6e3a16] text-[11px] font-semibold text-white cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      title="Toca para editar tu nombre de integrante"
                      className="text-left min-w-0 cursor-pointer"
                    >
                      <p className="font-editorial text-sm font-bold text-[#451f0a] truncate">
                        {profile.name}
                      </p>
                      <p className="text-[10.5px] text-[#7c4d27] truncate">
                        {profile.role} · Toca para cambiar nombre
                      </p>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={3}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Publica tus avances de crochet, comparte un video tutorial, patrón en PDF o archivo con los integrantes..."
                className="w-full resize-none rounded-xl bg-[#fffaf0]/90 border border-[#b8894c]/55 p-3 text-sm text-[#351908] placeholder:text-[#8f6841] focus:outline-none focus:border-[#8f4c1a]"
              />

              {/* Pending Attachments Preview */}
              {draftAttachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {draftAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="relative rounded-xl border border-[#b8894c]/55 bg-[#fff7e7] overflow-hidden p-1.5 flex flex-col gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftAttachment(att.id)}
                        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-[#3a1808]/90 text-white cursor-pointer"
                        aria-label="Quitar adjunto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {att.kind === 'image' && (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      {att.kind === 'video' && (
                        <video
                          src={att.previewUrl}
                          muted
                          playsInline
                          className="w-full h-24 object-cover rounded-lg bg-black"
                        />
                      )}
                      {att.kind === 'file' && (
                        <div className="h-24 rounded-lg bg-[#f3e2be] flex flex-col items-center justify-center p-2 text-center">
                          <FileText className="w-7 h-7 text-[#8c4f1d]" />
                          <span className="text-[10px] font-semibold text-[#4a230b] line-clamp-2 mt-1">
                            {att.name}
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-[#784b26] truncate">
                        {att.name} · {formatFileSize(att.sizeBytes)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* COMPOSER ACTION BAR: Add Photo/Video + Upload File + Publish */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#b8894c]/35">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f1dfb9] hover:bg-[#e7cc98] border border-[#b88442]/65 text-xs font-semibold text-[#4a220d] cursor-pointer shadow-xs"
                  >
                    <ImagePlus className="w-4 h-4 text-[#9a551c]" />
                    <Film className="w-3.5 h-3.5 text-[#7a202a] -ml-1" />
                    <span>Añadir Foto / Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f1dfb9] hover:bg-[#e7cc98] border border-[#b88442]/65 text-xs font-semibold text-[#4a220d] cursor-pointer shadow-xs"
                  >
                    <Paperclip className="w-4 h-4 text-[#285a8f]" />
                    <span>Subir Archivo</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => void handlePublishPost()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-105 text-xs font-bold text-white shadow cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Publicando...' : 'Publicar'}</span>
                </button>
              </div>
            </section>

            {/* PUBLICATIONS FEED */}
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl parchment-page border-2 border-[#a87842]/70 p-3.5 sm:p-4 text-[#3e200d] shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-gradient-to-b from-[#8b4c1d] to-[#54290c] text-[#ffefc8] font-display font-bold flex items-center justify-center shrink-0">
                        {post.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-editorial text-base font-bold text-[#451f0a] truncate">
                          {post.authorName}
                        </h3>
                        <p className="text-[11px] text-[#7c4d27]">
                          {post.authorRole} · {formatRelativeTime(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePost(post)}
                      title="Eliminar publicación"
                      className="p-1.5 rounded-lg text-[#7c2029]/75 hover:bg-[#f2cece]/60 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {post.text && (
                    <p className="text-sm leading-relaxed text-[#381c0b] whitespace-pre-wrap">
                      {post.text}
                    </p>
                  )}

                  {/* Published Photos, Videos & Files */}
                  {post.attachments.length > 0 && (
                    <div className="space-y-2.5">
                      {/* Images & Videos Grid */}
                      {post.attachments.some((a) => a.kind === 'image' || a.kind === 'video') && (
                        <div
                          className={`grid gap-2 ${
                            post.attachments.filter((a) => a.kind !== 'file').length > 1
                              ? 'grid-cols-1 sm:grid-cols-2'
                              : 'grid-cols-1'
                          }`}
                        >
                          {post.attachments
                            .filter((a) => a.kind === 'image' || a.kind === 'video')
                            .map((att) => {
                              const mediaUrl = blobUrls[att.id] || att.url || '';
                              if (!mediaUrl) return null;
                              if (att.kind === 'video') {
                                return (
                                  <div
                                    key={att.id}
                                    className="rounded-xl overflow-hidden bg-black border border-[#a87842]/50"
                                  >
                                    <video
                                      src={mediaUrl}
                                      controls
                                      playsInline
                                      className="w-full max-h-[360px] object-contain"
                                    />
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={att.id}
                                  className="relative group rounded-xl overflow-hidden bg-[#241309]/10 border border-[#a87842]/50"
                                >
                                  <img
                                    src={mediaUrl}
                                    alt={att.name}
                                    onClick={() => setLightboxImage({ url: mediaUrl, name: att.name })}
                                    className="w-full max-h-[380px] object-contain cursor-zoom-in bg-[#fbf1db]"
                                  />
                                  {onPinPhotoToNotebook && (
                                    <button
                                      type="button"
                                      onClick={() => void handlePinImageToNotebook(att)}
                                      className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#381b0b]/90 hover:bg-[#592b12] border border-[#f2c464]/70 text-[11px] font-semibold text-[#fff1ce] shadow cursor-pointer"
                                    >
                                      <BookPlus className="w-3.5 h-3.5" />
                                      <span>Pegar en Cuaderno</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Uploaded Generic Files List (PDF, Patterns, MP3, ZIP, etc.) */}
                      {post.attachments
                        .filter((a) => a.kind === 'file')
                        .map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#f5e6c5] border border-[#b88645]/55"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-9 h-9 rounded-lg bg-[#7a3f16] text-[#ffebc2] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#421e0a] truncate">
                                  {att.name}
                                </p>
                                <p className="text-[10.5px] text-[#7c4d27]">
                                  Archivo adjunto · {formatFileSize(att.sizeBytes)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleDownloadAttachment(att)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[11px] font-semibold text-white shrink-0 cursor-pointer shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Like & Comment Footer */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[#b8894c]/30 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                        post.likedByMe
                          ? 'bg-[#7a202a] text-white font-semibold'
                          : 'bg-[#f1dfb9] hover:bg-[#e7cc98] text-[#4a220d]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f1dfb9] hover:bg-[#e7cc98] text-[#4a220d] cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Comentarios ({post.comments.length})</span>
                    </button>
                  </div>

                  {/* Comments Thread */}
                  {(expandedComments[post.id] || post.comments.length > 0) && (
                    <div className="space-y-2 pt-1">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl bg-[#fff8e9]/85 border border-[#c89d60]/35 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#4b230c]">{c.authorName}</span>
                            <span className="text-[10px] text-[#8a5d33]">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-[#3c1e0c] mt-0.5">{c.text}</p>
                        </div>
                      ))}

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post);
                          }}
                          placeholder="Escribe un comentario..."
                          className="flex-1 rounded-lg bg-white/85 border border-[#b8894c]/50 px-2.5 py-1.5 text-xs text-[#381c0b] focus:outline-none focus:border-[#8f4c1a]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post)}
                          className="px-3 py-1.5 rounded-lg bg-[#6e3a16] hover:bg-[#8a4a1e] text-xs font-semibold text-white cursor-pointer"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: INTEGRANTES DEL TALLER WITH 1-CLICK AUDIO & VIDEO CALL */}
          <aside className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl leather-panel bg-[#241208]/95 border border-[#c8964f]/55 p-3.5 text-[#f6e4c4] shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#b98241]/30 pb-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#ffebc2]">
                    Integrantes del Taller ({members.length})
                  </h3>
                  <p className="text-[10.5px] text-[#d6b688]">
                    Toca 📞 o 📹 para llamar por audio o video
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMember((v) => !v)}
                  title="Añadir integrante"
                  className="p-1.5 rounded-lg bg-[#3c200e] hover:bg-[#522d17] border border-[#c8964f]/50 text-[#ffebc2] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {showAddMember && (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddMember();
                    }}
                    placeholder="Nombre del integrante..."
                    className="flex-1 rounded-lg bg-[#150a04] border border-[#b98241]/45 px-2.5 py-1.5 text-xs text-[#fae8c7]"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2.5 py-1.5 rounded-lg bg-[#c78b36] text-xs font-semibold text-white cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#190c05]/90 border border-[#b98241]/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <span
                          style={{ backgroundColor: member.avatarColor }}
                          className="w-9 h-9 rounded-full text-white font-display font-bold flex items-center justify-center border border-[#ffe4a6]/70 shadow"
                        >
                          {member.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span
                          className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border border-[#190c05] ${
                            member.status === 'online'
                              ? 'bg-[#4ade80]'
                              : member.status === 'crafting'
                                ? 'bg-[#fbbf24]'
                                : 'bg-[#94a3b8]'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#ffebc2] truncate">{member.name}</p>
                        <p className="text-[10px] text-[#cfa770] truncate">{member.specialty}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartCall('audio', member.name)}
                        title={`Llamada de audio con ${member.name}`}
                        className="p-2 rounded-lg bg-[#236344] hover:bg-[#2d7f57] text-white cursor-pointer shadow"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartCall('video', member.name)}
                        title={`Videollamada con ${member.name}`}
                        className="p-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-white cursor-pointer shadow"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-[#7a202a] text-white shadow-xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
