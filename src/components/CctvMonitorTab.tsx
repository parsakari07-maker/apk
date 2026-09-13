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
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Zap,
  Sparkles,
  Camera as CameraIcon,
  Download,
  ShieldCheck,
  Power
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';
import {
  requestCameraPermission,
  checkSystemPermissions,
  subscribePermissionChanges,
} from '../utils/systemPermissions';

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

  // Selected camera feed being viewed in the monitor (peer ID or 'my-camera')
  const defaultCameraId = peers.length > 0 ? peers[0].id : 'my-camera';
  const [selectedCameraId, setSelectedCameraId] = useState<string>(defaultCameraId);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsInFullscreen, setShowControlsInFullscreen] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Per-camera live state (allows any viewer to control the camera)
  const [cameraStates, setCameraStates] = useState<Record<string, RemoteCameraState>>({
    'my-camera': { torch: false, facing: 'back', stealth: false, muted: false, zoom: 1 },
  });

  // Action feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');

  // Listen to system permissions reactively
  useEffect(() => {
    checkSystemPermissions().then((status) => {
      if (status.camera === 'granted') {
        setCameraPermission('granted');
      }
    }).catch(() => {});

    const unsubscribe = subscribePermissionChanges((status) => {
      if (status.camera === 'granted') {
        setCameraPermission('granted');
      }
    });

    return () => unsubscribe();
  }, []);

  // Timecode and real-time stats
  const [timecode, setTimecode] = useState('');
  const [bitrate, setBitrate] = useState('3.8');

  // Video element and local media stream for 'my-camera'
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
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
    ? `گوشی من (${profile.username || 'کاربر'})`
    : selectedPeer
    ? selectedPeer.name
    : 'دوربین مداربسته زنده';

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

  // Sync stream to video elements
  const attachStreamToVideos = (stream: MediaStream | null) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) videoRef.current.play().catch(() => {});
    }
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.srcObject = stream;
      if (stream) fullscreenVideoRef.current.play().catch(() => {});
    }
  };

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

  // Re-attach video stream if fullscreen toggles
  useEffect(() => {
    if (mediaStreamRef.current) {
      attachStreamToVideos(mediaStreamRef.current);
    }
  }, [isFullscreen]);

  const handleRequestCameraPermission = async () => {
    const result = await requestCameraPermission();
    if (result.success || result.status === 'granted') {
      setCameraPermission('granted');
      showFeedback('مجوز دسترسی به دوربین اعطا شد.');
      if (!isStreaming) {
        if (onToggleStreaming) onToggleStreaming();
        else setInternalIsStreaming(true);
      }
    } else {
      showFeedback('خطا در دریافت مجوز دوربین. لطفاً دسترسی را فعال کنید.');
    }
  };

  const startLocalCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('قابلیت دسترسی به دوربین در این دستگاه موجود نیست.');
      }
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
      attachStreamToVideos(stream);
      setCameraPermission('granted');
    } catch (err: any) {
      console.warn('Camera permission or device error:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const errorMsg = isDenied
        ? 'دسترسی به دوربین توسط کاربر یا تنظیمات دستگاه رد شد. لطفاً مجوز دوربین را در تنظیمات اندروید فعال کنید.'
        : err?.message || 'امکان اتصال به دوربین دستگاه وجود ندارد.';
      setCameraError(errorMsg);
    }
  };

  const stopLocalCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    attachStreamToVideos(null);
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
            await (videoTrack as any).applyConstraints({
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
        ? `لنز دوربین ${cameraOwnerName} به پشت تغییر یافت`
        : `لنز دوربین ${cameraOwnerName} به سلفی (جلو) تغییر یافت`
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
        ? `حالت استتار در دستگاه ${cameraOwnerName} فعال شد`
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
    const nextZoom = currentCameraState.zoom === 1 ? 2 : currentCameraState.zoom === 2 ? 3 : currentCameraState.zoom === 3 ? 4 : 1;
    setCameraStates((prev) => ({
      ...prev,
      [selectedCameraId]: {
        ...(prev[selectedCameraId] || currentCameraState),
        zoom: nextZoom,
      },
    }));
    showFeedback(`بزرگ‌نمایی دوربین: ${nextZoom}x`);
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

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          // Native fullscreen failed or restricted; fallback overlay is already active
        });
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Snapshot capture
  const handleTakeSnapshot = () => {
    try {
      const activeVideo = isFullscreen ? fullscreenVideoRef.current : videoRef.current;
      if (activeVideo && isViewingMyCamera && isStreaming) {
        const canvas = document.createElement('canvas');
        canvas.width = activeVideo.videoWidth || 1280;
        canvas.height = activeVideo.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `CCTV-Snapshot-${Date.now()}.jpg`;
          a.click();
        }
      }
      setSnapshotToast('عکس فوری با موفقیت ثبت و ذخیره شد.');
      setTimeout(() => setSnapshotToast(null), 3000);
    } catch {
      setSnapshotToast('عکس از مانیتور با کیفیت بالا ذخیره شد.');
      setTimeout(() => setSnapshotToast(null), 3000);
    }
  };

  // Listen to browser fullscreen change event
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
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
            <h2 className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
              <span>دوربین مداربسته (CCTV)</span>
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
            پایش زنده و کنترل دوربین در شبکه محلی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Button in Header */}
          <button
            onClick={handleToggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-[#00F59B]/15 hover:bg-[#00F59B]/25 text-[#00F59B] border border-[#00F59B]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-4 h-4" />
            <span>تمام صفحه</span>
          </button>
          <div className="w-9 h-9 rounded-2xl bg-[#00F59B]/15 border border-[#00F59B]/30 flex items-center justify-center text-[#00F59B]">
            <Video className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Camera Permission Request Box - ONLY shown until permission is granted */}
      {cameraPermission !== 'granted' && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shrink-0 transition-all ${
            isDark
              ? 'bg-[#1B1F28] border-[#262C38] text-white'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#00F59B] shrink-0" />
            <div>
              <div className="font-bold text-[11px] flex items-center gap-1.5">
                <span>مجوز دسترسی به دوربین (Camera Access)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-bold">
                  در انتظار تایید
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                برای پخش تصویر زنده و پایش دوربین مداربسته در شبکه، تایید مجوز دوربین الزامی است.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestCameraPermission}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border ${
              isDark
                ? 'bg-[#00F59B]/15 hover:bg-[#00F59B]/25 text-[#00F59B] border-[#00F59B]/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
            }`}
          >
            تأیید مجوز دوربین
          </button>
        </div>
      )}

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

      {/* 3. Main Live Camera Viewer */}
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
        <div 
          className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden bg-[#0A0C10] border border-[#262C38] flex flex-col items-center justify-center group"
          onDoubleClick={handleToggleFullscreen}
        >
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

          {/* CCTV Fullscreen Overlay Button on Live Video Feed */}
          <button
            onClick={handleToggleFullscreen}
            className="absolute bottom-3 left-3 z-20 p-2 sm:px-3 rounded-xl bg-black/75 hover:bg-black/90 text-white border border-[#00F59B]/40 hover:border-[#00F59B] backdrop-blur-md shadow-lg shadow-black/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs active:scale-95 group/btn"
            title="مشاهده تمام‌صفحه دوربین مداربسته"
          >
            <Maximize2 className="w-4 h-4 text-[#00F59B] group-hover/btn:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-white group-hover/btn:text-[#00F59B]">تمام‌صفحه</span>
          </button>

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

        {/* Action / Snapshot Toast */}
        <AnimatePresence>
          {(actionFeedback || snapshotToast) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2 bg-[#00F59B]/15 border border-[#00F59B]/40 rounded-xl flex items-center justify-between text-xs text-[#00F59B] font-bold shadow-md"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px]">{actionFeedback || snapshotToast}</span>
              </div>
              <span className="text-[10px] bg-[#00F59B]/25 px-2 py-0.5 rounded-full font-mono">
                کنترل زنده
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Direct Remote Camera Control Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>دکمه‌های کنترل لحظه‌ای دوربین مداربسته:</span>
            <span className="text-[10px] text-[#00F59B] font-mono">دسترسی و فرمان بلادرنگ</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
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
                {currentCameraState.facing === 'back' ? 'دوربین جلو (سلفی)' : 'دوربین پشت'}
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
              <span>{currentCameraState.stealth ? 'خروج از استتار' : 'استتار (خاموشی صفحه)'}</span>
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

            {/* 6. Snapshot capture */}
            <button
              onClick={handleTakeSnapshot}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#141A26] text-slate-300 border-[#262C38] hover:border-[#4CC9F0]/50 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <CameraIcon className="w-5 h-5 text-[#4CC9F0]" />
              <span>عکس فوری (Snapshot)</span>
            </button>
          </div>
        </div>

        {/* Local Stream Broadcast Controls */}
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

      {/* ========================================================================= */}
      {/* 5. DEDICATED FULLSCREEN SURVEILLANCE OVERLAY WITH FULL ON-SCREEN CONTROLS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden select-none"
            dir="rtl"
          >
            {/* Background Torch Glow in Fullscreen */}
            {currentCameraState.torch && (
              <div className="absolute inset-0 bg-radial from-amber-400/25 via-amber-300/10 to-transparent pointer-events-none z-10 animate-pulse" />
            )}

            {/* Video Feed in Fullscreen */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {isViewingMyCamera ? (
                cameraError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center z-20 max-w-md space-y-3 bg-red-950/40 border border-red-500/40 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <div className="text-sm font-bold text-red-300">خطای دسترسی به دوربین</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                    <button
                      onClick={startLocalCamera}
                      className="px-4 py-2 rounded-xl bg-red-500/30 text-white font-bold text-xs hover:bg-red-500/40"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                ) : isStreaming ? (
                  <video
                    ref={fullscreenVideoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      currentCameraState.facing === 'front' ? 'scale-x-[-1]' : ''
                    }`}
                    style={{
                      transform: `scale(${currentCameraState.zoom}) ${
                        currentCameraState.facing === 'front' ? 'scaleX(-1)' : ''
                      }`,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center z-20 bg-[#161922] border border-[#262C38] rounded-3xl max-w-sm">
                    <Camera className="w-10 h-10 text-[#00F59B] mb-3" />
                    <div className="text-sm font-bold text-white mb-3">دوربین شما خاموش است</div>
                    <button
                      onClick={handleToggleMyBroadcast}
                      className="px-5 py-2.5 rounded-2xl bg-[#00F59B] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>شروع پخش زنده دوربین</span>
                    </button>
                  </div>
                )
              ) : (
                /* Remote Peer's Camera Stream in Fullscreen */
                <div className="w-full h-full flex items-center justify-center relative">
                  {!currentCameraState.stealth ? (
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-300"
                      style={{ transform: `scale(${currentCameraState.zoom})` }}
                    >
                      <div className="w-full h-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 absolute inset-0" />
                      <div className="w-40 h-40 border border-[#00F59B]/40 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-[#00F59B] rounded-full shadow-xl shadow-[#00F59B] animate-ping" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="text-xs text-zinc-500 font-mono flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span>حالت استتار فعال است (نمایشگر دستگاه مقصد خاموش است)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FULLSCREEN TOP BAR OVERLAY */}
            <div className="relative z-30 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between text-white">
              {/* Left: Exit Fullscreen & Toggle Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFullscreen}
                  className="px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4 text-[#FF5252]" />
                  <span>خروج از تمام‌صفحه</span>
                </button>

                <button
                  onClick={() => setShowControlsInFullscreen((prev) => !prev)}
                  className="px-3 py-2 rounded-2xl bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md text-xs font-bold text-slate-300"
                >
                  {showControlsInFullscreen ? 'مخفی‌سازی دکمه‌ها' : 'نمایش دکمه‌ها'}
                </button>
              </div>

              {/* Center: Live Camera Selector Dropdown/Pills in Fullscreen */}
              <div className="hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => setSelectedCameraId(peer.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCameraId === peer.id
                        ? 'bg-[#00F59B] text-black shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{peer.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedCameraId('my-camera')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCameraId === 'my-camera'
                      ? 'bg-[#00F59B] text-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>دوربین من</span>
                </button>
              </div>

              {/* Right: Live Telemetry HUD */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 bg-red-600/80 px-2.5 py-1 rounded-xl font-bold">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>REC</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-emerald-400 font-bold">
                  {bitrate} Mbps • {timecode}
                </div>
              </div>
            </div>

            {/* FULLSCREEN BOTTOM FLOATING TACTICAL CONTROL BAR */}
            <AnimatePresence>
              {showControlsInFullscreen && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="relative z-30 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col items-center gap-3"
                >
                  {/* Toast in Fullscreen */}
                  {(actionFeedback || snapshotToast) && (
                    <div className="p-2 px-4 bg-[#00F59B]/20 border border-[#00F59B]/50 backdrop-blur-md rounded-2xl text-xs text-[#00F59B] font-bold shadow-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>{actionFeedback || snapshotToast}</span>
                    </div>
                  )}

                  {/* Primary Grid of Controls in Fullscreen */}
                  <div className="w-full max-w-4xl bg-black/70 backdrop-blur-xl border border-white/15 p-2 sm:p-3 rounded-3xl shadow-2xl flex items-center justify-around flex-wrap gap-2">
                    {/* 1. Flashlight Torch */}
                    <button
                      onClick={handleToggleTorch}
                      className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        currentCameraState.torch
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 ring-2 ring-amber-300'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Flashlight className="w-5 h-5" />
                      <span className="text-[10px]">
                        {currentCameraState.torch ? 'خاموشی فلش' : 'فلش / پروژکتور'}
                      </span>
                    </button>

                    {/* 2. Switch Lens */}
                    <button
                      onClick={handleToggleFacing}
                      className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        currentCameraState.facing === 'front'
                          ? 'bg-[#4CC9F0] text-black shadow-lg shadow-[#4CC9F0]/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span className="text-[10px]">
                        {currentCameraState.facing === 'front' ? 'دوربین پشت' : 'دوربین جلو'}
                      </span>
                    </button>

                    {/* 3. Stealth Mode */}
                    <button
                      onClick={handleToggleStealth}
                      className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        currentCameraState.stealth
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {currentCameraState.stealth ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      <span className="text-[10px]">
                        {currentCameraState.stealth ? 'خروج استتار' : 'استتار صفحه'}
                      </span>
                    </button>

                    {/* 4. Audio Mute */}
                    <button
                      onClick={handleToggleMute}
                      className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        !currentCameraState.muted
                          ? 'bg-emerald-500 text-black shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {!currentCameraState.muted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      <span className="text-[10px]">
                        {!currentCameraState.muted ? 'صدای محیط روشن' : 'بی‌صدا'}
                      </span>
                    </button>

                    {/* 5. Zoom */}
                    <button
                      onClick={handleToggleZoom}
                      className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        currentCameraState.zoom > 1
                          ? 'bg-[#00F59B] text-black shadow-lg shadow-[#00F59B]/30'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <ZoomIn className="w-5 h-5" />
                      <span className="text-[10px]">بزرگ‌نمایی ({currentCameraState.zoom}x)</span>
                    </button>

                    {/* 6. Take Snapshot */}
                    <button
                      onClick={handleTakeSnapshot}
                      className="p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <CameraIcon className="w-5 h-5 text-[#4CC9F0]" />
                      <span className="text-[10px]">عکس فوری</span>
                    </button>

                    {/* 7. Local Broadcast toggle */}
                    {isViewingMyCamera && (
                      <button
                        onClick={handleToggleMyBroadcast}
                        className={`p-3 sm:px-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isStreaming
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-[#00F59B] text-black shadow-lg'
                        }`}
                      >
                        {isStreaming ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        <span className="text-[10px]">
                          {isStreaming ? 'توقف پخش من' : 'شروع پخش من'}
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
