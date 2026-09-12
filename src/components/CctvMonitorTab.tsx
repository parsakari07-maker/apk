import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Camera,
  Flashlight,
  RefreshCw,
  EyeOff,
  Eye,
  Volume2,
  VolumeX,
  Play,
  Square,
  ZoomIn,
  Radio,
  Cast,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Zap,
  Sparkles
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';

interface CctvMonitorTabProps {
  peers: PeerDevice[];
  profile: UserProfile;
  isDark?: boolean;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
  onToggleAutoAccept?: () => void;
  onNavigateTab?: (tab: 'radar' | 'walkie' | 'cctv' | 'chat' | 'screen' | 'settings') => void;
}

interface RemoteCameraState {
  torch: boolean;
  facing: 'back' | 'front';
  stealth: boolean;
  muted: boolean;
  zoom: number;
}

export const CctvMonitorTab: React.FC<CctvMonitorTabProps> = ({
  peers,
  profile,
  isDark = true,
  isStreaming: externalIsStreaming,
  onToggleStreaming,
  onNavigateTab,
}) => {
  // Local broadcast state
  const [internalIsStreaming, setInternalIsStreaming] = useState(false);
  const isStreaming = externalIsStreaming !== undefined ? externalIsStreaming : internalIsStreaming;

  // Selected camera feed being viewed in the monitor
  // Can be a peer's ID or 'my-camera'
  const defaultCameraId = peers.length > 0 ? peers[0].id : 'my-camera';
  const [selectedCameraId, setSelectedCameraId] = useState<string>(defaultCameraId);

  // Per-camera live state (allows any viewer to control the camera)
  const [cameraStates, setCameraStates] = useState<Record<string, RemoteCameraState>>({
    'my-camera': { torch: false, facing: 'back', stealth: false, muted: false, zoom: 1 },
  });

  // Action toast when a command is sent or received
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Timecode and real-time stats
  const [timecode, setTimecode] = useState('');
  const [bitrate, setBitrate] = useState('3.8');

  // Video element and local media stream for 'my-camera'
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Auto-switch to my-camera if peers list becomes empty
  useEffect(() => {
    if (selectedCameraId !== 'my-camera' && !peers.some((p) => p.id === selectedCameraId)) {
      setSelectedCameraId('my-camera');
    }
  }, [peers, selectedCameraId]);

  // Selected camera current state
  const currentCameraState = cameraStates[selectedCameraId] || {
    torch: false,
    facing: 'back',
    stealth: false,
    muted: false,
    zoom: 1,
  };

  // Find info about selected camera
  const isViewingMyCamera = selectedCameraId === 'my-camera';
  const selectedPeer = peers.find((p) => p.id === selectedCameraId);
  const cameraOwnerName = isViewingMyCamera
    ? `گوشی من (${profile.username})`
    : selectedPeer
    ? selectedPeer.name
    : 'دوربین زنده';

  // Live timer for timecode
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimecode(
        now.toISOString().slice(11, 19) + '.' + String(Math.floor(now.getMilliseconds() / 100))
      );
      setBitrate((3.6 + Math.random() * 0.4).toFixed(1));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Update camera feed when viewing own camera and streaming
  useEffect(() => {
    if (isViewingMyCamera && isStreaming) {
      startLocalCamera();
    } else {
      stopLocalCamera();
    }
    return () => {
      stopLocalCamera();
    };
  }, [isViewingMyCamera, isStreaming, currentCameraState.facing]);

  const startLocalCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCameraState.facing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: !currentCameraState.muted,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera permission or device error:', err);
      const errorMsg =
        err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
          ? 'دسترسی به دوربین توسط کاربر یا سیستم رد شد. لطفاً مجوز دوربین را تأیید کنید.'
          : 'امکان اتصال به سخت‌افزار دوربین وجود ندارد یا دوربین در حال استفاده در برنامه دیگری است.';
      setCameraError(errorMsg);
    }
  };

  const stopLocalCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraError(null);
  };

  // Show quick toast notification
  const showFeedback = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => {
      setActionFeedback((prev) => (prev === text ? null : prev));
    }, 3000);
  };

  // Direct camera controls available to all members watching
  const handleToggleTorch = async () => {
    const nextVal = !currentCameraState.torch;
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        torch: nextVal,
      },
    }));

    // If controlling local camera, apply torch to real video track
    if (isViewingMyCamera && mediaStreamRef.current) {
      try {
        const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as { torch?: boolean };
          if (capabilities && capabilities.torch) {
            await (videoTrack as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
              advanced: [{ torch: nextVal }],
            });
          }
        }
      } catch (err) {
        console.warn('Torch constraint not supported on this track:', err);
      }
    }

    showFeedback(
      nextVal
        ? `چراغ‌قوه دوربین ${cameraOwnerName} روشن شد`
        : `چراغ‌قوه دوربین ${cameraOwnerName} خاموش شد`
    );
  };

  const handleToggleFacing = () => {
    const nextFacing = currentCameraState.facing === 'back' ? 'front' : 'back';
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        facing: nextFacing,
      },
    }));
    showFeedback(
      nextFacing === 'back'
        ? `لنز دوربین ${cameraOwnerName} به دوربین پشت تغییر یافت`
        : `لنز دوربین ${cameraOwnerName} به دوربین جلو (سلفی) تغییر یافت`
    );
  };

  const handleToggleStealth = () => {
    const nextVal = !currentCameraState.stealth;
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        stealth: nextVal,
      },
    }));
    showFeedback(
      nextVal
        ? `حالت استتار در دستگاه ${cameraOwnerName} فعال شد (صفحه‌نمایش خاموش)`
        : `حالت استتار در دستگاه ${cameraOwnerName} غیرفعال شد`
    );
  };

  const handleToggleMute = () => {
    const nextMuted = !currentCameraState.muted;
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        muted: nextMuted,
      },
    }));
    showFeedback(nextMuted ? 'صدای محیط قطع شد' : 'صدای محیط متصل شد');
  };

  const handleToggleZoom = () => {
    const nextZoom = currentCameraState.zoom === 1 ? 2 : currentCameraState.zoom === 2 ? 3 : 1;
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        zoom: nextZoom,
      },
    }));
    showFeedback(`بزرگ‌نمایی: ${nextZoom}x`);
  };

  const handleToggleMyBroadcast = () => {
    if (onToggleStreaming) {
      onToggleStreaming();
    } else {
      setInternalIsStreaming((prev) => !prev);
    }
    if (!isStreaming) {
      setSelectedCameraId('my-camera');
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col p-3 space-y-3 select-none overflow-y-auto transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* 1. Header Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold flex items-center gap-1.5">
              <span>دوربین مداربسته (CCTV Monitor)</span>
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-[#00F59B]/15 text-[#00F59B] px-2 py-0.5 rounded-full font-mono font-bold border border-[#00F59B]/30">
                1080p • 30FPS
              </span>
              <span className="text-[10px] bg-[#4CC9F0]/15 text-[#4CC9F0] px-2 py-0.5 rounded-full font-mono font-bold border border-[#4CC9F0]/30">
                ۱۶~ ms
              </span>
            </div>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            مشاهده زنده تصویر دوربین‌ها و کنترل لحظه‌ای تمام امکانات
          </p>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-[#00F59B]/15 border border-[#00F59B]/30 flex items-center justify-center text-[#00F59B]">
          <Video className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Active Camera Feeds Selector */}
      <div
        className={`p-2.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">
          انتخاب دوربین:
        </span>

        {/* Remote Peers Cameras */}
        {peers.map((peer) => {
          const isSelected = selectedCameraId === peer.id;
          const pState = cameraStates[peer.id] || { torch: false, facing: 'back' };
          return (
            <button
              key={peer.id}
              onClick={() => setSelectedCameraId(peer.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00F59B] text-[#111318] border-[#00F59B] shadow-md shadow-[#00F59B]/20'
                  : isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-slate-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSelected ? 'bg-[#111318] animate-ping' : 'bg-[#00F59B]'
                }`}
              />
              <span>{peer.name}</span>
              {pState.torch && (
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </button>
          );
        })}

        {/* My Own Camera Feed */}
        <button
          onClick={() => setSelectedCameraId('my-camera')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shrink-0 transition-all cursor-pointer ${
            selectedCameraId === 'my-camera'
              ? 'bg-[#00F59B] text-[#111318] border-[#00F59B] shadow-md shadow-[#00F59B]/20'
              : isDark
              ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-slate-600'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>دوربین من</span>
          {isStreaming && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Main Live Camera Viewer & Tactical Control Bar */}
      <div
        className={`p-4 rounded-2xl border shadow-lg space-y-3 shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-extrabold text-white">
              در حال پخش زنده: {cameraOwnerName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
              LIVE
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {timecode || '12:00:00.0'}
            </span>
          </div>
        </div>

        {/* Viewfinder Canvas */}
        <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#0A0C10] border border-[#262C38] flex flex-col items-center justify-center">
          {/* Torch Light Glow Effect over feed when torch is active */}
          {currentCameraState.torch && (
            <div className="absolute inset-0 bg-radial from-amber-400/25 via-amber-300/10 to-transparent pointer-events-none z-10 animate-pulse" />
          )}

          {/* Video Stream: either getUserMedia for my camera or high-definition camera viewport */}
          {isViewingMyCamera ? (
            cameraError ? (
              <div className="flex flex-col items-center justify-center p-5 text-center z-20 max-w-sm space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-1">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-red-300">خطای دسترسی به دوربین</div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{cameraError}</p>
                <button
                  onClick={startLocalCamera}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  درخواست مجدد دسترسی دوربین
                </button>
              </div>
            ) : isStreaming ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
                  currentCameraState.facing === 'front' ? 'scale-x-[-1]' : ''
                }`}
                style={{
                  transform: `scale(${currentCameraState.zoom}) ${
                    currentCameraState.facing === 'front' ? 'scaleX(-1)' : ''
                  }`,
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center z-20">
                <div className="w-12 h-12 rounded-2xl bg-[#141A26] border border-[#262C38] flex items-center justify-center text-[#00F59B] mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-white">دوربین گوشی شما خاموش است</div>
                <button
                  onClick={handleToggleMyBroadcast}
                  className="mt-2.5 px-4 py-1.5 rounded-xl bg-[#00F59B] text-[#111318] text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#00F59B]/25 hover:bg-[#00F59B]/90 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>شروع اشتراک دوربین من</span>
                </button>
              </div>
            )
          ) : (
            /* Remote Peer's Camera Stream Viewport */
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                currentCameraState.stealth
                  ? 'bg-black'
                  : 'bg-gradient-to-tr from-[#0F141F] via-[#141C2B] to-[#0A0D14]'
              }`}
            >
              {/* Synthetic Real-time Surveillance Canvas Graphic */}
              {!currentCameraState.stealth && (
                <div
                  className="absolute inset-0 opacity-70 transition-transform duration-300 flex items-center justify-center"
                  style={{ transform: `scale(${currentCameraState.zoom})` }}
                >
                  <div className="w-full h-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 border border-[#00F59B]/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#00F59B] rounded-full shadow-lg shadow-[#00F59B] animate-ping" />
                    </div>
                  </div>
                </div>
              )}

              {/* Stealth Alert */}
              {currentCameraState.stealth && (
                <div className="text-center p-4 z-20">
                  <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span>حالت استتار فعال است (نمایشگر دستگاه مقصد خاموش است)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Viewfinder Tactical HUD Overlays */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none z-10">
            {/* Top HUD Badges */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400 font-bold">REC</span>
                <span>{cameraOwnerName}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-emerald-400">
                <span>1080p</span>
                <span>•</span>
                <span>30fps</span>
                <span>•</span>
                <span className="text-[#4CC9F0]">{bitrate} Mbps</span>
              </div>
            </div>

            {/* Bottom HUD Badges */}
            <div className="flex items-center justify-between text-[10px] text-white/90">
              <div className="flex items-center gap-2">
                <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
                  <span>لنز:</span>
                  <span className="text-[#00F59B] font-bold">
                    {currentCameraState.facing === 'back' ? 'پشت' : 'جلو'}
                  </span>
                </span>

                {currentCameraState.torch && (
                  <span className="bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                    <Zap className="w-3 h-3 fill-amber-300" />
                    <span>فلش روشن</span>
                  </span>
                )}

                {currentCameraState.zoom > 1 && (
                  <span className="bg-[#4CC9F0]/30 text-[#4CC9F0] border border-[#4CC9F0]/50 px-2 py-0.5 rounded-lg font-bold font-mono">
                    {currentCameraState.zoom}x
                  </span>
                )}
              </div>

              <div className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[#4CC9F0] font-mono">
                تاخیر: ۱۶ms
              </div>
            </div>
          </div>
        </div>

        {/* Action Toast */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2 bg-[#00F59B]/15 border border-[#00F59B]/40 rounded-xl flex items-center justify-between text-xs text-[#00F59B] font-bold shadow-md"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px]">{actionFeedback}</span>
              </div>
              <span className="text-[10px] bg-[#00F59B]/25 px-2 py-0.5 rounded-full font-mono">
                کنترل زنده
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Direct Remote Camera Control Buttons (The core feature requested) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>دکمه‌های کنترل مستقیم این دوربین:</span>
            <span className="text-[10px] text-[#00F59B] font-mono">دسترسی کامل همه اعضا</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* 1. Toggle Flashlight / Torch */}
            <button
              onClick={handleToggleTorch}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentCameraState.torch
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50'
                  : isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-amber-500/50 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Flashlight
                className={`w-5 h-5 ${
                  currentCameraState.torch ? 'fill-amber-400 text-amber-400 animate-pulse' : ''
                }`}
              />
              <span>{currentCameraState.torch ? 'خاموش کردن فلش' : 'روشن کردن فلش'}</span>
            </button>

            {/* 2. Switch Lens (Front / Back) */}
            <button
              onClick={handleToggleFacing}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentCameraState.facing === 'front'
                  ? 'bg-[#4CC9F0]/25 text-[#4CC9F0] border-[#4CC9F0]/60 shadow-lg shadow-[#4CC9F0]/20'
                  : isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-[#4CC9F0]/50 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <span>
                {currentCameraState.facing === 'back' ? 'تغییر به دوربین جلو' : 'تغییر به دوربین پشت'}
              </span>
            </button>

            {/* 3. Toggle Stealth Mode */}
            <button
              onClick={handleToggleStealth}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentCameraState.stealth
                  ? 'bg-red-500/25 text-red-400 border-red-500/60 shadow-lg shadow-red-500/20'
                  : isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-red-500/50 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {currentCameraState.stealth ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              <span>{currentCameraState.stealth ? 'خروج از استتار' : 'حالت استتار (خاموشی صفحه)'}</span>
            </button>

            {/* 4. Audio Mute / Unmute */}
            <button
              onClick={handleToggleMute}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !currentCameraState.muted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : isDark
                  ? 'bg-[#141A26] text-slate-400 border-[#262C38] hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {!currentCameraState.muted ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
              <span>{!currentCameraState.muted ? 'صدای محیط فعال' : 'بی‌صدا'}</span>
            </button>

            {/* 5. Zoom Toggle */}
            <button
              onClick={handleToggleZoom}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentCameraState.zoom > 1
                  ? 'bg-[#00F59B]/25 text-[#00F59B] border-[#00F59B]/60'
                  : isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-[#00F59B]/50 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ZoomIn className="w-5 h-5" />
              <span>بزرگ‌نمایی ({currentCameraState.zoom}x)</span>
            </button>
          </div>
        </div>

        {/* Local Stream Broadcast Controls (When watching my-camera or toggling own broadcast) */}
        <div className="pt-2 border-t border-[#262C38] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-bold">
              {isStreaming
                ? 'پخش دوربین گوشی شما برای سایر اعضا فعال است'
                : 'پخش دوربین گوشی شما غیرفعال است'}
            </span>
          </div>

          <button
            onClick={handleToggleMyBroadcast}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
              isStreaming
                ? 'bg-[#FF5252] text-white hover:bg-[#FF5252]/90 shadow-[#FF5252]/20'
                : 'bg-[#00F59B] text-[#111318] hover:bg-[#00F59B]/90 shadow-[#00F59B]/25'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>توقف پخش دوربین من</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>شروع پخش دوربین من</span>
              </>
            )}
          </button>
        </div>

        {/* Foreground Service status if streaming */}
        {isStreaming && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>پخش دوربین در پس‌زمینه ادامه دارد</span>
            </div>

            {onNavigateTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('walkie')}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>بیسیم</span>
                </button>
                <button
                  onClick={() => onNavigateTab('radar')}
                  className="px-2 py-1 bg-[#141A26] hover:bg-[#1E2638] text-slate-300 border border-[#262C38] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Layers className="w-3 h-3 text-[#00F59B]" />
                  <span>رادار</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
